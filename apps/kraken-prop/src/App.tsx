import { useEffect, useMemo, useState } from "react";
import {
  computeRiskState,
  fundingDrag,
  msToNextReset,
  roundTripFees,
  safeNextTradeLoss,
  sizePosition,
  type AccountInputs,
} from "./risk";

const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
const pct = (n: number) => `${n.toFixed(2)}%`;

function useCountdown(): string {
  const [ms, setMs] = useState(msToNextReset());
  useEffect(() => {
    const t = setInterval(() => setMs(msToNextReset()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function localResetTime(): string {
  const now = new Date();
  const next = new Date(now.getTime() + msToNextReset(now));
  return next.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

interface NumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  hint?: string;
}
function NumField({ label, value, onChange, step = 1, hint }: NumFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

const CHECKLIST = [
  "I know my exact stop price before entry",
  "This loss (incl. fees) fits inside 'safe next-trade loss'",
  "I am under 2 losses today (3rd loss = done for the day)",
  "No open position already eats into the buffer",
  "This is a planned setup, not a revenge trade",
  "If holding past 8:30 PM ET: funding drag is accounted for",
];

export default function App() {
  const [a, setA] = useState<AccountInputs>({
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
  });
  const [split, setSplit] = useState<"90/10" | "80/20">("90/10");
  const [stopPct, setStopPct] = useState(1.5);
  const [leverage, setLeverage] = useState(5);
  const [overnight, setOvernight] = useState(false);
  const [checks, setChecks] = useState<boolean[]>(CHECKLIST.map(() => false));

  const set = (k: keyof AccountInputs) => (v: number) =>
    setA((prev) => ({ ...prev, [k]: v }));

  const state = useMemo(() => computeRiskState(a), [a]);
  const safeLoss = safeNextTradeLoss(state, a.dayStart);
  const sizing = useMemo(
    () =>
      sizePosition({
        riskDollars: safeLoss,
        stopDistancePct: stopPct,
        feeRatePct: a.feeRatePct,
        fundingPeriods: overnight ? 3 : 0,
        fundingRatePct: a.fundingRatePct,
        leverage,
      }),
    [safeLoss, stopPct, a.feeRatePct, overnight, a.fundingRatePct, leverage],
  );
  const countdown = useCountdown();
  const allChecked = checks.every(Boolean);
  const canTrade = allChecked && state.status !== "RED" && state.status !== "BREACHED" && safeLoss > 0;

  const openFees = roundTripFees(a.openNotional, a.feeRatePct);
  const nearBreach =
    a.openNotional > 0 && state.bindingBuffer - openFees < state.mdlLimit * 0.25;

  return (
    <div className={`app status-${state.status.toLowerCase()}`}>
      <header className="banners">
        <div className="banner hard">DO NOT BREACH — open loss counts, fees count</div>
        <div className="banner reset">
          Daily reset (MDL recalc) at 00:30 UTC — {localResetTime()} local — in{" "}
          <strong>{countdown}</strong>
        </div>
        <div className="banner mdd">MDD floor {usd(state.mddFloor)} NEVER resets</div>
      </header>

      <div className={`status-strip ${state.status.toLowerCase()}`}>
        <span className="status-word">{state.status}</span>
        <span>
          Binding limit: <strong>{state.bindingLimit}</strong> · buffer{" "}
          <strong>{usd(Math.max(0, state.bindingBuffer))}</strong>
        </span>
        <span>
          Safe next-trade loss: <strong>{usd(safeLoss)}</strong>
        </span>
      </div>

      {nearBreach && (
        <div className="warn">
          ⚠ Open positions + estimated close fees ({usd(openFees)}) leave less
          than a quarter of one MDL. Reduce exposure now.
        </div>
      )}
      {state.status === "BREACHED" && (
        <div className="warn">✕ A limit is breached at current equity. Stop.</div>
      )}

      <main className="grid">
        <section className="card">
          <h2>Account &amp; plan</h2>
          <NumField label="Starting balance ($)" value={a.startingBalance} onChange={set("startingBalance")} step={1000} />
          <NumField label="Profit target (%)" value={a.profitTargetPct} onChange={set("profitTargetPct")} step={0.5} />
          <NumField label="MDL (%)" value={a.mdlPct} onChange={set("mdlPct")} step={0.5} hint="Kraken publishes 3%" />
          <NumField label="MDD from start (%)" value={a.mddPct} onChange={set("mddPct")} step={0.5} hint="NEEDS INPUT: check your plan tier" />
          <label className="field">
            <span>Profit split</span>
            <div className="toggle">
              {(["90/10", "80/20"] as const).map((s) => (
                <button key={s} className={split === s ? "on" : ""} onClick={() => setSplit(s)}>
                  {s}
                </button>
              ))}
            </div>
            <small>90/10 must be chosen at purchase — it cannot be changed later.</small>
          </label>
        </section>

        <section className="card">
          <h2>Live state</h2>
          <NumField label="Day-start value ($)" value={a.dayStart} onChange={set("dayStart")} step={100} hint="Value at last 00:30 UTC reset" />
          <NumField label="Current balance ($)" value={a.balance} onChange={set("balance")} step={100} />
          <NumField label="Unrealized P&L ($)" value={a.unrealizedPnl} onChange={set("unrealizedPnl")} step={10} hint="Negative when losing — it counts" />
          <NumField label="Unposted fees today ($)" value={a.pendingFees} onChange={set("pendingFees")} step={1} />
          <NumField label="Open notional ($)" value={a.openNotional} onChange={set("openNotional")} step={1000} />
          <NumField label="Taker fee per side (%)" value={a.feeRatePct} onChange={set("feeRatePct")} step={0.01} />
          <NumField label="Funding per 8h (%)" value={a.fundingRatePct} onChange={set("fundingRatePct")} step={0.005} />
        </section>

        <section className="card">
          <h2>Buffers</h2>
          <dl>
            <div><dt>Equity (incl. open P&L, fees)</dt><dd>{usd(state.equity)}</dd></div>
            <div><dt>Loss so far today</dt><dd>{usd(Math.max(0, state.dayLoss))}</dd></div>
            <div><dt>MDL limit today</dt><dd>{usd(state.mdlLimit)}</dd></div>
            <div><dt>Remaining MDL buffer</dt><dd className={state.remainingMdl < state.mdlLimit * 0.4 ? "bad" : ""}>{usd(state.remainingMdl)}</dd></div>
            <div><dt>MDL breach equity</dt><dd>{usd(state.mdlBreachEquity)}</dd></div>
            <div><dt>MDD floor (lifetime)</dt><dd>{usd(state.mddFloor)}</dd></div>
            <div><dt>Remaining MDD buffer</dt><dd className={state.remainingMdd < state.mdlLimit ? "bad" : ""}>{usd(state.remainingMdd)}</dd></div>
            <div><dt>Profit target</dt><dd>{usd(state.profitTarget)} ({usd(Math.max(0, state.toTarget))} to go)</dd></div>
            <div>
              <dt>Breach if open position moves against me</dt>
              <dd className="big">
                {a.openNotional > 0 ? pct(state.breachMovePct) : "— (flat)"}
              </dd>
            </div>
          </dl>
          <div className="meter">
            <div
              className="fill"
              style={{ width: `${Math.min(100, state.mdlUsedFrac * 100)}%` }}
            />
          </div>
          <small>{pct(state.mdlUsedFrac * 100)} of today's MDL used</small>
        </section>

        <section className="card">
          <h2>Position sizing (risk = safe next-trade loss)</h2>
          <NumField label="Stop distance (%)" value={stopPct} onChange={setStopPct} step={0.1} />
          <NumField label="Leverage (×)" value={leverage} onChange={setLeverage} step={1} />
          <label className="field checkbox">
            <input type="checkbox" checked={overnight} onChange={(e) => setOvernight(e.target.checked)} />
            <span>Holding overnight (~3 funding periods)</span>
          </label>
          <dl>
            <div><dt>Max notional</dt><dd className="big">{usd(sizing.maxNotional)}</dd></div>
            <div><dt>Margin required</dt><dd>{usd(sizing.margin)}</dd></div>
            <div><dt>Round-trip fees</dt><dd>{usd(sizing.estFees)}</dd></div>
            <div><dt>Funding drag</dt><dd>{usd(sizing.estFunding)} {overnight && <em> (also drains buffer: {usd(fundingDrag(a.openNotional, a.fundingRatePct, 3))} on current open)</em>}</dd></div>
            <div><dt>Total loss at stop</dt><dd>{usd(sizing.totalLossAtStop)}</dd></div>
            <div><dt>Est. liquidation distance</dt><dd>{pct(sizing.liqDistancePct)}</dd></div>
          </dl>
          {sizing.stopBeyondLiquidation && (
            <div className="warn">⚠ Stop is beyond estimated liquidation at {leverage}× — the exchange stops you out first. Lower leverage.</div>
          )}
          {overnight && (
            <div className="warn soft">Overnight holds bleed funding against a fixed MDD. Default policy: don't.</div>
          )}
        </section>

        <section className="card">
          <h2>Can I take this trade?</h2>
          <ul className="checklist">
            {CHECKLIST.map((c, i) => (
              <li key={c}>
                <label>
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={(e) =>
                      setChecks((p) => p.map((v, j) => (j === i ? e.target.checked : v)))
                    }
                  />
                  {c}
                </label>
              </li>
            ))}
          </ul>
          <div className={`verdict ${canTrade ? "yes" : "no"}`}>
            {canTrade
              ? `YES — risk at most ${usd(safeLoss)} on this trade`
              : state.status === "RED" || state.status === "BREACHED"
                ? "NO — risk status forbids new trades"
                : safeLoss <= 0
                  ? "NO — no buffer left today"
                  : "NOT YET — complete the checklist"}
          </div>
        </section>
      </main>

      <footer>
        <small>
          Simulated-eval risk tool. VERIFIED rules: 3% MDL @ 00:30 UTC, fixed
          MDD from start, realized+unrealized and all fees count, 90/10 chosen
          at purchase, verification required before funding. Everything else is
          labeled in-app. Not trading advice.
        </small>
      </footer>
    </div>
  );
}
