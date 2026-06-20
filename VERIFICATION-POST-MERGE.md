# Post-Merge Verification: IDOR Closure

**Incident:** [RUN-2026-06-19-IDOR-CONSOLIDATION-AND-VERIFICATION](https://app.notion.com/p/RUN-2026-06-19-IDOR-CONSOLIDATION-AND-VERIFICATION-95e6b755c7f74f67b68aec84893510d7?pvs=21)
**Status:** BLOCKED → Run these commands to verify closure

---

## Step 1: Verify Old Worker Deleted

```bash
# Check if aether-bridge-saas still exists
npx wrangler deployments list --name aether-bridge-saas
```

**Expected output if deleted:**
```
No deployments found
```

**Expected output if still exists:**
```
deployment-id-1  ...  2024-xx-xx
```

If it exists → run:
```bash
npx wrangler delete --name aether-bridge-saas
```

---

## Step 2: Verify Auth Gate (Negative - Expect 401)

```bash
# Test unauthenticated POST → expect 401
curl -i -X POST https://bridge.a-to-mind.com/saas/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"test task"}'

# Test invalid Bearer token → expect 401
curl -i -X GET https://bridge.a-to-mind.com/saas/tasks \
  -H "Authorization: Bearer invalid-token-abc123"
```

**Expected output:**
```
HTTP/2 401
{"error":"Missing Authorization header"}
```

or

```
HTTP/2 401
{"error":"Invalid API key"}
```

---

## Step 3: Verify Auth Gate (Positive - Expect 2xx)

```bash
# Replace <YOUR_VALID_KEY> with a real API key from KV
# The key must be stored as: api_key:<sha256-hash> -> {"workspace_id":"..."}

curl -i -X POST https://bridge.a-to-mind.com/saas/tasks \
  -H "Authorization: Bearer <YOUR_VALID_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"title":"verification test"}'
```

**Expected output:**
```
HTTP/2 200 (or 201)
{"ok":true,"task_id":"task-...","workspace_id":"..."}
```

---

## Step 4: Verify Cross-Tenant Isolation

```bash
# Create a task in workspace A, try to access with workspace B's key
# Expect 403 Forbidden

curl -i -X POST https://bridge.a-to-mind.com/saas/tasks \
  -H "Authorization: Bearer <WRONG_WORKSPACE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"title":"should fail","project_id":"proj-from-other-workspace"}'
```

**Expected output:**
```
HTTP/2 403
{"error":"Access denied: project belongs to another workspace"}
```

---

## Step 5: Health Check (No Auth Required)

```bash
curl -i https://bridge.a-to-mind.com/saas/health
```

**Expected output:**
```
HTTP/2 200
{"ok":true,"service":"saas-routes","timestamp":"..."}
```

---

## Paste Results Template

```
=== STEP 1: Old Worker Status ===
[PASTE OUTPUT HERE]

=== STEP 2: Negative Auth Test ===
[PASTE OUTPUT HERE]

=== STEP 3: Positive Auth Test ===
[PASTE OUTPUT HERE]

=== STEP 4: Cross-Tenant Test ===
[PASTE OUTPUT HERE]

=== STEP 5: Health Check ===
[PASTE OUTPUT HERE]
```

---

## Success Criteria

| Check | Expected | Pass? |
|-------|----------|-------|
| Step 1 | "No deployments found" or deleted | ☐ |
| Step 2 | HTTP 401 + error body | ☐ |
| Step 3 | HTTP 2xx + task created | ☐ |
| Step 4 | HTTP 403 (if project_id cross-workspace) | ☐ |
| Step 5 | HTTP 200 + ok:true | ☐ |

**All boxes checked → Incident CLOSED**