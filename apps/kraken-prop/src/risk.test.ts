import { describe, expect, it } from "vitest";
import {
  computeRiskState,
  fundingDrag,
  msToNextReset,
  roundTripFees,
  safeNextTradeLoss,
  sizePosition,
  type AccountInputs,
} from "./risk";

const base: AccountInputs = {
  startingBalance: 25000,
  mdlPct: 3,
  mddPct: 6,
  profitTargetPct: 10,
  dayStart: 25000,
  balance: 25000,
  unrealizedPnl: 0,
  pendingFees: 0,
  feeRatePct: 0.05,
  fundingRatePct: 0.01,
  openNotional: 0,
};

describe("computeRiskState", () => {
  it("fresh 25k account", () => {
    const s = computeRiskState(base);
    expect(s.mdlLimit).toBe(750);
    expect(s.remainingMdl).toBe(750);
    expect(s.mddFloor).toBe(23500);
    expect(s.remainingMdd).toBe(1500);
    expect(s.bindingLimit).toBe("MDL");
    expect(s.status).toBe("GREEN");
    expect(s.profitTarget).toBeCloseTo(27500);
  });

  it("unrealized loss counts against both buffers", () => {
    const s = computeRiskState({ ...base, unrealizedPnl: -400 });
    expect(s.equity).toBe(24600);
    expect(s.dayLoss).toBe(400);
    expect(s.remainingMdl).toBe(350);
    expect(s.remainingMdd).toBe(1100);
    expect(s.status).toBe("YELLOW");
  });

  it("pending fees count", () => {
    const s = computeRiskState({ ...base, pendingFees: 50 });
    expect(s.equity).toBe(24950);
    expect(s.remainingMdl).toBe(700);
  });

  it("breach detection", () => {
    const s = computeRiskState({ ...base, unrealizedPnl: -800 });
    expect(s.status).toBe("BREACHED");
    expect(s.remainingMdl).toBeLessThan(0);
  });

  it("MDD binds after prior losing days", () => {
    // Account drew down to 23,900 on prior days; today started there.
    const s = computeRiskState({ ...base, dayStart: 23900, balance: 23900 });
    expect(s.remainingMdl).toBeCloseTo(717);
    expect(s.remainingMdd).toBeCloseTo(400);
    expect(s.bindingLimit).toBe("MDD");
    expect(s.status).toBe("RED"); // 73% of lifetime MDD consumed
  });

  it("canonical Advanced $10k / 9% target / 3% MDL / 3% MDD", () => {
    const s = computeRiskState({
      ...base,
      startingBalance: 10000,
      mddPct: 3,
      profitTargetPct: 9,
      dayStart: 10000,
      balance: 10000,
    });
    expect(s.mdlLimit).toBe(300);
    expect(s.mddFloor).toBe(9700);
    expect(s.remainingMdd).toBe(300); // lifetime = exactly ONE max-loss day
    expect(s.status).toBe("GREEN"); // fresh account starts green
    expect(s.profitTarget).toBeCloseTo(10900);
    expect(safeNextTradeLoss(s, 10000)).toBeCloseTo(50);
  });

  it("breach move percent on open notional", () => {
    const s = computeRiskState({ ...base, openNotional: 15000 });
    expect(s.breachMovePct).toBeCloseTo((750 / 15000) * 100); // 5%
  });
});

describe("fees and funding", () => {
  it("round trip commission", () => {
    expect(roundTripFees(10000, 0.05)).toBe(10);
  });
  it("overnight funding, 3 periods", () => {
    expect(fundingDrag(10000, 0.01, 3)).toBe(3);
  });
});

describe("sizePosition", () => {
  it("fee-adjusted notional for $150 risk, 1.5% stop", () => {
    const r = sizePosition({
      riskDollars: 150,
      stopDistancePct: 1.5,
      feeRatePct: 0.05,
      fundingPeriods: 0,
      fundingRatePct: 0.01,
      leverage: 5,
    });
    // 150 / (1.5 + 0.1)% = 9375
    expect(r.maxNotional).toBeCloseTo(9375);
    expect(r.totalLossAtStop).toBeCloseTo(150);
    expect(r.margin).toBeCloseTo(1875);
    expect(r.stopBeyondLiquidation).toBe(false);
  });

  it("flags a stop beyond liquidation at high leverage", () => {
    const r = sizePosition({
      riskDollars: 150,
      stopDistancePct: 2,
      feeRatePct: 0.05,
      fundingPeriods: 0,
      fundingRatePct: 0.01,
      leverage: 50,
    });
    expect(r.liqDistancePct).toBeCloseTo(1.5);
    expect(r.stopBeyondLiquidation).toBe(true);
  });
});

describe("safeNextTradeLoss", () => {
  it("caps at 0.5% of day-start on a fresh account", () => {
    const s = computeRiskState(base);
    expect(safeNextTradeLoss(s, base.dayStart)).toBeCloseTo(125);
  });
  it("halves a depleted buffer", () => {
    const s = computeRiskState({ ...base, unrealizedPnl: -600 });
    expect(safeNextTradeLoss(s, base.dayStart)).toBeCloseTo(75);
  });
  it("zero when breached", () => {
    const s = computeRiskState({ ...base, unrealizedPnl: -900 });
    expect(safeNextTradeLoss(s, base.dayStart)).toBe(0);
  });
});

describe("msToNextReset", () => {
  it("before 00:30 UTC", () => {
    const now = new Date(Date.UTC(2026, 6, 4, 0, 0, 0));
    expect(msToNextReset(now)).toBe(30 * 60 * 1000);
  });
  it("after 00:30 UTC rolls to next day", () => {
    const now = new Date(Date.UTC(2026, 6, 4, 12, 30, 0));
    expect(msToNextReset(now)).toBe(12 * 60 * 60 * 1000);
  });
});
