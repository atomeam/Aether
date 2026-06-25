# Data Flow

## User Request Flow

```
User → Frontend (React) → POST /api/build → Backend (Express)
  → Zod validation (parseBuildRequest)
  → Curator (security gate)
    → REJECTED → 422
    → APPROVED →
  → Gemini API (generate migration plan)
  → ValidateMigration (density, safety)
  → Executor (run MCP tools)
  → Ledger (audit trail)
  → Response → Frontend
```

## Webhook Flow

```
Notion → POST /webhooks/notion → Bridge Worker
  → HMAC verification
  → Deduplication
  → Parse payload
  → Route to handler:
    → Proposal → D1
    → Lesson → D1
    → Status change → Agent trigger
  → Write sync metadata back to Notion
```

## Billing Flow

```
User → Stripe Checkout → Stripe
  → checkout.session.completed webhook
  → Bridge Worker (/api/billing/webhook)
  → Verify signature
  → Hash API key
  → Store in STATE KV (tier: free/pro)
  → Return key via /api/billing/key?session_id=...
```

## Proposal Flow

```
Notion → Bridge → Council Package → Deliberation
  → Vote → Decision
  → Record in D1 + Notion
  → Track outcome
```

## Metrics Flow

```
Backend → KV (METRICS) → Frontend Dashboard
  → Request count
  → Error rate
  → Response time
  → Agent execution stats