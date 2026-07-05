# BTC Bounce Trade Setup

A repeatable mean-reversion **long** playbook for Bitcoin: buy a confirmed
bounce off a defined support zone during a *fear* sentiment regime, with a
tight invalidation and pre-defined targets. Designed to be conservative
enough for a prop-firm evaluation (small fixed risk, hard invalidation, no
forced entries).

> ⚠️ **Not financial advice.** This document is trading *education / a
> planning template*, not a recommendation to buy or sell any asset.
> Crypto is volatile and you can lose your entire position. Every price
> level below is **illustrative** and was true only at the snapshot time
> shown — **re-pull live data and re-derive the levels before risking any
> capital.** Never trade money you can't afford to lose.

---

## 1. Market snapshot (must be refreshed before use)

Captured **2026-07-05**. These are *reference* values only — sources
disagree (different methodologies, spot vs. derivatives volume, stablecoin
handling), so treat them as a range, not gospel, and re-check live.

| Factor | Value (2026-07-05) | Notes |
| --- | --- | --- |
| BTC price | ~$62,900 | Roughly **flat-to-slightly-up** on the day (~+0.7% 24h) |
| Fear & Greed Index | **Fear** zone, ~22–36 across providers | `alternative.me`, `cfgi.io`, and others disagree; all read *Fear* |
| BTC 24h spot volume | ~$17.5B (CoinMarketCap) | Thinner than a trending market — expect whipsaws/stop-hunts |
| BTC dominance | ~55.5–56.5% | Elevated → capital concentrating in BTC over alts |

**Correction vs. the original hand-off note:** that note listed BTC as
`−0.85% / $62,670`, `Fear & Greed 27`, and `24h volume $48.23B`. Live data
on 2026-07-05 shows BTC roughly **flat-to-up**, a Fear reading that varies
by source (not a single "27"), and spot volume nearer **$17.5B**. The
*regime* (Fear + BTC dominance rising) holds; the *precise numbers do not*.
This is exactly why the levels below are illustrative and must be
re-derived live.

Sources: CoinMarketCap, CoinGecko, Coinbase, alternative.me, cfgi.io,
milkroad.com (fetched via web search 2026-07-05).

---

## 2. Thesis

A *Fear* sentiment regime while BTC holds above a stacked demand zone is a
classic mean-reversion long: sellers are exhausted, sentiment is
one-sided, and a defended support level gives a **tight, objective
invalidation**. The edge is not prediction — it's asymmetry: small defined
risk below support, larger defined reward into the next resistance.

The trade only exists **if** two things are still true when you check:
1. Sentiment is still in *Fear* (index < 40).
2. Price is at/just above the support zone — **not** already extended away
   from it.

If BTC has run well above the zone (as it partly had on 2026-07-05 at
~$62.9k), you **wait for a pullback** to the zone rather than chasing.

---

## 3. The setup

**Direction:** Long (mean-reversion bounce)
**Instrument:** BTC/USD (highest liquidity, per the repo's Kraken knowledge base)
**Trigger:** Do **not** front-run. Enter only on a **confirmed bullish
rejection candle** — a 1h or 4h close with a long lower wick and a volume
spike — printed *inside* the support zone.

| Parameter | Illustrative level (re-derive live) | Basis |
| --- | --- | --- |
| Support / entry zone | **$61,800 – $62,200** | Prior demand shelf near the $62k round number |
| Stop-loss | **$61,200** | *Below* the obvious round number, to dodge stop-hunts in thin liquidity |
| Target 1 | **$63,500** | First resistance; scale out a portion |
| Target 2 | **$64,200** | Extended target if momentum carries |
| Risk per entry (mid-zone → stop) | ~1.3% (~1.6% from zone top) | $800 from $62,000 |
| Reward:Risk to T1 | ≈ 1.9 : 1 | $1,500 / $800 |
| Reward:Risk to T2 | ≈ 2.75 : 1 | $2,200 / $800 |

**Why the stop sits at $61,200, not $62,000:** thin books make the obvious
round number a magnet for stop-hunts. Placing the stop below the zone
avoids being wicked out of an otherwise valid trade. The cost is a slightly
wider risk — which the position sizing below absorbs.

---

## 4. Position sizing & prop-firm rules

Size **off the stop distance**, never off a fixed contract count. Risk a
fixed fraction of the evaluation account per trade:

- **Risk budget:** 0.5% – 1.0% of account equity per trade.
  - On a $100k eval: **$500 – $1,000** max loss.
  - Position size = risk budget ÷ (entry − stop distance in $).
    e.g. $750 risk ÷ $800 stop distance ≈ **0.94 BTC notional** (before leverage math).
- **Leverage:** ≤ 2x. The Kraken knowledge base allows up to 5x, but 2x is
  the conservative recommendation and keeps liquidation far from the stop.
- **Daily-loss guardrail:** if the firm caps daily loss at ~3%, one 1%
  trade leaves room for the trade plus normal noise. **Stop trading for the
  day after two consecutive stop-outs.**
- **Overnight rule:** if the firm prohibits overnight holds, close before
  the cutoff regardless of P&L.

---

## 5. Pre-entry checklist (run every time — data goes stale fast)

- [ ] Re-pulled **live** BTC price, 24h change, and volume.
- [ ] Re-pulled the **live** Fear & Greed Index — still in *Fear* (< 40)?
- [ ] Re-derived the support zone from the **current** chart (levels above
      may be stale).
- [ ] Price is **at/near** the zone, not extended away from it.
- [ ] A confirmed 1h/4h rejection candle has printed **inside** the zone
      (long lower wick + volume spike). No candle → no trade.
- [ ] Stop, T1, T2, and position size recalculated from the live levels.
- [ ] Risk ≤ 1% of equity; daily-loss and leverage limits respected.
- [ ] Overnight/session rules for your firm accounted for.

If any box is unchecked: **WAIT.** Survival beats forcing a trade in a
low-liquidity fear grind.

---

## 6. Anomaly / manipulation notes

- **Thin liquidity:** low 24h volume raises the odds of sudden stop-hunts
  and whipsaws → keep the stop below round numbers, keep size small.
- **Correlation regime:** in risk-off tape, majors move together. A BTC
  long captures a broad-market bounce with less idiosyncratic (single-alt)
  risk. Avoid ETH-specific or meme-coin longs for this setup.

---

## 7. Invalidation & exit

- **Hard stop:** a candle close through $61,200 (re-derived) kills the
  thesis — exit, no averaging down.
- **Scale-out:** take partial profit at T1, trail the remainder toward T2.
- **Time stop:** if price chops sideways in the zone without triggering a
  clean rejection candle within your session, stand aside.

---

## 8. Machine-readable parameters

The structured version of this setup (for tooling / the Kraken bot config)
lives at [`config/trade-setups/btc-bounce.json`](../../config/trade-setups/btc-bounce.json).
It carries the same illustrative levels plus a `requiresLiveConfirmation`
flag — automation must re-fetch and re-derive levels before acting.

## References

- [`KRAKEN-TRADING-KNOWLEDGE-BASE.md`](../../KRAKEN-TRADING-KNOWLEDGE-BASE.md) — order types, leverage, risk management, rate limits.
- [`scripts/kraken-trading-bot.js`](../../scripts/kraken-trading-bot.js) — execution stub / risk-management notes.
