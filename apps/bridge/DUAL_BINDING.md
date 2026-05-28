# Dual-Binding Architecture — bridge

> **Why this document exists**: `apps/bridge` connects to two separate D1 databases. This caused a multi-week gap in Phase 0 where `env.BRIDGE_DB` was referenced in code but never committed to `wrangler.toml`, silently zeroing all conditional DB writes. This document ensures nobody re-discovers that problem.

## Bindings

| Binding | Database | UUID | Purpose |
|---------|----------|------|---------|
| `DB` | `council-routing-db` | `218e0bc6-f955-45d1-b9bf-276d384917c7` | Active writer — events, council_logs, proposals, lessons, usage tracking |
| `BRIDGE_DB` | `aether-bridge-db` | `f29243db-5b7a-407b-aa38-64091c1e0676` | Staged target — runs, registry, slack_audit_events, artifacts, idempotency keys |

## Migration ownership

`apps/bridge/migrations/` is the **singular source of truth** for all `aether-bridge-db` DDL (as of PR #26). All future schema changes to `aether-bridge-db` go here. `apps/notion-worker/` retains `migrations/0001_runs_registry.sql` as a dev-bootstrap convenience only.

### Migration numbering

| Range | Owner | Notes |
|-------|-------|-------|
| 0001 | notion-worker (dev only) | runs + registry bootstrap |
| 0002–0006 | PR #25 (reconstructed from live DB) | events, council_logs, slack_audit_events, processed_slack_events, artifacts, metrics_snapshots |
| 0007 | PR #26 | schema_migrations backfill (tracking only, no DDL) |
| 0008+ | bridge (production) | All new aether-bridge-db migrations |

## Current write paths

### Via `env.DB` → council-routing-db

- `/webhooks/notion` → `events` (webhook deduplication + audit)
- `/api/council/log` → `council_logs` (agent conversation logging)
- `/proposals/write`, `/lessons/write` → KV (STATE, STATE_CACHE)
- `/api/usage` → KV (STATE)

### Via `env.DB_RUNS` → aether-bridge-db (notion-worker)

- `POST /runs` → `runs` table (idempotent upsert, ON CONFLICT run_id)
- `POST /registry/upsert` → `registry` table (INSERT OR REPLACE, ON CONFLICT system_name)
- `GET /health` → `SELECT COUNT(*) FROM runs` (live connectivity check)

### Via `env.BRIDGE_DB` → aether-bridge-db (bridge)

**Currently not implemented.** The binding exists in `wrangler.toml` but no code path references `env.BRIDGE_DB` as of PR #29 (squash merge of `feature/notion-worker-v0`). The staged plan is:

1. Move runs/registry writes from notion-worker → bridge (bridge owns the schema)
2. Use `env.BRIDGE_DB` for `/ops/run-close` audit trail (slack_audit_events write)
3. Use `env.BRIDGE_DB` for idempotency_keys (dedup ledger for run-close)
4. Eventually deprecate notion-worker's direct DB_RUNS writes

## Silent-write prevention

The H4 finding (Phase 0): `if (env.BRIDGE_DB)` guards in `worker.ts` would silently no-op if the binding was missing. This was the root cause of the zero-row mystery.

**Rule**: Any conditional D1 write must have a counterpart smoke test that reads back the row. Do not rely on the guard — verify the write landed.

**Pattern for new DB writes**:
1. Use `INSERT OR REPLACE` / `ON CONFLICT DO UPDATE` for idempotency
2. Always verify with a post-write SELECT
3. Monitor row counts; unexpected zero-row states indicate silent writes

## Table inventory — aether-bridge-db

| Table | Migration | Write path | Row count (2026-05-28) |
|-------|-----------|------------|----------------------|
| `runs` | 0001/0008 | notion-worker `/runs`, bridge (staged) | 2 |
| `registry` | 0001/0008 | notion-worker `/registry/upsert` | 0 |
| `events` | 0002 | bridge `env.DB` → council-routing-db (separate DB!) | 0 |
| `council_logs` | 0002 | bridge `env.DB` → council-routing-db (separate DB!) | 0 |
| `slack_audit_events` | 0003 | bridge (staged via BRIDGE_DB) | 0 |
| `processed_slack_events` | 0004 | bridge | 0 |
| `artifacts` | 0005 | bridge | 0 |
| `metrics_snapshots` | 0006 | bridge | 0 |
| `idempotency_keys` | 0008 (pending) | bridge `/ops/run-close` | N/A |
| `schema_migrations` | 0007 | tracking only | 8 |

## Smoke procedure

```bash
# Verify notion-worker DB connectivity (DB_RUNS → aether-bridge-db)
curl -s https://notion-worker.atomicmoonbeam88.workers.dev/health

# Expected: {"ok":true,"runs_count":2,...}

# Verify runs table has rows (live write path)
wrangler d1 execute aether-bridge-db --remote --command "SELECT COUNT(*) FROM runs"

# Verify registry initialized
wrangler d1 execute aether-bridge-db --remote --command "SELECT COUNT(*) FROM registry"

# Auth-gated: test idempotent upsert through notion-worker
curl -s -X POST https://notion-worker.atomicmoonbeam88.workers.dev/runs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INTERNAL_AUTH" \
  -d '{"task_id":"smoke-001","run_id":"smoke-duplicate-test","type":"smoke","started":"2026-05-28T00:00:00Z","owner":"smoke","status":"RUNNING"}'
# Second call should no-op (ON CONFLICT)
```

## References

- [Coordinated architecture — bridge + notion-worker + ledger (v0 decision + smoke evidence)](https://www.notion.so/Coordinated-architecture-bridge-notion-worker-ledger-v0-decision-smoke-evidence-2d375f7558c1418a98c53be4fda8a45b)
- PR #29 (feature/notion-worker-v0) — current production state
- PR #26 (schema_migrations backfill) — migration tracking closure