# Aether Bridge

Cloudflare Worker for Slack automation, D1 operations, and `/ops/run-close` endpoint.

## Architecture

Part of the coordinated architecture with:
- `apps/bridge/` — Slack + D1 + `/ops/run-close`
- `apps/notion-worker/` — Notion-only outbound surface
- `packages/ledger/` — Shared types + Zod schemas

**Coordination seam**: Shared D1 binding (aether-bridge-db) as the Runs ledger bus.

## Bindings

| Binding | Type | Resource | Purpose |
|---------|------|----------|---------|
| `DB` | D1 | `council-routing-db` (UUID: `218e0bc6-f955-45d1-b9bf-276d384917c7`) | Council routing events/logs |
| `BRIDGE_DB` | D1 | `aether-bridge-db` (UUID: `f29243db-5b7a-407b-aa38-64091c1e0676`) | Runs ledger, registry, Slack audit events |
| `STATE` | KV | `7319ee9195df4ccf8f4b2c8449dd7930` | Worker state |
| `STATE_CACHE` | KV | `d22e703c3af9451a9942fa2a551a1aa8` | Cached state |
| `MYBROWSER` | Browser | — | Browser automation |
| `_LOGS` | R2 | `aether-logs` | Log storage |
| `CURATOR_QUEUE` | Queue | `curator-jobs` | Curator job queue |
| `ACTIONS` | Queue | `bridge-actions` | Bridge action queue |

## Secrets

| Secret | Purpose |
|---------|---------|
| `SLACK_SIGNING_SECRET` | Slack app signing secret |
| `SLACK_BOT_TOKEN` | Slack bot token (xoxb-*) |
| `SLACK_OPS_RUNS_CHANNEL_ID` | Slack channel ID for #ops-runs |
| `SLACK_OPS_CONTROL_CHANNEL_ID` | Slack channel ID for #ops-control |
| `NOTION_TOKEN` | Notion integration token (ntn_* or secret_*) |
| `NOTION_TODO_DB_ID` | Notion Todo List database ID |

## Key Endpoints

### POST /ops/run-close
Task auto-close endpoint that updates task status and appends artifact links.

**Idempotency**: Re-posts produce no duplicate audit events.

### GET /health
Health check with binding status.

### GET /crew/status
Crew status summary with all bindings.

## Operational Rules

### Silent-Write Bug Prevention

**CRITICAL**: Any conditional D1 write must have a counterpart smoke test that reads back the row, or it's a candidate for the next 0-row mystery.

**Pattern that caused H4**:
```typescript
if (env.BRIDGE_DB) {
  await env.BRIDGE_DB.prepare(...).run();
}
```
If the binding is missing, the condition fails silently → no writes → 0 rows → no errors.

**Prevention**:
1. Always use `ON CONFLICT` or `INSERT OR REPLACE` for idempotent writes
2. Add smoke tests that POST → SELECT to verify the row exists
3. Monitor D1 row counts; unexpected 0-row states indicate silent writes
4. Use explicit error handling instead of conditional guards for critical writes

**Cross-reference**: See silent-write prevention rules in notion-worker README: https://www.notion.so/Coordinated-architecture-bridge-notion-worker-ledger-v0-decision-smoke-evidence-2d375f7558c1418a98c53be4fda8a45b

## Smoke Procedure

After deployment, verify bindings and D1 connectivity:

1. **Deploy worker**:
   ```bash
   wrangler deploy
   ```

2. **Check health endpoint**:
   ```bash
   curl https://aether-bridge.atomicmoonbeam88.workers.dev/health
   ```
   Expected: `{"ok":true,"bindings":{...}}` with `BRIDGE_DB: true`

3. **Trigger a write path**:
   ```bash
   curl -X POST https://aether-bridge.atomicmoonbeam88.workers.dev/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"smoke-test","description":"verify BRIDGE_DB binding"}'
   ```
   Expected: `{"ok":true,"task":{...}}`

4. **Verify D1 write**:
   ```bash
   wrangler d1 execute aether-bridge-db --remote \
     --command="SELECT COUNT(*) FROM tasks"
   ```
   Expected: Count > 0

5. **Test idempotency**:
   ```bash
   # Re-trigger same write
   curl -X POST https://aether-bridge.atomicmoonbeam88.workers.dev/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"smoke-test","description":"verify BRIDGE_DB binding"}'
   ```
   Expected: Success, no duplicate task (idempotent)

## Deployment

```bash
wrangler deploy
```

Set secrets:
```bash
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put SLACK_OPS_RUNS_CHANNEL_ID
wrangler secret put SLACK_OPS_CONTROL_CHANNEL_ID
wrangler secret put NOTION_TOKEN
wrangler secret put NOTION_TODO_DB_ID
```

## Migrations

Migrations are in `apps/bridge/migrations/`:
- `0001_tasks_audit.sql` — Tasks + audit_events tables
- `0002_events_council_logs.sql` — Events + council_logs tables
- `0003_slack_audit_events.sql` — Slack audit events table
- `0004_processed_slack_events.sql` — Processed Slack events table
- `0005_artifacts.sql` — Artifacts table
- `0006_metrics_snapshots.sql` — Metrics snapshots table

Apply migrations:
```bash
wrangler d1 execute aether-bridge-db --remote --file=migrations/0001_tasks_audit.sql
# ... repeat for each migration
```

## Cross-Reference

See coordinated architecture documentation: https://www.notion.so/Coordinated-architecture-bridge-notion-worker-ledger-v0-decision-smoke-evidence-2d375f7558c1418a98c53be4fda8a45b
