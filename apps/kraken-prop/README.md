# Kraken Prop Survival Dashboard

Survival-first risk system for the Kraken Prop evaluation. Goal ordering:
**do not breach → finish the eval → repeatability**. Not profit maximization,
and not trading advice.

## Run locally

```bash
npm install            # from repo root (workspace)
npm run dev -w @aether/kraken-prop    # http://localhost:5199
npm run test -w @aether/kraken-prop   # 15 unit tests on the risk math
npm run build -w @aether/kraken-prop
```

## Ground truth (VERIFIED from Kraken support docs)

- Evaluation is simulated; hit profit target without breaching risk rules.
- **MDL: 3%**, recalculated daily at **00:30 UTC** (8:30 PM New York during EDT,
  7:30 PM during EST — the dashboard always converts to your local time).
- **MDD: fixed lifetime floor from starting balance; never resets.**
- **Realized + unrealized P&L both count.** Trading and funding **fees count**.
- **90/10 split must be chosen at purchase.** Full verification required before
  funded activation/payouts.

Sources: Kraken support — "How Kraken Prop Evaluations Work",
"Kraken Prop Plans & Pricing", "Verification Requirements for Kraken Prop".

## Risk model (see `src/risk.ts`)

Let `S` = starting balance, `D` = day-start value at last 00:30 UTC reset,
`B` = current balance, `U` = unrealized P&L, `F` = fees not yet posted.

| Quantity | Formula |
|---|---|
| Equity | `E = B + U − F` |
| MDL limit today | `D × 3%` |
| Loss so far today (realized + unrealized + fees) | `D − E` |
| Remaining MDL buffer | `D × 3% − (D − E)` |
| MDL breach equity | `D × 97%` |
| MDD floor (lifetime) | `S × (1 − MDD%)` |
| Remaining MDD buffer | `E − floor` |
| Binding buffer | `min(remaining MDL, remaining MDD)` |
| Breach move on open notional `N` | `bindingBuffer / N × 100%` |
| Round-trip commission | `N × feeRate × 2` |
| Funding drag over `k` 8h periods | `N × fundingRate × k` |
| Fee-adjusted max notional for risk `R`, stop `s%` | `R / (s% + 2·fee% + k·funding%)` |
| Liquidation distance (isolated, approx) | `1/leverage − maintenanceMargin` |
| Safe next-trade loss | `min(bindingBuffer × 0.5, D × 0.5%)` |

## CANONICAL account for this mission (KRAKEN-001)

**Advanced $10k · 9% profit target · 3% MDL · 3% MDD.** These are the
dashboard defaults.

| | $10k Advanced (canonical) |
|---|---|
| MDL (3% of day-start, day 1) | $300 |
| MDD floor (3% from start) | **$9,700 — forever** |
| Lifetime buffer day 1 | $300 |
| Profit target | $10,900 |
| Personal daily stop (1%) | $100 |
| Safe next-trade loss (0.5%) | $50 |
| Max notional @ 1.5% stop, 0.05%/side fees | ~$3,125 |
| Full MDL days until MDD breach | **1** |

The structural fact that dominates this plan: **the lifetime MDD equals a
single full MDL day.** One max-loss day ends the eval. That is why the
personal daily stop is 1% (a third of Kraken's 3%) and per-trade risk is
0.5% — six losing trades, not two, to consume the lifetime buffer.

### Reference math at other sizes (MDD **ASSUMPTION 6%** — verify per tier)

| | $25k | $50k | $100k |
|---|---|---|---|
| MDL day 1 | $750 | $1,500 | $3,000 |
| MDD floor (6%) | $23,500 | $47,000 | $94,000 |
| Lifetime buffer day 1 | $1,500 | $3,000 | $6,000 |
| Safe next-trade loss (0.5%) | $125 | $250 | $500 |
| Full MDL days until MDD breach | 2 | 2 | 2 |

## Labels

- **VERIFIED**: the five ground-truth rules above.
- **VERIFIED (mission)**: canonical account is Advanced $10k, 9% target,
  3% MDL, 3% MDD (per KRAKEN-001 mission page).
- **ASSUMPTION**: MDL base is the day-start value shown by Kraken at 00:30 UTC
  (enter whatever Kraken displays as the baseline); taker fee
  0.05%/side and funding 0.01%/8h are editable defaults; maintenance margin
  0.5% in the liquidation estimate.
- **NEEDS INPUT**: your plan tier's exact MDD%, profit target %, fee schedule,
  and the per-contract maintenance margin.
- **RISK**: this tool mirrors Kraken's accounting, it does not read it. The
  number on Kraken's own dashboard is always the authority.
