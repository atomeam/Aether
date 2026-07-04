/**
 * Kraken Prop survival-first risk engine.
 *
 * Ground truth (VERIFIED from Kraken support docs):
 *  - MDL = 3% of the day-start value, recalculated daily at 00:30 UTC.
 *  - MDD = fixed lifetime floor computed from the STARTING balance; never resets.
 *  - Realized AND unrealized P&L both count against MDL and MDD.
 *  - Trading fees and funding fees count against the buffers.
 *
 * ASSUMPTION: MDL is measured against day-start EQUITY (balance + open uPnL at
 * 00:30 UTC). Kraken's docs say "recalculated daily"; the exact base
 * (balance vs equity) is not stated. We use the more conservative reading:
 * whichever the operator enters as dayStart should be the value Kraken shows
 * as the day's baseline.
 */

export interface AccountInputs {
  /** Account starting balance at eval purchase, e.g. 25000 */
  startingBalance: number;
  /** MDL percent, Kraken publishes 3 (percent of day-start) */
  mdlPct: number;
  /** MDD percent from starting balance (NEEDS INPUT per plan tier, e.g. 6) */
  mddPct: number;
  /** Profit target percent (per plan tier) */
  profitTargetPct: number;
  /** Day-start value at last 00:30 UTC reset */
  dayStart: number;
  /** Current account balance (realized) */
  balance: number;
  /** Open unrealized P&L (negative when losing) */
  unrealizedPnl: number;
  /** Fees already paid today that are NOT yet reflected in balance (0 if reflected) */
  pendingFees: number;
  /** Taker fee rate per side as a percent, e.g. 0.05 */
  feeRatePct: number;
  /** Estimated funding rate per 8h period as a percent, e.g. 0.01 */
  fundingRatePct: number;
  /** Total notional of currently open positions */
  openNotional: number;
}

export interface RiskState {
  equity: number;
  /** Dollars of daily loss allowed from day-start */
  mdlLimit: number;
  /** Dollar loss so far today (realized + unrealized + pending fees), >= 0 when losing */
  dayLoss: number;
  /** Dollars remaining before daily breach */
  remainingMdl: number;
  /** Equity level that triggers MDL breach today */
  mdlBreachEquity: number;
  /** Lifetime floor in dollars */
  mddFloor: number;
  /** Dollars remaining before lifetime breach */
  remainingMdd: number;
  /** The binding buffer: min(remainingMdl, remainingMdd) */
  bindingBuffer: number;
  /** Which limit binds */
  bindingLimit: "MDL" | "MDD";
  /** Fraction of today's MDL consumed, 0..1+ */
  mdlUsedFrac: number;
  /** Fraction of the lifetime MDD buffer consumed, 0..1+ */
  mddUsedFrac: number;
  status: "GREEN" | "YELLOW" | "RED" | "BREACHED";
  /** % adverse move on open notional that breaches (Infinity if flat) */
  breachMovePct: number;
  profitTarget: number;
  toTarget: number;
}

export function computeRiskState(a: AccountInputs): RiskState {
  const equity = a.balance + a.unrealizedPnl - a.pendingFees;
  const mdlLimit = a.dayStart * (a.mdlPct / 100);
  const dayLoss = a.dayStart - equity;
  const remainingMdl = mdlLimit - dayLoss;
  const mdlBreachEquity = a.dayStart - mdlLimit;
  const mddFloor = a.startingBalance * (1 - a.mddPct / 100);
  const remainingMdd = equity - mddFloor;
  const bindingBuffer = Math.min(remainingMdl, remainingMdd);
  const bindingLimit = remainingMdl <= remainingMdd ? "MDL" : "MDD";
  const mdlUsedFrac = mdlLimit > 0 ? Math.max(0, dayLoss) / mdlLimit : 1;
  const mddBudget = a.startingBalance * (a.mddPct / 100);
  const mddUsedFrac =
    mddBudget > 0 ? Math.max(0, mddBudget - remainingMdd) / mddBudget : 1;
  const worstFrac = Math.max(mdlUsedFrac, mddUsedFrac);

  let status: RiskState["status"];
  if (bindingBuffer <= 0) status = "BREACHED";
  else if (worstFrac >= 0.6) status = "RED";
  else if (worstFrac >= 0.3) status = "YELLOW";
  else status = "GREEN";

  const breachMovePct =
    a.openNotional > 0 ? (bindingBuffer / a.openNotional) * 100 : Infinity;

  const profitTarget = a.startingBalance * (1 + a.profitTargetPct / 100);

  return {
    equity,
    mdlLimit,
    dayLoss,
    remainingMdl,
    mdlBreachEquity,
    mddFloor,
    remainingMdd,
    bindingBuffer,
    bindingLimit,
    mdlUsedFrac,
    mddUsedFrac,
    status,
    breachMovePct,
    profitTarget,
    toTarget: profitTarget - equity,
  };
}

/** Round-trip commission on a notional at a per-side fee rate (percent). */
export function roundTripFees(notional: number, feeRatePct: number): number {
  return notional * (feeRatePct / 100) * 2;
}

/** Funding drag for holding a notional across n 8h periods (percent per period). */
export function fundingDrag(
  notional: number,
  fundingRatePct: number,
  periods: number,
): number {
  return notional * (fundingRatePct / 100) * periods;
}

export interface SizingInputs {
  /** Dollars the operator is willing to lose on this trade (pre-fee) */
  riskDollars: number;
  /** Stop distance from entry, percent, e.g. 1.5 */
  stopDistancePct: number;
  feeRatePct: number;
  /** Funding periods expected to hold (0 for intraday) */
  fundingPeriods: number;
  fundingRatePct: number;
  leverage: number;
}

export interface SizingResult {
  /** Max notional such that stop-out loss + fees + funding <= riskDollars */
  maxNotional: number;
  margin: number;
  estFees: number;
  estFunding: number;
  totalLossAtStop: number;
  /**
   * Approximate distance to liquidation as percent of price for an isolated
   * position: ~ (1/leverage - maintenanceMarginPct). ASSUMPTION: 0.5%
   * maintenance margin; verify per contract on Kraken.
   */
  liqDistancePct: number;
  /** True when the stop sits beyond estimated liquidation — the stop is fake */
  stopBeyondLiquidation: boolean;
}

const MAINTENANCE_MARGIN_PCT = 0.5;

export function sizePosition(s: SizingInputs): SizingResult {
  // loss(notional) = notional * (stop% + 2*fee% + periods*funding%) / 100
  const dragPct =
    s.stopDistancePct +
    2 * s.feeRatePct +
    s.fundingPeriods * s.fundingRatePct;
  const maxNotional = dragPct > 0 ? (s.riskDollars * 100) / dragPct : 0;
  const estFees = roundTripFees(maxNotional, s.feeRatePct);
  const estFunding = fundingDrag(maxNotional, s.fundingRatePct, s.fundingPeriods);
  const liqDistancePct = 100 / s.leverage - MAINTENANCE_MARGIN_PCT;
  return {
    maxNotional,
    margin: s.leverage > 0 ? maxNotional / s.leverage : maxNotional,
    estFees,
    estFunding,
    totalLossAtStop:
      maxNotional * (s.stopDistancePct / 100) + estFees + estFunding,
    liqDistancePct,
    stopBeyondLiquidation: s.stopDistancePct >= liqDistancePct,
  };
}

/**
 * Survival-first safe next-trade loss: half of the binding buffer, capped at
 * a fixed fraction of day-start. Default 0.5% — sized for accounts where the
 * lifetime MDD equals a single full MDL day (e.g. Advanced 3%/3%): six
 * losing trades to consume the whole lifetime buffer, not two.
 */
export function safeNextTradeLoss(
  state: RiskState,
  dayStart: number,
  perTradeCapPct = 0.5,
): number {
  return Math.max(
    0,
    Math.min(state.bindingBuffer * 0.5, dayStart * (perTradeCapPct / 100)),
  );
}

/** Milliseconds until the next 00:30 UTC reset. */
export function msToNextReset(now: Date = new Date()): number {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 30, 0),
  );
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}
