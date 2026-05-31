# Admin Routes — Agent Proxy for Privileged Operations

> **Status:** Spec ready — scaffold after `deploy-worker.yml` fix lands and bridge deploys cleanly.
> **Owner:** Viktor or Devin  
> **Estimated effort:** ~30 min scaffold, ~1 hr with tests  
> **Prerequisite:** Bridge worker (`aether-bridge`) must deploy successfully to `bridge.a-to-mind.com`

---

## Problem Statement

Aether's AI agents (Viktor, Devin, OpenHands) repeatedly hit permission walls:

| Problem | Root Cause |
|---|---|
| Viktor can't push workflow files | GitHub App lacks `workflows` scope (app-level, not configurable) |
| CF agent can't reach Cloudflare API | Network-blocked from external sandboxes |
| Secrets scattered across agent contexts | Each agent needs its own copy of API tokens |
| Dashboard operations require human clicks | No programmatic proxy for CF management tasks |
| Manual PR creation blocks Devin | `gh` CLI not available in all agent environments |

**Solution:** Admin routes on the bridge Worker that proxy privileged operations. Agents authenticate with a single HMAC secret and call simple HTTP endpoints. Secrets live only in Worker env vars — never in agent contexts.

---

## Architecture

```
┌──────────────┐     HTTPS + HMAC      ┌──────────────────────┐
│   Viktor     │ ───────────────────▶   │                      │
├──────────────┤                        │   aether-bridge      │
│   Devin      │ ───────────────────▶   │   (CF Worker)        │
├──────────────┤                        │                      │
│   OpenHands  │ ───────────────────▶   │  /admin/github/*     │──▶ GitHub API (GH_TOKEN)
├──────────────┤                        │  /admin/cf/*         │──▶ CF API (CF_API_TOKEN)
│   Crew Room  │ ───────────────────▶   │  /admin/aigw/*       │──▶ AI Gateway (GEMINI_API_KEY)
│   (SPA)      │                        │                      │
└──────────────┘                        │  Audit log → D1      │
                                        └──────────────────────┘
```

The Worker is on Cloudflare's own infrastructure — always reachable from any network, no egress restrictions. It holds all secrets as env vars and exposes a thin, audited API layer.

---

## Authentication

### HMAC-SHA256 via `x-admin-signature` header

Reuses the existing `NOTION_WEBHOOK_SECRET` pattern already in `worker.ts` (lines 326–351), extended with:
- **Timestamp replay protection** — `x-admin-timestamp` header, reject if > 5 minutes old
- **Constant-time comparison** — use `crypto.subtle.timingSafeEqual` (Web Crypto API, available on Workers)
- **Per-request nonce** — optional `x-admin-nonce` header for idempotency

#### Request signing

```
timestamp = current ISO-8601 string
body = JSON.stringify(payload)
signature = HMAC-SHA256(ADMIN_SECRET, timestamp + "." + body)

Headers:
  x-admin-signature: sha256=<hex-encoded signature>
  x-admin-timestamp: <timestamp>
  Content-Type: application/json
```

#### Verification pseudocode (Worker-side)

```typescript
async function verifyAdmin(request: Request, env: Env): Promise<boolean> {
  const sig = request.headers.get('x-admin-signature');
  const ts = request.headers.get('x-admin-timestamp');
  if (!sig || !ts) return false;

  // Replay protection: reject if timestamp > 5 min old
  const age = Date.now() - new Date(ts).getTime();
  if (age > 5 * 60 * 1000 || age < -60_000) return false;

  const body = await request.clone().text();
  const secret = env.ADMIN_SECRET || env.NOTION_WEBHOOK_SECRET;
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expected = await crypto.subtle.sign(
    'HMAC', key,
    new TextEncoder().encode(ts + '.' + body)
  );
  
  const expectedHex = [...new Uint8Array(expected)]
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  const providedHex = sig.replace(/^sha256=/, '');
  
  // Constant-time compare
  if (expectedHex.length !== providedHex.length) return false;
  const a = new TextEncoder().encode(expectedHex);
  const b = new TextEncoder().encode(providedHex);
  return crypto.subtle.timingSafeEqual(a, b);
}
```

#### Why `ADMIN_SECRET` (not just `NOTION_WEBHOOK_SECRET`)

The Notion webhook secret has a single purpose. Admin routes should use a dedicated secret (`ADMIN_SECRET`) so rotation is independent. During bootstrap, fall back to `NOTION_WEBHOOK_SECRET` for zero-config.

---

## Endpoints

### 1. `POST /admin/github/commit`

Commits one or more files to a branch and optionally opens a PR. Solves the workflow-push problem permanently.

**Request:**
```json
{
  "branch": "feat/cf-recon-workflow",
  "base": "main",
  "message": "feat(ci): cf-recon workflow_dispatch",
  "files": [
    {
      "path": ".github/workflows/cf-recon.yml",
      "content": "name: CF Recon\n..."
    },
    {
      "path": "docs/cf-recon.md",
      "content": "# CF Recon\n..."
    }
  ],
  "pr": {
    "title": "feat(ci): cf-recon workflow_dispatch for CF inventory",
    "body": "Adds manual-trigger workflow...",
    "draft": false
  }
}
```

**Response:**
```json
{
  "ok": true,
  "commit_sha": "abc123...",
  "branch": "feat/cf-recon-workflow",
  "pr_url": "https://github.com/atomeam/Aether/pull/60",
  "pr_number": 60
}
```

**Implementation notes:**
- Uses `GH_TOKEN` (repo-owner PAT with `repo` + `workflow` scopes) stored as Worker secret
- GitHub API calls: create tree → create commit → update ref → create PR
- Supports creating new branches (from `base`) or pushing to existing ones
- Files array supports both `content` (string) and `content_base64` (binary)

---

### 2. `POST /admin/cf/recon`

Queries Cloudflare resource inventory. Replaces the cf-recon GitHub Action for cases where you need results in-band (not in GHA logs).

**Request:**
```json
{
  "resources": ["kv", "d1", "r2", "workers", "queues"]
}
```

**Response:**
```json
{
  "ok": true,
  "account_id": "95745fed...",
  "results": {
    "kv": [
      { "id": "7319ee91...", "title": "STATE" },
      { "id": "d22e703c...", "title": "STATE_CACHE" },
      { "id": "49202b24...", "title": "METRICS" }
    ],
    "d1": [
      { "uuid": "218e0bc6...", "name": "council-routing-db" },
      { "uuid": "f29243db...", "name": "aether-bridge-db" }
    ],
    "r2": [
      { "name": "aether-logs" }
    ],
    "workers": [
      { "id": "aether-bridge", "routes": ["bridge.a-to-mind.com"] }
    ],
    "queues": [
      { "queue_name": "curator-jobs", "consumers": 1 }
    ]
  },
  "ts": "2026-05-29T15:00:00Z"
}
```

**Implementation notes:**
- Uses `CF_API_TOKEN` + `CF_ACCOUNT_ID` from Worker env
- CF API v4 endpoints:
  - `GET /client/v4/accounts/{id}/storage/kv/namespaces`
  - `GET /client/v4/accounts/{id}/d1/database`
  - `GET /client/v4/accounts/{id}/r2/buckets`
  - `GET /client/v4/accounts/{id}/workers/scripts`
  - `GET /client/v4/accounts/{id}/queues`
- Optional: `"resources": ["all"]` queries everything

---

### 3. `POST /admin/aigw/smoke`

Smoke-tests the AI Gateway to verify provider keys and gateway auth are wired correctly.

**Request:**
```json
{
  "provider": "google-ai-studio",
  "model": "gemini-2.5-flash",
  "prompt": "Reply with exactly: {\"ok\":true,\"note\":\"AIGW smoke\"}"
}
```

**Response (pass):**
```json
{
  "ok": true,
  "status": "PASS",
  "http_code": 200,
  "latency_ms": 342,
  "response_preview": "{\"ok\":true,\"note\":\"AIGW smoke\"}",
  "gateway_id": "aether-verifier"
}
```

**Response (fail):**
```json
{
  "ok": false,
  "status": "FAIL",
  "http_code": 401,
  "error": "cf-aig-authorization required (error code 2009)",
  "diagnosis": "Authenticated Gateway is enabled but no auth header sent, or provider key not stored"
}
```

**Implementation notes:**
- Uses `GEMINI_API_KEY` from Worker env (or AI Gateway stored key)
- Gateway URL: `https://gateway.ai.cloudflare.com/v1/{account_id}/aether-verifier/google-ai-studio/v1beta/models/{model}:generateContent`
- If Authenticated Gateway is on, include `cf-aig-authorization: Bearer {CF_AIG_TOKEN}`
- Auto-diagnoses common failure modes (2009 = gateway auth, 401 = provider key)

---

### 4. `POST /admin/workflow/trigger` (stretch)

Triggers a GitHub Actions workflow_dispatch. Useful for cf-recon and future CI jobs.

**Request:**
```json
{
  "workflow": "cf-recon.yml",
  "ref": "main",
  "inputs": {}
}
```

**Response:**
```json
{
  "ok": true,
  "run_id": 12345,
  "url": "https://github.com/atomeam/Aether/actions/runs/12345"
}
```

---

## Audit Logging

Every admin route call is logged to the `BRIDGE_DB` D1 database in the `audit_events` table.

### Schema

```sql
CREATE TABLE IF NOT EXISTS audit_events (
  id         TEXT PRIMARY KEY,
  ts         TEXT NOT NULL,            -- ISO-8601 timestamp
  endpoint   TEXT NOT NULL,            -- e.g. '/admin/github/commit'
  caller_ip  TEXT,                     -- cf-connecting-ip
  caller_id  TEXT,                     -- extracted from request body or header
  method     TEXT NOT NULL,            -- HTTP method
  status     INTEGER NOT NULL,         -- response HTTP status
  latency_ms INTEGER,                 -- time to process
  request    TEXT,                     -- sanitized request body (secrets stripped)
  response   TEXT,                     -- first 2000 chars of response
  error      TEXT                      -- error message if failed
);

CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
CREATE INDEX IF NOT EXISTS idx_audit_endpoint ON audit_events(endpoint);
```

### Sanitization rules

- Strip `content` fields > 500 chars (workflow file bodies)
- Never log secrets or tokens
- Log PR URLs, commit SHAs, error messages — these are useful for debugging

### Audit helper

```typescript
async function auditLog(
  env: Env,
  endpoint: string,
  request: Request,
  status: number,
  latencyMs: number,
  requestBody: unknown,
  responseBody: unknown,
  error?: string
) {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await env.BRIDGE_DB.prepare(
      `INSERT INTO audit_events (id, ts, endpoint, caller_ip, method, status, latency_ms, request, response, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      new Date().toISOString(),
      endpoint,
      request.headers.get('cf-connecting-ip') || 'unknown',
      request.method,
      status,
      latencyMs,
      JSON.stringify(requestBody).substring(0, 2000),
      JSON.stringify(responseBody).substring(0, 2000),
      error || null
    ).run();
  } catch (e) {
    console.error('[Audit] Failed to log:', e);
  }
}
```

---

## Sequence Diagrams

### Agent → GitHub commit (workflow file push)

```
Agent                    Bridge Worker              GitHub API
  │                          │                         │
  │  POST /admin/github/     │                         │
  │  commit + HMAC sig       │                         │
  │─────────────────────────▶│                         │
  │                          │  verify HMAC            │
  │                          │  check timestamp        │
  │                          │                         │
  │                          │  GET /git/ref/heads/    │
  │                          │  main                   │
  │                          │────────────────────────▶│
  │                          │◀────────────────────────│  sha
  │                          │                         │
  │                          │  POST /git/trees        │
  │                          │  (files array)          │
  │                          │────────────────────────▶│
  │                          │◀────────────────────────│  tree_sha
  │                          │                         │
  │                          │  POST /git/commits      │
  │                          │────────────────────────▶│
  │                          │◀────────────────────────│  commit_sha
  │                          │                         │
  │                          │  POST /git/refs         │
  │                          │  (create branch)        │
  │                          │────────────────────────▶│
  │                          │◀────────────────────────│  ref
  │                          │                         │
  │                          │  POST /repos/pulls      │
  │                          │  (open PR)              │
  │                          │────────────────────────▶│
  │                          │◀────────────────────────│  pr_url
  │                          │                         │
  │                          │  audit_log → D1         │
  │                          │                         │
  │◀─────────────────────────│                         │
  │  { ok, commit_sha,       │                         │
  │    pr_url }              │                         │
```

### Agent → CF Recon

```
Agent                    Bridge Worker              Cloudflare API
  │                          │                         │
  │  POST /admin/cf/recon    │                         │
  │  { resources: ["kv"] }   │                         │
  │─────────────────────────▶│                         │
  │                          │  verify HMAC            │
  │                          │                         │
  │                          │  GET /v4/accounts/      │
  │                          │  {id}/storage/kv/       │
  │                          │  namespaces             │
  │                          │────────────────────────▶│
  │                          │◀────────────────────────│
  │                          │                         │
  │                          │  audit_log → D1         │
  │                          │                         │
  │◀─────────────────────────│                         │
  │  { ok, results: {kv} }  │                         │
```

---

## Threat Model

### Attack surface

| Vector | Mitigation |
|---|---|
| HMAC secret leaked | Rotate `ADMIN_SECRET` via `wrangler secret put`. Fall back to `NOTION_WEBHOOK_SECRET` = single rotation point. Audit log shows all calls — detect anomalies. |
| Replay attacks | Timestamp validation (5-min window). Optional nonce for critical ops. |
| Timing attacks on HMAC | `crypto.subtle.timingSafeEqual` — constant-time comparison. |
| Overprivileged GH_TOKEN | Scope to `repo` + `workflow` only. Consider fine-grained PAT scoped to `atomeam/Aether`. |
| CF_API_TOKEN scope creep | Use scoped API token: `Account.Workers Scripts:Edit`, `Account.Workers KV:Read`, `Account.D1:Read`, `Account.R2:Read`. |
| Request body injection | Validate all inputs (branch names: alphanumeric + `-/_`; file paths: no `../`; content: size limit 1MB). |
| Public internet exposure | Rate-limit admin routes separately (10 req/min). Consider IP allowlist via CF WAF rule if agents have static IPs. |
| Audit log tampering | D1 is append-only in practice. Future: replicate audit to R2 (`_LOGS` bucket) for immutable backup. |

### Secrets inventory

| Secret | Where it lives | Purpose |
|---|---|---|
| `ADMIN_SECRET` | Worker env var (new) | HMAC auth for admin routes |
| `NOTION_WEBHOOK_SECRET` | Worker env var (existing) | Fallback HMAC + Notion webhooks |
| `GH_TOKEN` | Worker env var (new) | GitHub API — repo owner PAT |
| `CF_API_TOKEN` | Worker env var (new, also in GHA secrets) | Cloudflare API |
| `CF_ACCOUNT_ID` | Worker env var (existing in GHA) | Cloudflare account |
| `GEMINI_API_KEY` | Worker env var (new) | AI Gateway smoke tests |

### Adding secrets

```bash
# One-time setup after bridge deploys
wrangler secret put ADMIN_SECRET      # openssl rand -hex 32
wrangler secret put GH_TOKEN          # GitHub PAT with repo+workflow
wrangler secret put CF_API_TOKEN      # Same token as GHA secret
wrangler secret put CF_ACCOUNT_ID     # 95745fedbea06314e24c27233033a37d
wrangler secret put GEMINI_API_KEY    # From AI Studio
```

---

## Env Interface Update

Add to `apps/bridge/src/worker.ts`:

```typescript
interface Env {
  // ... existing bindings ...
  
  // Admin route secrets (optional — admin routes disabled if missing)
  ADMIN_SECRET?: string;
  GH_TOKEN?: string;
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  GEMINI_API_KEY?: string;
}
```

---

## File Structure

```
apps/bridge/src/
├── worker.ts              # Existing — add admin route dispatcher
├── routes/
│   └── admin.ts           # New — all admin route handlers
├── lib/
│   ├── admin-auth.ts      # New — HMAC verify + timestamp check
│   └── audit.ts           # New — audit logging helper
```

### Route dispatcher (added to worker.ts)

```typescript
// Admin routes — privileged agent proxy
if (path.startsWith('/admin/')) {
  const { handleAdminRoute } = await import('./routes/admin');
  return handleAdminRoute(path, request, env, ctx);
}
```

---

## Implementation Sequence

1. **Migration:** Create `audit_events` table in BRIDGE_DB
2. **Auth:** `lib/admin-auth.ts` — HMAC verify with timestamp + constant-time compare
3. **Audit:** `lib/audit.ts` — audit logger
4. **Routes:** `routes/admin.ts` — endpoint handlers
5. **Wire up:** Add route dispatcher to `worker.ts`
6. **Secrets:** `wrangler secret put` for each secret
7. **Smoke test:** `curl -X POST https://bridge.a-to-mind.com/admin/cf/recon` with signed request
8. **Agent integration:** Viktor/Devin call admin routes instead of direct API

---

## Future: MCP Server (Tier 3)

The admin routes are the on-ramp to a full MCP server at `mcp.a-to-mind.com`:

```
Admin Routes (today)          →  MCP Server (future)
────────────────────────────     ────────────────────────
HTTP + HMAC                      MCP protocol (JSON-RPC 2.0)
Manual curl / fetch              Agent-native tool discovery
3 endpoints                      Typed tool catalog (20+ tools)
audit_events table               Full observability + approval gates
```

MCP-compatible agents (Claude Code, OpenHands, Devin) would connect directly and discover available tools. Approval gates + audit log sit in front of every operation. This replaces ad-hoc paste-driven dispatch entirely.

Not for today — but every line of admin route code is reusable as an MCP tool handler.
