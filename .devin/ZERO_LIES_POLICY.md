# 0 Lies Mode: Website Integrity Policy

**Nonnegotiable:** The site must never display fabricated metrics, fabricated activity, or fabricated social proof.

## Core Principles

### 1. Default State = Not Connected, Not Fake Numbers

If a metric/data source isn't wired and verifiable, show:
- **"Not connected" / "No data" / "TBD"**
- Plus a **Connect** CTA (Stripe / Notion / Analytics)

**No placeholders that look real.**

### 2. Every Displayed Number Must Have Source + Timestamp

For each metric tile/counter:
- **Source of truth** (exact system + table/db)
- **Last updated** timestamp
- Optional View raw link (admin-only is fine)

**If you can't print the source, you can't print the number.**

### 3. Kill Fake Social Proof Completely

Remove any:
- Scrolling names / X saved $Y tickers
- Fake testimonials, logos, reviews
- Fake user counts / active now counters

**Only re-add with explicit permission + audit trail.**

### 4. Enforce Via Code: VerifiedData Contract

UI can only render real when:
- `verified: true`
- `source: ...`
- `computed_at: ...`

Otherwise it renders "Not connected" or "No data".

**No exceptions.**

### 5. Demo Mode Must Be Unmistakable

If we want demo screenshots, use a global banner:
**"DEMO DATA — NOT REAL"** (persistent, not dismissible)

Style demo values differently.

### 6. Real Money Definition

**Canonical definition: Net Cash Received**
```
Net cash received = Stripe payments captured - refunds - fees
```

- Only counts actual cash received (captured payments)
- Subtracts refunds (money returned to customers)
- Subtracts fees (actual costs to Stripe)
- No accrual accounting - only cash movement

**If you can't measure costs yet, do NOT display Profit. Display Net revenue (after fees) and add costs later.**

### 7. Minimum Instrumentation for Real Money

To produce weekly real money metrics, the system must pull from Stripe at compute time:
- Successful charges/payments in the date range
- Refunds in the date range
- Fees in the date range
- (Optional) disputes/chargebacks

Then store:
- The computed totals
- The Stripe query parameters used
- An idempotency key so you don't double-write weeks

### 8. Trust Rule of Thumb

If a visitor can reasonably interpret a number as real, it must be:
- **Auditable** (you can show how it was computed)
- **Repeatable** (re-running yields the same result)
- **Time-bounded** (this week / last 7 days, etc.)
- **Clearly defined**

## Implementation Checklist

Before marking any metric as done, provide:
- [ ] List of every metric shown + its exact source
- [ ] Screenshots
- [ ] Confirmation that fake ticker/testimonials are removed
- [ ] Verification that all numbers have source + timestamp
- [ ] Verification that unverified data shows "Not connected"

## Code Enforcement

### VerifiedData Contract

All metrics must use the `VerifiedData<T>` contract:

```typescript
interface VerifiedData<T> {
  verified: boolean;
  value: T;
  source: string;
  computed_at: string;
  raw_url?: string;
  is_demo?: boolean;
  definition?: string;
}
```

### Helper Functions

- `createVerifiedData()` - for real data with source
- `createUnverifiedData()` - for "Not connected" state
- `createDemoData()` - for demo data (clearly marked)
- `createVerifiedPaymentData()` - for Stripe calculations

### UI Components

- `StatsCard` - only renders if `verified: true`
- `DemoBanner` - persistent banner for demo mode
- `PaymentCalculationPanel` - admin view of calculation details

## Forbidden Patterns

❌ **NEVER DO:**
- Display numbers without source attribution
- Use `Math.random()` for metrics
- Hardcode fake values
- Show "demo" data without banner
- Display testimonials without real customers
- Show "active users" counters without real data
- Display profit without cost measurement

✅ **ALWAYS DO:**
- Show "Not connected" when data unavailable
- Include source + timestamp for every metric
- Use VerifiedData contract for all metrics
- Display calculation formulas for financial data
- Link to raw data sources (admin-only)
- Use persistent banner for demo mode

## Enforcement

This policy is enforced via:
1. Type system (VerifiedData contract)
2. Code review (check for fake data patterns)
3. Pre-commit hooks (prevent Math.random in metrics)
4. Deployment verification (audit all displayed numbers)

**Violation of this policy is a P0 blocker.**

---

**Last Updated:** 2026-06-03
**Status:** Enforced via VerifiedData contract
**Owner:** Council
