# Notion Worker

Cloudflare Worker for Notion integration in the coordinated architecture.

## Architecture

Part of the coordinated architecture with:
- `apps/bridge/` — Slack + D1 + `/ops/run-close` (unchanged)
- `apps/notion-worker/` — Notion-only outbound surface
- `packages/ledger/` — Shared types + Zod schemas

**Coordination seam**: Shared D1 binding (aether-bridge-db) as the Runs ledger bus.

## Bindings

- `DB_RUNS` — Shared D1 with bridge (aether-bridge-db)
- `NOTION_TOKEN` — Notion integration token
- `INTERNAL_AUTH` — Shared secret for bridge → notion-worker calls
- `WEBHOOK_SECRET` — For inbound Notion webhooks (deferred to v0.1)

## v0 Endpoints

### POST /runs
Runs ledger writer with idempotent upsert using `ON CONFLICT(run_id) DO UPDATE SET`.

**State transitions supported**: RUNNING → COMPLETED/FAILED/BLOCKED

**Idempotency**: Same `run_id` can be posted multiple times; latest state wins.

### POST /tasks/:id/close
Task auto-close with artifact links. Validates payload structure; Notion write deferred to v0.1.

**Idempotency**: Re-posts produce no duplicate blocks (once Notion integration is active).

### POST /registry/upsert
Automation Center registry upsert using `INSERT OR REPLACE`.

**Idempotency**: Same `system_name` can be upserted multiple times.

### GET /health
Health check with D1 connectivity check.

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

**Example of safe pattern**:
```typescript
try {
  await env.DB_RUNS.prepare(...).run();
} catch (error) {
  console.error('D1 write failed:', error);
  throw error; // Don't swallow
}
```

## Testing

Run unit tests:
```bash
npm test
```

Tests cover:
- Path parsing for all route shapes
- State transition logic
- Idempotency validation

## Deployment

```bash
npm run deploy
```

Sets secrets:
```bash
wrangler secret put NOTION_TOKEN
wrangler secret put INTERNAL_AUTH
wrangler secret put WEBHOOK_SECRET
```

## v0.1 Scope (Deferred)

- Cross-system sync loop (Notion ↔ D1 ↔ Slack reconciliation)
- Custom Agent capabilities surface
- General Notion DB CRUD (Todo List, etc.)
- Notion task status updates
- Artifact block appends to Notion pages
