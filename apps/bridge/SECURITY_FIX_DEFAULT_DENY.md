# Security Fix: Default-Deny for Write Endpoints

## Issue
5 unauthenticated write endpoints were allowing anyone on the internet to write to D1 databases and KV stores without authentication.

## Vulnerable Endpoints (Before Fix)
1. `POST /proposals/write` - Writes to STATE_CACHE KV
2. `POST /lessons/write` - Writes to STATE_CACHE KV  
3. `POST /api/ai/heartbeat` - Writes to STATE_CACHE KV
4. `POST /api/council/log` - Writes to D1 council_logs table
5. `POST /tasks` - Writes to D1 events table

## Fix Applied
Added `verifyAuth()` function that checks for `Authorization: Bearer <BRIDGE_API_TOKEN>` header before allowing any write operation.

### Changes Made

#### 1. Added authentication function (worker.ts:120-127)
```typescript
async function verifyAuth(request: Request, env: Env): Promise<Response | null> {
  const auth = request.headers.get("Authorization");
  if (!auth || auth !== "Bearer " + env.BRIDGE_API_TOKEN) {
    return json({ ok: false, error: "AUTH_DENIED" }, 401);
  }
  return null;
}
```

#### 2. Added auth check to all 5 endpoints
Each write endpoint now includes:
```typescript
const authError = await verifyAuth(request, env);
if (authError) return authError;
```

#### 3. Updated Env interface (worker.ts:934)
Added `BRIDGE_API_TOKEN: string` to the Env interface.

#### 4. Updated wrangler.toml
Added documentation for required secrets:
```toml
# Required secrets (set via: wrangler secret put BRIDGE_API_TOKEN)
# BRIDGE_API_TOKEN - Authentication token for write endpoints
# NOTION_WEBHOOK_SECRET - HMAC secret for Notion webhook verification
```

## Deployment Steps

### 1. Set the secret in Cloudflare
```bash
cd Aether/apps/bridge
wrangler secret put BRIDGE_API_TOKEN
# Enter a strong random token when prompted
```

### 2. Deploy the worker
```bash
wrangler deploy
```

### 3. Test authentication
```bash
# Test without auth (should fail with 401)
curl -X POST https://bridge.a-to-mind.com/proposals/write \
  -H "Content-Type: application/json" \
  -d '{"items": [], "source": "test"}'

# Test with valid auth (should succeed)
curl -X POST https://bridge.a-to-mind.com/proposals/write \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"items": [], "source": "test"}'
```

## Acceptance Criteria
- ✅ All 5 write endpoints now require `Authorization: Bearer <BRIDGE_API_TOKEN>` header
- ✅ Requests without auth return 401 with error "AUTH_DENIED"
- ✅ Requests with invalid token return 401
- ✅ Requests with valid token proceed normally
- ✅ BRIDGE_API_TOKEN secret documented in wrangler.toml
- ✅ Env interface updated to include BRIDGE_API_TOKEN

## Verification
Run the test suite:
```bash
cd Aether/apps/bridge
npm test
```

## Notes
- This is a **default-deny** security model: all write operations are blocked unless explicitly authorized
- The same BRIDGE_API_TOKEN is used for all 5 endpoints (simple shared secret model)
- For production, consider rotating this token regularly and using environment-specific tokens
- The webhook endpoint `/webhooks/notion` continues to use HMAC verification (separate auth mechanism)
