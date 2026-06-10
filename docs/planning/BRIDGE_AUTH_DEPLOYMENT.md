# Bridge Auth Deployment Plan

## Overview
Deploy bridge authentication changes from PR #99 to production.

## Current State
- ✅ PR #99 created with auth middleware
- ✅ Auth middleware implemented in worker.ts
- ✅ HMAC verification made mandatory
- ✅ Duplicate routes fixed in wrangler.toml
- ✅ Documentation updated
- ❌ Worker not deployed to production
- ❌ Auth keys not configured
- ❌ Endpoints not tested

## Target State
- Worker deployed to production
- Auth keys configured via wrangler secrets
- All write endpoints protected
- HMAC verification mandatory
- Endpoints tested and verified

## Pre-Deployment Checklist

### 1. Review PR #99
- [ ] Review code changes
- [ ] Review auth middleware implementation
- [ ] Review HMAC verification changes
- [ ] Review wrangler.toml changes
- [ ] Approve PR

### 2. Prepare Environment
- [ ] Verify wrangler is installed
- [ ] Verify wrangler is authenticated
- [ ] Verify Cloudflare account access
- [ ] Verify worker name: aether-bridge

### 3. Generate Auth Keys
- [ ] Generate BRIDGE_NUCLEUS_KEY (32+ characters)
- [ ] Generate BRIDGE_SERVICE_KEY (32+ characters)
- [ ] Store keys in password manager
- [ ] Document key locations

### 4. Prepare Rollback Plan
- [ ] Save current worker version
- [ ] Document rollback steps
- [ ] Test rollback procedure

## Deployment Steps

### Step 1: Checkout and Verify

```bash
cd C:\Users\adamm\Aether
git checkout main
git pull origin main
git checkout feature/bridge-auth-lockdown-v2
git pull origin feature/bridge-auth-lockdown-v2
```

### Step 2: Verify Changes

```bash
# Check modified files
git diff main...HEAD

# Verify auth middleware in worker.ts
grep -A 10 "requireAuth" apps/bridge/src/worker.ts

# Verify HMAC changes
grep -A 5 "HMAC verification" apps/bridge/src/worker.ts

# Verify wrangler.toml
cat apps/bridge/wrangler.toml
```

### Step 3: Deploy Worker

```bash
cd apps/bridge
wrangler deploy
```

**Expected Output:**
```
✨ Built successfully
✨ Deployed aether-bridge
   https://bridge.a-to-mind.com
```

### Step 4: Set Auth Keys

```bash
# Set nucleus key (for proposals/lessons write endpoints)
wrangler secret put BRIDGE_NUCLEUS_KEY
# Enter the generated key when prompted

# Set service key (for AI heartbeat, council log, tasks endpoints)
wrangler secret put BRIDGE_SERVICE_KEY
# Enter the generated key when prompted
```

### Step 5: Verify Deployment

```bash
# Check worker is running
curl https://bridge.a-to-mind.com/health

# Expected response:
# {
#   "ok": true,
#   "service": "aether-bridge",
#   "version": "0.16.2",
#   "ts": "2026-06-10T...",
#   "bindings": { ... }
# }
```

### Step 6: Test Auth Middleware

#### Test 1: Unprotected Endpoint (Should Work)
```bash
curl https://bridge.a-to-mind.com/health
# Expected: 200 OK
```

#### Test 2: Protected Endpoint Without Auth (Should Fail)
```bash
curl -X POST https://bridge.a-to-mind.com/proposals/write \
  -H "Content-Type: application/json" \
  -d '{"items": [], "source": "test"}'
# Expected: 401 Unauthorized
```

#### Test 3: Protected Endpoint With Invalid Auth (Should Fail)
```bash
curl -X POST https://bridge.a-to-mind.com/proposals/write \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_key" \
  -d '{"items": [], "source": "test"}'
# Expected: 403 Forbidden
```

#### Test 4: Protected Endpoint With Valid Auth (Should Succeed)
```bash
curl -X POST https://bridge.a-to-mind.com/proposals/write \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BRIDGE_NUCLEUS_KEY" \
  -d '{"items": [], "source": "test"}'
# Expected: 200 OK
```

### Step 7: Test HMAC Verification

#### Test 1: Webhook Without Signature (Should Fail)
```bash
curl -X POST https://bridge.a-to-mind.com/webhooks/notion \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Expected: 401 Unauthorized
```

#### Test 2: Webhook With Invalid Signature (Should Fail)
```bash
curl -X POST https://bridge.a-to-mind.com/webhooks/notion \
  -H "Content-Type: application/json" \
  -H "x-notion-signature: sha256=invalid" \
  -d '{"test": "data"}'
# Expected: 401 Unauthorized
```

#### Test 3: Webhook With Valid Signature (Should Succeed)
```bash
# This requires generating a valid HMAC signature
# Use the NOTION_WEBHOOK_SECRET to sign the payload
# Expected: 200 OK
```

### Step 8: Test All Protected Endpoints

#### Nucleus Scope Endpoints
```bash
# POST /proposals/write
curl -X POST https://bridge.a-to-mind.com/proposals/write \
  -H "Authorization: Bearer YOUR_BRIDGE_NUCLEUS_KEY" \
  -H "Content-Type: application/json" \
  -d '{"items": [], "source": "test"}'

# POST /lessons/write
curl -X POST https://bridge.a-to-mind.com/lessons/write \
  -H "Authorization: Bearer YOUR_BRIDGE_NUCLEUS_KEY" \
  -H "Content-Type: application/json" \
  -d '{"items": [], "source": "test"}'
```

#### Service Scope Endpoints
```bash
# POST /api/ai/heartbeat
curl -X POST https://bridge.a-to-mind.com/api/ai/heartbeat \
  -H "Authorization: Bearer YOUR_BRIDGE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ai_id": "test", "name": "Test AI"}'

# POST /api/council/log
curl -X POST https://bridge.a-to-mind.com/api/council/log \
  -H "Authorization: Bearer YOUR_BRIDGE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test", "agent_id": "test", "role": "user", "content": "test"}'

# POST /tasks
curl -X POST https://bridge.a-to-mind.com/tasks \
  -H "Authorization: Bearer YOUR_BRIDGE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ai_id": "test", "title": "Test Task"}'
```

### Step 9: Update Integration Points

#### Update Backend to Use Auth Keys
**File:** `apps/backend/.env`
```bash
BRIDGE_NUCLEUS_KEY=YOUR_BRIDGE_NUCLEUS_KEY
BRIDGE_SERVICE_KEY=YOUR_BRIDGE_SERVICE_KEY
```

#### Update Notion Integration to Use HMAC
**File:** `apps/backend/.env`
```bash
NOTION_WEBHOOK_SECRET=YOUR_NOTION_WEBHOOK_SECRET
```

### Step 10: Monitor for Issues

```bash
# Check worker logs
wrangler tail

# Monitor for errors
# Check for 401/403 responses
# Check for HMAC verification failures
```

## Post-Deployment Checklist

### 1. Verify All Tests Pass
- [ ] Unprotected endpoints work
- [ ] Protected endpoints without auth fail (401)
- [ ] Protected endpoints with invalid auth fail (403)
- [ ] Protected endpoints with valid auth succeed (200)
- [ ] HMAC verification works
- [ ] All integration points updated

### 2. Update Documentation
- [ ] Update wrangler.toml with key setup instructions
- [ ] Update CLERK_INTEGRATION.md if needed
- [ ] Update API documentation with auth requirements
- [ ] Document auth key locations

### 3. Merge PR
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Integration points updated
- [ ] Merge PR #99 to main

### 4. Clean Up
- [ ] Delete feature branch
- [ ] Remove local test files
- [ ] Archive deployment notes

## Rollback Plan

### If Deployment Fails

#### Step 1: Revert Worker
```bash
cd apps/bridge
wrangler rollback
```

#### Step 2: Remove Auth Keys
```bash
wrangler secret delete BRIDGE_NUCLEUS_KEY
wrangler secret delete BRIDGE_SERVICE_KEY
```

#### Step 3: Restore Previous Version
```bash
git checkout main
wrangler deploy
```

#### Step 4: Verify Rollback
```bash
curl https://bridge.a-to-mind.com/health
curl -X POST https://bridge.a-to-mind.com/proposals/write \
  -H "Content-Type: application/json" \
  -d '{"items": [], "source": "test"}'
# Should work without auth (previous behavior)
```

### If Auth Keys Compromised

#### Step 1: Generate New Keys
- Generate new BRIDGE_NUCLEUS_KEY
- Generate new BRIDGE_SERVICE_KEY

#### Step 2: Update Secrets
```bash
wrangler secret put BRIDGE_NUCLEUS_KEY
wrangler secret put BRIDGE_SERVICE_KEY
```

#### Step 3: Update Integration Points
- Update backend .env
- Update any other services using the keys

#### Step 4: Revoke Old Keys
- Old keys are automatically revoked when new keys are set

## Security Considerations

### Key Management
- Store keys in password manager
- Never commit keys to git
- Rotate keys regularly
- Use strong random keys (32+ characters)

### HMAC Verification
- NOTION_WEBHOOK_SECRET must be kept secure
- Verify signature on all webhook requests
- Use constant-time comparison (already implemented)

### Access Control
- Nucleus key for high-privilege operations
- Service key for service-to-service communication
- Separate keys for different scopes

## Troubleshooting

### Issue: 401 Unauthorized
**Cause:** Missing or invalid Authorization header
**Solution:** Verify Bearer token is correct and properly formatted

### Issue: 403 Forbidden
**Cause:** Invalid auth key
**Solution:** Verify key matches the expected scope (nucleus vs service)

### Issue: HMAC Verification Failed
**Cause:** Invalid signature or missing NOTION_WEBHOOK_SECRET
**Solution:** Verify secret is set and signature is correctly generated

### Issue: Worker Not Responding
**Cause:** Deployment failed or worker crashed
**Solution:** Check wrangler logs, redeploy if necessary

## Estimated Time

- Pre-deployment: 30 minutes
- Deployment: 15 minutes
- Testing: 30 minutes
- Post-deployment: 15 minutes
- Total: ~1.5 hours

## Next Steps

1. Review and approve PR #99
2. Generate auth keys
3. Follow deployment steps
4. Test thoroughly
5. Monitor for issues
6. Merge PR if successful
