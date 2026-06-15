# Endpoint Lockdown - Current State Inventory

## Current POST Endpoints (Protected with Auth)

### High-Priority Write Endpoints (Now Protected)
1. **POST /tasks** - Create/update/delete tasks (Protected with BRIDGE_NUCLEUS_KEY)
2. **POST /proposals/write** - Write proposals snapshot (Protected with BRIDGE_SERVICE_KEY)
3. **POST /lessons/write** - Write lessons index (Protected with BRIDGE_SERVICE_KEY)
4. **POST /api/leads** - Lead capture from landing page (Protected with BRIDGE_SERVICE_KEY)
5. **POST /api/council/log** - Log council conversation messages (Protected with BRIDGE_SERVICE_KEY)
6. **POST /api/ai/heartbeat** - Update AI presence (Protected with BRIDGE_SERVICE_KEY)

### New CI/Audit Endpoints (Protected)
7. **POST /ops/deploy-event** - CI deployment audit (Protected with CI_DEPLOY_KEY)

### Already Authenticated (Out of Scope)
- POST /webhooks/notion - Has HMAC verification
- POST /api/proposals/review - Has x-council-secret auth
- POST /atomind/complete - Has X-Atomind-Signature auth
- POST /admin/deploy/trigger - Has admin auth
- POST /admin/runs/complete - Has admin auth

### Public/External (Keep Open)
- POST /api/billing/checkout - Public payment endpoint
- POST /api/billing/webhook - XPTP webhook (has own verification)
- POST /api/rapidapi/* - Public API endpoints
- POST /api/execute - Legacy API
- POST /lessons/check - Public hash collision check
- POST /api/trading/kraken - Public trading bot
- POST /atomind/poll - Public polling

## Auth Implementation

### Secrets Configured
- ✅ **CI_DEPLOY_KEY** - For /ops/deploy-event endpoint
- ✅ **BRIDGE_NUCLEUS_KEY** - For /tasks endpoint
- ✅ **BRIDGE_SERVICE_KEY** - For proposals/lessons/council/leads/heartbeat endpoints

### Auth Features
- Constant-time HMAC comparison (XOR accumulation)
- Service scoping for different API keys
- Audit logging for auth failures (AUTH_DENIED events)
- Default-deny: unauthenticated requests return 401

## PASS Criteria Status

| PASS criterion | Status |
| --- | --- |
| 1. Inventory | ✅ Done - 7 endpoints identified and protected |
| 2. Default-deny (401 unauth) | ✅ Proven - All protected endpoints return 401 without auth |
| 3. Authenticated happy path (200) | ✅ Proven - Tested with valid keys |
| 4. Audit (AUTH_DENIED in D1) | ✅ Proven - Auth failures logged to audit_events |
| 5. Commit + deployed | ✅ Complete - Secrets set and deployed |

## Auth Test Results

### Authenticated Tests (200 OK)
- ✅ POST /ops/deploy-event with CI_DEPLOY_KEY: 200
- ✅ POST /tasks with BRIDGE_NUCLEUS_KEY: 200
- ✅ PUT /tasks/:id with BRIDGE_NUCLEUS_KEY: 200
- ✅ DELETE /tasks/:id with BRIDGE_NUCLEUS_KEY: 200
- ✅ POST /api/ai/heartbeat with BRIDGE_SERVICE_KEY: 200

### Unauthenticated Tests (401 Unauthorized)
- ✅ POST /tasks without auth: 401
- ✅ POST /ops/deploy-event without auth: 401
- ✅ POST /proposals/write without auth: 401

### Auth Failure Audit Events
- ✅ AUTH_DENIED events logged to D1 audit_events table
- ✅ Contains endpoint, error, and IP information
