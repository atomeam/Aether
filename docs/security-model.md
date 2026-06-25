# Security Model

## Overview

AtoMind implements a defense-in-depth security model with multiple layers of protection across the entire platform.

## 1. Curator — Default-Deny Security Gate

The Curator (`@aether/curator`) is the primary security gate for all AI-generated actions.

### Allow-List Mechanism

```typescript
const ALLOWED_COMPONENTS = ['stat', 'chart', 'list', 'status', 'gauge'];
```

- **Default deny** — any component not in the allow-list is rejected
- **Rate limit** — max 10 actions per response
- **Logging** — all curator decisions are logged via `logCuratorVerdict()`
- **422 on denial** — rejected actions return HTTP 422 with reason

### How It Works

1. User submits build request
2. Curator inspects the migration plan actions
3. Each action is checked against the allow-list
4. If any action is not allowed → entire request is rejected
5. If all actions pass → request proceeds to executor

## 2. API Key System

### Key Generation

- API keys are generated with cryptographically secure random
- Keys are hashed (SHA-256) before storage in KV
- Raw key is shown once to the user, then only the hash is stored

### Key Tiers

| Tier | Rate Limit | Features |
|------|-----------|----------|
| Free | 100 req/hr | Basic API access |
| Pro | 10,000 req/hr | Full API access, priority support |

### Key Validation

Every authenticated request:
1. Extracts API key from `Authorization` header
2. Hashes the key
3. Looks up hash in STATE KV
4. Checks tier and usage limits
5. Increments usage counter

## 3. Webhook Security

### HMAC Verification

All webhook endpoints verify payload integrity using HMAC-SHA256:

```typescript
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');

if (signature !== expectedSignature) {
  return new Response('Invalid signature', { status: 401 });
}
```

### Webhook Endpoints

- `POST /webhooks/notion` — Notion webhook receiver
- `POST /api/billing/webhook` — Stripe webhook receiver

### Deduplication

- Webhook events are deduplicated by event ID
- Bot-echo events from Notion are filtered out
- Proposals/lessons snapshots are capped at 200

## 4. Rate Limiting

### Per-Endpoint Rate Limits

- `/api/build` — 10 req/min (AI-intensive)
- `/api/billing/webhook` — 100 req/min
- `/api/leads` — 20 req/min
- Default — 60 req/min

### Per-API-Key Rate Limits

- Free tier: 100 requests/hour
- Pro tier: 10,000 requests/hour

### Implementation

Rate limiting uses sliding window counters stored in KV:

```typescript
const key = `ratelimit:${ip}:${endpoint}`;
const current = await KV.get(key, 'json') || { count: 0, window: Date.now() };
if (current.count >= limit) {
  return new Response('Rate limited', { status: 429 });
}
current.count++;
await KV.put(key, JSON.stringify(current), { expirationTtl: 3600 });
```

## 5. File System Security

### Workspace Restrictions

MCP tools (`file_read`, `file_write`) are restricted to the workspace directory:

```typescript
const resolvedPath = path.resolve(basePath, filePath);
if (!resolvedPath.startsWith(basePath)) {
  throw new Error('Path traversal blocked');
}
```

### Path Traversal Prevention

- All file paths are resolved and validated
- `..` segments are stripped
- Symlinks are followed but validated

## 6. Code Execution Security

### Sandbox

The `@aether/sandbox` package provides isolated code execution:

- Code runs in a separate process
- Filesystem access is restricted to sandbox directory
- Network access can be disabled
- Execution timeout prevents infinite loops
- Resource limits prevent memory/CPU exhaustion

### Curator Gate

Before any code execution:
1. Curator validates the action
2. Action must be in the allow-list
3. Rate limits are enforced
4. Decision is logged for audit

## 7. Transport Security

### HTTPS Enforcement

- All production endpoints are served over HTTPS
- Cloudflare handles TLS termination
- HSTS headers are enabled

### Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

## 8. Data Security

### Secrets Management

- API keys stored as Cloudflare Worker secrets
- No secrets in code or environment files
- `.env` files are gitignored
- Secrets are hashed before storage

### Data at Rest

- D1 databases are encrypted at rest by Cloudflare
- KV data is encrypted at rest by Cloudflare
- R2 objects are encrypted at rest by Cloudflare

### Data in Transit

- All internal communication uses HTTPS
- Service-to-service communication is authenticated
- Webhook payloads are HMAC-verified

## 9. Audit Trail

### Governance

The `@aether/governance` package provides:

- **Audit Middleware** — logs all decisions with context
- **Judge Agent** — offline evaluation of decisions
- **Policy Guardrails** — confidence thresholds, latency limits
- **Decision Records** — intent/outcome tracking

### Ledger

Every agent execution is recorded in the ledger:

```typescript
{
  traceId: string,
  timestamp: number,
  action: string,
  tool: string,
  input: any,
  output: any,
  success: boolean,
  duration: number
}
```

## 10. Monitoring & Alerting

### Health Checks

- `GET /api/health` — backend health
- `GET /api/stack` — stack status
- `GET /api/agents` — agent health
- `GET /health` — bridge worker health

### Alert Triggers

- Error rate > 5%
- Response time > 2s (p95)
- Memory usage > 80%
- Database connection failures
- API key abuse detection

## 11. Incident Response

### Runbooks

- [Operational Runbooks](./OPERATIONAL-RUNBOOKS.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Rollback Procedures

- Cloudflare Workers: rollback via dashboard
- Vercel: rollback via dashboard
- Database: restore from backup
- API keys: revoke and reissue

## 12. Compliance Considerations

### Data Retention

- Logs: 30 days active, 90 days archived
- Audit trail: 1 year
- API key usage: 90 days

### Privacy

- No PII stored beyond email addresses
- API keys are hashed (irreversible)
- Webhook payloads are not logged in full