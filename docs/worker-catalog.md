# Worker Catalog

**Status:** REPO-SOURCED (needs live API verification)  
**Last Updated:** 2026-05-29  
**Source:** `wrangler.toml`, `CANONICAL_BINDINGS_MAP.md`, `AGENTS.md`  
**Live Verification:** Pending CF credentials (option A or B from operator queue)

> ⚠️ This catalog is compiled from repo artifacts. Bindings, versions, and routes should be verified via CF API once credentials available.

---

## Worker Index

| # | Worker Name | Route | Status | Owner |
|---|-------------|-------|--------|-------|
| 1 | aether | `atomicmoonbeam88.workers.dev/aether` | ACTIVE | Viktor |
| 2 | aether-bridge | `bridge.atomind.io` | ACTIVE | Viktor |
| 3 | homebase | `home.atomind.io` | ACTIVE | Viktor |
| 4 | intake-run | `intake-run.atomind.io` | ACTIVE | Viktor |
| 5 | billing-worker | `billing.atomind.io` | ACTIVE | Viktor |
| 6 | crew-room | `crew.atomind.io` | ACTIVE | Viktor |
| 7 | grants-api | `grants.atomind.io` | ACTIVE | Viktor |
| 8 | adamm | `adamm.atomind.io` | ACTIVE | Viktor |
| 9 | cool-credit-fb9b | — | STALE — slated for deletion | Viktor |
| 10 | self-adaptive-app | `self-adaptive-app.atomind.io` | ACTIVE | Viktor |
| 11 | notion-worker | `notion.atomind.io` | ACTIVE | Viktor |
| 12 | alpha-orchestrator | `alpha.atomind.io` | ACTIVE | Viktor |
| 13 | alpha-hub | `alpha-hub.atomind.io` | ACTIVE | Viktor |

---

## Detailed Worker Records

### 1. aether (dispatcher + agent orchestration)

| Field | Value |
|-------|-------|
| **Route** | `atomicmoonbeam88.workers.dev/aether` |
| **Target** | `apps/backend` (server.ts) |
| **D1 Bindings** | None in wrangler.toml |
| **KV Bindings** | None in wrangler.toml |
| **Queues** | None configured |
| **Services** | N/A |
| **Cron** | None |
| **Observability** | Not enabled in wrangler.toml |
| **Owner** | Viktor |
| **Purpose** | Agent orchestration + MCP tool registry |

---

### 2. aether-bridge

| Field | Value |
|-------|-------|
| **Route** | `bridge.atomind.io` (primary) / `atomicmoonbeam88.workers.dev/aether-bridge` (fallback) |
| **Entry** | `apps/bridge/src/worker.ts` |
| **D1 Bindings** | `DB` → `council-routing-db` (`218e0bc6-f955-45d1-b9bf-276d384917c7`) |
| | `BRIDGE_DB` → `aether-bridge-db` (`f29243db-5b7a-407b-aa38-64091c1e0676`) |
| **KV Bindings** | `STATE` → `7319ee9195df4ccf8f4b2c8449dd7930` |
| | `STATE_CACHE` → `d22e703c3af9451a9942fa2a551a1aa8` |
| | `METRICS` → `49202b2460a74d2dbd6d747d35dda5b7` |
| **R2 Buckets** | `_LOGS` → `aether-logs` |
| **Queues** | `CURATOR_QUEUE` → `curator-jobs` (consumer: max_batch=1, retries=3) |
| | `ACTIONS` → `bridge-actions` (consumer: max_batch=10, retries=3) — PENDING |
| **Services** | `DISPATCHER` → `aether` |
| **Cron** | `*/15 * * * *`, `0 * * * *` |
| **Observability** | ✅ Enabled |
| **Browser Binding** | `MYBROWSER` — configured |
| **Owner** | Viktor |
| **Purpose** | Webhook relay, Notion ↔ aether communication |

**Known Routes:**
- `GET /health` — Health check with binding status
- `GET /crew/status` — Crew status with binding validation
- `GET /dashboard` — HTML dashboard
- `POST /webhooks/notion` — Notion webhook receiver (HMAC verified)
- `GET/POST /proposals` — Proposals snapshot
- `GET/POST /lessons` — Lessons index
- `GET/POST /tasks` — Task management
- `POST /api/council/log` — Council conversation logging
- `GET/POST /api/ai/presence` — AI presence
- `GET /api/usage` — Usage statistics

---

### 3. homebase

| Field | Value |
|-------|-------|
| **Route** | `home.atomind.io` |
| **Entry** | `apps/frontend` |
| **D1 Bindings** | None in wrangler.toml |
| **KV Bindings** | None in wrangler.toml |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown — not in wrangler.toml |
| **Owner** | Viktor |
| **Purpose** | Dashboard UI |

---

### 4. intake-run

| Field | Value |
|-------|-------|
| **Route** | `intake-run.atomind.io` |
| **Entry** | Not in apps/ structure — likely separate |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | Unknown |
| **Services** | Unknown |
| **Cron** | Unknown |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Run intake from Notion |

---

### 5. billing-worker

| Field | Value |
|-------|-------|
| **Route** | `billing.atomind.io` |
| **Entry** | Not in apps/ structure — likely separate |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | Stripe webhook queue |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Stripe webhook handler |
| **MCP** | Stripe ×2 configured, unwired |

---

### 6. crew-room

| Field | Value |
|-------|-------|
| **Route** | `crew.atomind.io` |
| **Entry** | Not in apps/ structure |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Agent workspace UI |

---

### 7. grants-api

| Field | Value |
|-------|-------|
| **Route** | `grants.atomind.io` |
| **Entry** | Not in apps/ structure |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Grants API |

---

### 8. adamm

| Field | Value |
|-------|-------|
| **Route** | `adamm.atomind.io` |
| **Entry** | Not in apps/ structure |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Unknown |

---

### 9. cool-credit-fb9b

| Field | Value |
|-------|-------|
| **Route** | N/A — no route configured |
| **Entry** | Unknown |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Status** | ⛔ STALE — slated for deletion |
| **Purpose** | N/A |

---

### 10. self-adaptive-app

| Field | Value |
|-------|-------|
| **Route** | `self-adaptive-app.atomind.io` |
| **Entry** | Not in apps/ structure |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Unknown |

---

### 11. notion-worker

| Field | Value |
|-------|-------|
| **Route** | `notion.atomind.io` / `notion-worker.atomicmoonbeam88.workers.dev` (fallback) |
| **Entry** | `apps/notion-worker/src/index.ts` |
| **D1 Bindings** | `DB_RUNS` — runs ledger D1 |
| **KV Bindings** | None in source |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Notion ←→ runs ledger sync |
| **MCP** | Notion MCP configured |
| **Auth** | `NOTION_TOKEN`, `INTERNAL_AUTH` env vars |

**Known Routes:**
- `GET /health` — D1 connectivity check
- `POST /runs` — Upsert run to D1

---

### 12. alpha-orchestrator

| Field | Value |
|-------|-------|
| **Route** | `alpha.atomind.io` |
| **Entry** | Not in apps/ structure |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Council kernel Durable Object |

---

### 13. alpha-hub

| Field | Value |
|-------|-------|
| **Route** | `alpha-hub.atomind.io` |
| **Entry** | Not in apps/ structure |
| **D1 Bindings** | Unknown |
| **KV Bindings** | Unknown |
| **Queues** | None |
| **Services** | None |
| **Cron** | None |
| **Observability** | Unknown |
| **Owner** | Viktor |
| **Purpose** | Unknown |

---

## Unwired MCPs per Worker

| Worker | MCP Status |
|--------|------------|
| billing-worker | Stripe ×2 configured, unwired |
| notion-worker | Notion ×1 configured, active |
| All workers | Sentry ×2 configured, unwired |
| homebase/crew-room | Amplitude ×3 configured, unwired |
| All workers | HubSpot ×2, Intercom ×5 configured, unwired |

---

## Canonical Domain Routing (Post-NS Swap)

Once DNS NS swap completes to `atomind.io`:

| Worker | Canonical Route |
|--------|-----------------|
| aether-frontend | `app.atomind.io` |
| aether-bridge | `bridge.atomind.io` |
| notion-worker | `notion.atomind.io` |
| billing-worker | `billing.atomind.io` |
| grants-api | `grants.atomind.io` |
| crew-room | `crew.atomind.io` |

---

## Todo: Live Verification

- [ ] CF API credentials needed to verify bindings
- [ ] D1 schema verification for all Workers
- [ ] Queue consumer status verification
- [ ] Cron job verification
- [ ] Observability status for Workers without it enabled