# AtoMind System Architecture

## Overview

AtoMind is a multi-agent AI operations platform built as a Turborepo monorepo. It provides autonomous AI operations, governance, and self-healing capabilities across 40+ worker applications and 50+ shared packages.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER / CLIENT                              │
│                    (Browser, API, Notion, n8n)                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Vercel (SPA)       │
                    │   a-to-mind.com      │
                    │   React + Vite       │
                    └──────────┬──────────┘
                               │ API calls
                    ┌──────────▼──────────┐
                    │   Vercel Functions   │
                    │   a-to-mind.com/api  │
                    │   Express Backend    │
                    │   (87 endpoints)     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌──────▼───────┐ ┌──────▼──────┐
    │ Cloudflare     │ │ Gemini API   │ │ D1 Database │
    │ Workers        │ │ (Google AI)  │ │ (SQLite)    │
    └─────────┬──────┘ └──────────────┘ └─────────────┘
              │
    ┌─────────▼──────────────────────────────────────┐
    │              Cloudflare Infrastructure           │
    │                                                  │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
    │  │ Bridge      │  │ Notion      │  │ KV      │ │
    │  │ Worker      │  │ Worker      │  │ STATE   │ │
    │  │ (executor)  │  │ (webhooks)  │  │ METRICS │ │
    │  └──────┬──────┘  └─────────────┘  └─────────┘ │
    │         │                                        │
    │  ┌──────▼──────┐  ┌─────────────┐  ┌─────────┐ │
    │  │ Billing     │  │ Crew Room   │  │ R2      │ │
    │  │ Worker      │  │ Worker      │  │ (logs)  │ │
    │  └─────────────┘  └─────────────┘  └─────────┘ │
    │                                                  │
    │  + 10 more workers                               │
    └──────────────────────────────────────────────────┘
```

## Component Interaction

### Request Flow (Build Request)

```
User → Frontend → POST /api/build → Backend
  → ParseBuildRequest (Zod validation)
  → Curator (security gate: allow-list + rate limit)
    → REJECTED → 422 error
    → APPROVED →
  → Gemini API (generate migration plan)
  → ValidateMigration (density, safety checks)
  → Executor (run MCP tools)
  → Ledger (audit trail)
  → Return response to Frontend
```

### Webhook Flow (Notion → System)

```
Notion → POST /webhooks/notion → Bridge Worker
  → HMAC signature verification
  → Deduplication check
  → Parse payload
  → Route to appropriate handler:
    → Proposal created → Store in D1
    → Lesson created → Store in D1
    → Status changed → Trigger agent
  → Write sync metadata back to Notion
```

### Billing Flow (Stripe → API Key)

```
User → Stripe Checkout → Stripe
  → checkout.session.completed webhook
  → Bridge Worker (/api/billing/webhook)
  → Verify Stripe signature
  → Hash API key
  → Store in STATE KV (tier: free/pro)
  → Return key via /api/billing/key?session_id=...
```

## Deployment Topology

### Cloudflare Workers (13 workers)

| Worker | Route | Purpose |
|--------|-------|---------|
| aether | atomicmoonbeam88.workers.dev/aether | Agent orchestration |
| aether-bridge | bridge.a-to-mind.com | Webhook relay, billing, leads |
| homebase | home.a-to-mind.com | Dashboard |
| notion-worker | notion.a-to-mind.com | Notion integration |
| billing-worker | billing.a-to-mind.com | Payment processing |
| crew-room | crew.a-to-mind.com | Crew coordination |
| grants-worker | grants.a-to-mind.com | Grant management |
| + 6 more | *.a-to-mind.com | Various services |

### Vercel (Frontend + API)

- **a-to-mind.com** — SPA shell (React + Vite)
- **a-to-mind.com/api/*** — Express backend (87 endpoints)

### Data Stores

- **D1 (SQLite)** — `council-routing-db`, `aether-bridge-db`
- **KV** — `STATE`, `STATE_CACHE`, `METRICS`
- **R2** — `aether-logs` (execution logs)
- **Redis** — Local caching (optional)

## Package Architecture

### Core Packages

```
@aether/contracts    — Zod schemas (boundary validation)
@aether/curator      — Security gate (allow-list, rate limit)
@aether/mcp-tools    — MCP tool registry (10 tools)
@aether/logger       — Structured logging + ledger
@aether/metrics      — Metrics collection
@aether/governance   — Audit middleware + judge agent
```

### Infrastructure Packages

```
@aether/chaos        — Chaos engineering (blast radius, quarantine)
@aether/operations   — Retry, circuit breaker, task queue
@aether/daemon       — Autonomous background execution
@aether/sandbox      — Sandboxed code execution
@aether/workflow     — Workflow execution engine
```

### Intelligence Packages

```
@aether/foresight    — Predictive analysis
@aether/council      — Council deliberation logic
@aether/dream        — Dream processing
@aether/goals        — Goal tracking
@aether/storyteller  — Narrative generation
```

## Security Model

See [security-model.md](./security-model.md) for detailed security architecture.

### Key Security Mechanisms

1. **Curator** — Default-deny security gate with allow-list
2. **API Key Tiers** — Free/Pro with usage tracking
3. **HMAC Verification** — Webhook payload integrity
4. **Rate Limiting** — Per-endpoint and per-key limits
5. **Workspace Restrictions** — File access limited to workspace
6. **Sandboxed Execution** — Code runs in isolated environment