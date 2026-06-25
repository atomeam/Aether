# Aether Deployment Checklist

## P0 Deployment Blockers - Manual Steps Required

### 1. Cloudflare Dashboard - Stripe Secrets

**Status:** ❌ BLOCKED - Manual intervention required

**Steps:**
1. Open Cloudflare Dashboard: https://dash.cloudflare.com
2. Navigate to: Workers & Pages → bridge worker
3. Go to: Settings → Variables & Secrets
4. Add Environment Variable:
   - Name: `STRIPE_API_KEY`
   - Value: `sk_test_...` (your test secret key)
   - Type: Secret
5. Add Environment Variable:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (your webhook secret)
   - Type: Secret
6. Click "Deploy" to redeploy worker with secrets

**Verification:**
- Worker should deploy successfully
- No errors in deployment logs
- Secrets should appear in Variables & Secrets section

**Troubleshooting:**
- If deployment fails: Check secret format (should start with sk_test_ or whsec_)
- If secrets don't appear: Refresh page and try again
- If worker doesn't start: Check worker logs for secret access errors

---

### 2. Stripe Dashboard - Webhook Endpoint

**Status:** ❌ BLOCKED - Manual intervention required

**Steps:**
1. Open Stripe Dashboard: https://dashboard.stripe.com/test
2. Navigate to: Developers → Webhooks
3. Click "Add endpoint"
4. Enter endpoint URL: `https://bridge.a-to-mind.com/api/billing/webhook`
5. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
6. Click "Add endpoint"
7. Copy the webhook signing secret (starts with `whsec_`)
8. Update Cloudflare worker with the correct webhook secret

**Verification:**
- Webhook endpoint should appear in Stripe Dashboard
- Status should show "Active" or "Listening"
- Test webhook by sending a test event

**Troubleshooting:**
- If endpoint fails: Check URL is correct and accessible
- If events not received: Check event selection
- If webhook secret invalid: Regenerate and update Cloudflare

---

### 3. Vercel Dashboard - Frontend Deployment

**Status:** ❌ BLOCKED - Manual intervention required

**Steps:**
1. Open Vercel Dashboard: https://vercel.com/atomicmoonbeam88-1661s-projects
2. Navigate to: aether-production project
3. Click "Deployments" tab
4. Click "Redeploy" button
5. Select "Redeploy to Production"
6. Wait for deployment to complete

**Verification:**
- Deployment should show "Ready" status
- a-to-mind.com should serve frontend
- No 404 errors on main page

**Troubleshooting:**
- If deployment fails: Check build logs for errors
- If 404 persists: Check environment variables
- If build errors: Run `npm run build` locally first

---

### 4. n8n Workflow - Slack Integration

**Status:** ⚠️ PARTIAL - Channel ID known, token needed

**Steps:**
1. Open n8n: https://your-n8n-instance.com
2. Navigate to: Credentials → New → Slack OAuth2 API
3. Add Slack bot token (starts with `xoxb-`)
4. Ensure token has scopes:
   - `chat:write`
   - `channels:read`
5. Update "Notify Slack on Issues" node:
   - Channel ID: `C0BA3JA3C8Z`
   - Credential: Select the Slack OAuth2 API credential
6. Click "Execute Workflow" to test
7. If successful, toggle workflow to "Active"

**Verification:**
- Workflow should execute without errors
- All nodes should turn green
- Test message should appear in #ops-runs channel
- Workflow should show "Active" status

**Troubleshooting:**
- If credential fails: Check token scopes and validity
- If channel not found: Verify channel ID is correct
- If message not sent: Check bot permissions in Slack

---

## Post-Deployment Verification

### Smoke Test
```bash
cd C:\Users\adamm\Aether
npm run smoke
```

**Expected:** 5/5 PASS

### Billing Verification
```bash
cd C:\Users\adamm\Aether
npm run verify:billing
```

**Expected:** 6/6 PASS

### Health Check
```bash
curl https://a-to-mind.com/api/health
```

**Expected:** JSON response with status: "healthy"

### Stack Status
```bash
curl https://a-to-mind.com/api/stack
```

**Expected:** JSON response with stack information

---

## Success Criteria

### Phase 1 Success
- ✅ Bridge worker deployed with Stripe secrets
- ✅ Stripe webhook functional
- ✅ Frontend deployed to a-to-mind.com
- ✅ Smoke test: 5/5 PASS
- ✅ Billing verification: 6/6 PASS

### Phase 2 Success
- ✅ n8n workflow active and sending to #ops-runs
- ✅ Agent loop running and processing actions
- ✅ Governance enforcing policies
- ✅ All health endpoints responding

---

## Rollback Procedures

### If Cloudflare Deployment Fails
1. Go to Cloudflare Dashboard → Workers → bridge
2. Click "Deployments" tab
3. Select previous successful deployment
4. Click "Rollback"
5. Verify worker is functioning

### If Vercel Deployment Fails
1. Go to Vercel Dashboard → aether-production
2. Click "Deployments" tab
3. Select previous successful deployment
4. Click "Redeploy"
5. Verify frontend is accessible

### If Stripe Integration Fails
1. Disable webhook in Stripe Dashboard
2. Remove Stripe secrets from Cloudflare worker
3. Redeploy worker
4. System should function without Stripe

---

## Monitoring Post-Deployment

### Key Metrics to Monitor
- Backend health: https://a-to-mind.com/api/health
- Agent status: https://a-to-mind.com/api/agents
- Error rates in logs
- Stripe webhook success rate
- n8n workflow execution rate

### Alert Thresholds
- Backend health: Should be "healthy"
- Agent status: Should be "running"
- Error rate: <5%
- Webhook success: >95%
- Workflow execution: >90%

---

## Documentation Updates

After successful deployment:
1. Update AGENTS.md with deployment status
2. Update AGENT-HUB-ASSESSMENT.md with completed items
3. Create deployment runbook
4. Document any issues encountered
5. Update troubleshooting guides

---

## Next Steps After Deployment

### Immediate
1. Test all health endpoints
2. Verify Stripe integration with test purchase
3. Test n8n workflow with test event
4. Monitor logs for 24 hours

### Short-term
1. Set up automated monitoring
2. Create incident response procedures
3. Document common issues
4. Train team on deployment process

### Long-term
1. Automate deployment process
2. Implement CI/CD pipeline
3. Add comprehensive testing
4. Create disaster recovery procedures

---

**Checklist Version:** 1.0
**Last Updated:** 2026-06-11
**Status:** Ready for execution
**Estimated Time:** 30-45 minutes for all manual steps