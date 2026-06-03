# Admin Actuator Endpoints - Deployment Checklist

## 🎯 Mission: devin-bridge-admin-actuator-v0-2026-05-31

**Status:** Implementation Complete, Awaiting Deployment
**PR:** https://github.com/atomeam/Aether/pull/new/feature/admin-actuator-endpoints-v0
**Commit:** 37ef005

---

## 📋 Prerequisites

### ✅ Completed
- [x] Code implementation complete
- [x] D1 migration created (0009_admin_audit_log.sql)
- [x] Test suite created (test_admin_actuator.ts)
- [x] Environment variable documentation (ADMIN_ACTUATOR_ENV_VARS.md)
- [x] PR created and pushed

### ⏳ Required Before Deployment
- [ ] GitHub Actions rerun completed successfully
- [ ] PR reviewed and merged to main branch
- [ ] Cloudflare account access verified

---

## 🔐 Step 1: Generate Admin HMAC Secret

```bash
# Generate cryptographically secure secret
openssl rand -hex 32
```

**Save this secret securely** - you'll need it for the ADMIN_HMAC_SECRET environment variable.

---

## 🔧 Step 2: Configure Environment Variables

Navigate to the bridge directory:
```bash
cd apps/bridge
```

### 2.1 Admin Authentication
```bash
wrangler secret put ADMIN_HMAC_SECRET
# Paste the generated secret from Step 1
```

### 2.2 GitHub Integration
```bash
wrangler secret put GITHUB_TOKEN
# Paste your GitHub personal access token with repo:workflow scope

wrangler secret put GITHUB_REPO
# Enter: atomeam/Aether

wrangler secret put GITHUB_WORKFLOW
# Enter: deploy-aether-bridge.yml
```

### 2.3 Cloudflare Integration
```bash
wrangler secret put CLOUDFLARE_API_TOKEN
# Paste your Cloudflare API token with Worker deployment permissions

wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Enter: 95745fedbea06314e24c27233033a37d
```

### 2.4 Notion Integration
```bash
wrangler secret put NOTION_RUNS_DB_ID
# Enter your Notion Runs database ID
```

### 2.5 Verify All Secrets
```bash
wrangler secret list
# Expected: 15 secrets total (8 existing + 7 new)
```

---

## 🗄️ Step 3: Run D1 Migration

Create the admin audit log table:
```bash
wrangler d1 execute BRIDGE_DB --file=migrations/0009_admin_audit_log.sql
```

**Verify migration:**
```bash
wrangler d1 execute BRIDGE_DB --command="SELECT name FROM sqlite_master WHERE type='table' AND name='admin_audit_log';"
# Expected: Returns admin_audit_log table name
```

---

## 🚀 Step 4: Deploy Worker

```bash
wrangler deploy
```

**Expected Output:**
- Upload successful
- Triggers deployed (schedules, queue producer/consumer)
- Worker URL: https://aether-bridge.atomicmoonbeam88.workers.dev
- Version ID: (new version ID)

**Save the Version ID** for evidence documentation.

---

## 🧪 Step 5: Test Authentication

### 5.1 Test Suite (Automated)
```bash
# Install tsx if not available
npm install -g tsx

# Set environment variables
export BASE_URL="https://aether-bridge.atomicmoonbeam88.workers.dev"
export ADMIN_HMAC_SECRET="your-secret-from-step-1"

# Run test suite
tsx test_admin_actuator.ts
```

**Expected Results:**
- ✅ Missing timestamp header - 401
- ✅ Missing signature header - 401
- ✅ Expired timestamp - 401
- ✅ Invalid signature - 401
- ✅ Unknown endpoint - 404
- ✅ Valid authentication - 200

### 5.2 Manual Test
```bash
# Test Cloudflare verification endpoint
TIMESTAMP=$(date +%s)
BODY=""
SIGNATURE=$(echo -n "${TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac $ADMIN_SECRET | sed 's/^.*= //')

curl -X GET https://aether-bridge.atomicmoonbeam88.workers.dev/admin/cloudflare/verify-token-scopes \
  -H "X-Atomind-Timestamp: $TIMESTAMP" \
  -H "X-Atomind-Signature: sha256=$SIGNATURE" \
  -H "Content-Type: application/json"
```

**Expected:** 200 response with capability status

---

## 🔍 Step 6: Test Admin Endpoints

### 6.1 Cloudflare Token Verification
```bash
# GET /admin/cloudflare/verify-token-scopes
# (Use manual test from Step 5.2)
```

**Expected:** Returns capability: "OK" or "INSUFFICIENT"

### 6.2 GitHub Deploy Trigger
```bash
# POST /admin/deploy/trigger
TIMESTAMP=$(date +%s)
BODY='{"branch":"main"}'
SIGNATURE=$(echo -n "${TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac $ADMIN_SECRET | sed 's/^.*= //')

curl -X POST https://aether-bridge.atomicmoonbeam88.workers.dev/admin/deploy/trigger \
  -H "X-Atomind-Timestamp: $TIMESTAMP" \
  -H "X-Atomind-Signature: sha256=$SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

**Expected:** Returns workflowRunId and runUrl

### 6.3 GitHub Status Poll
```bash
# GET /admin/deploy/status/:workflowRunId
# Use the workflowRunId from Step 6.2
TIMESTAMP=$(date +%s)
BODY=""
SIGNATURE=$(echo -n "${TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac $ADMIN_SECRET | sed 's/^.*= //')

curl -X GET https://aether-bridge.atomicmoonbeam88.workers.dev/admin/deploy/status/$WORKFLOW_RUN_ID \
  -H "X-Atomind-Timestamp: $TIMESTAMP" \
  -H "X-Atomind-Signature: sha256=$SIGNATURE" \
  -H "Content-Type: application/json"
```

**Expected:** Returns workflow status (queued, in_progress, completed, etc.)

### 6.4 Notion Runs Complete
```bash
# POST /admin/runs/complete
TIMESTAMP=$(date +%s)
BODY='{"runId":"test-run-001","finalState":"succeeded","requiredArtifactsMet":true}'
SIGNATURE=$(echo -n "${TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac $ADMIN_SECRET | sed 's/^.*= //')

curl -X POST https://aether-bridge.atomicmoonbeam88.workers.dev/admin/runs/complete \
  -H "X-Atomind-Timestamp: $TIMESTAMP" \
  -H "X-Atomind-Signature: sha256=$SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

**Expected:** Updates Notion Runs ledger with Status=Done

---

## 📊 Step 7: Verify Audit Logging

```bash
# Check admin_audit_log table
wrangler d1 execute BRIDGE_DB --command="SELECT * FROM admin_audit_log ORDER BY timestamp DESC LIMIT 10;"
```

**Expected:** Shows recent admin calls with auth status, endpoints, and metadata

---

## 🎯 Step 8: Evidence Collection

### 8.1 Deployment Evidence
- [ ] Worker Version ID: _______________
- [ ] Deployment timestamp: _______________
- [ ] Deployed URL: https://aether-bridge.atomicmoonbeam88.workers.dev

### 8.2 Test Evidence
- [ ] Auth negative tests: All passed
- [ ] Cloudflare capability: _______________
- [ ] GitHub dispatch: workflowRunId _______________
- [ ] Notion writeback: _______________

### 8.3 D1 Evidence
- [ ] admin_audit_log table created: Yes
- [ ] Audit log entries present: Yes

---

## 🔒 Step 9: Security Verification

### 9.1 Replay Protection Test
```bash
# Test with expired timestamp (301 seconds old)
OLD_TIMESTAMP=$(($(date +%s) - 301))
BODY=""
SIGNATURE=$(echo -n "${OLD_TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac $ADMIN_SECRET | sed 's/^.*= //')

curl -X GET https://aether-bridge.atomicmoonbeam88.workers.dev/admin/cloudflare/verify-token-scopes \
  -H "X-Atomind-Timestamp: $OLD_TIMESTAMP" \
  -H "X-Atomind-Signature: sha256=$SIGNATURE" \
  -H "Content-Type: application/json"
```

**Expected:** 401 - "Timestamp expired or invalid"

### 9.2 Audit Log Verification
```bash
# Check for failed auth attempts in audit log
wrangler d1 execute BRIDGE_DB --command="SELECT * FROM admin_audit_log WHERE auth_status='FAILURE';"
```

**Expected:** Shows failed auth attempts with reasons

---

## 📝 Step 10: Documentation Update

Update the following with deployment evidence:
- [ ] Mission brief in Crew Room
- [ ] Runs ledger in Notion
- [ ] ADMIN_ACTUATOR_ENV_VARS.md with actual values (redacted)

---

## ✅ Completion Criteria

**Mission Complete When:**
- [x] All admin endpoints implemented
- [x] D1 audit log table created
- [x] Test suite created and passing
- [ ] All environment variables configured
- [ ] Worker deployed successfully
- [ ] All endpoint tests passing
- [ ] Audit logging verified
- [ ] Security tests passing
- [ ] Evidence documented

---

## 🚨 Troubleshooting

### Issue: 401 Unauthorized
**Solution:** Verify ADMIN_HMAC_SECRET matches between generation and configuration

### Issue: GitHub dispatch fails
**Solution:** Verify GITHUB_TOKEN has repo:workflow scope and GITHUB_REPO is correct

### Issue: Cloudflare verification fails
**Solution:** Verify CLOUDFLARE_API_TOKEN has required permissions

### Issue: Notion writeback fails
**Solution:** Verify NOTION_RUNS_DB_ID is correct and Run ID exists in database

### Issue: Audit log not recording
**Solution:** Verify D1 migration ran successfully and BRIDGE_DB binding is correct

---

## 📞 Support

If issues persist:
1. Check Worker logs: `wrangler tail`
2. Verify D1 migration: `wrangler d1 execute BRIDGE_DB --command=".schema"`
3. Check secret configuration: `wrangler secret list`
4. Review audit log: `wrangler d1 execute BRIDGE_DB --command="SELECT * FROM admin_audit_log LIMIT 5;"`

---

**Mission Status:** 🟡 **Awaiting Deployment**
**Next Action:** Complete GitHub Actions rerun, then proceed with Step 1