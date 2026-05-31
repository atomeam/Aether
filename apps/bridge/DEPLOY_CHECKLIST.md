# Bridge Worker Deploy Checklist

Run these before every `wrangler deploy` from your local machine.

## Pre-deploy

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Verify no uncommitted changes to worker source
git status
git diff apps/bridge/src/worker.ts

# 3. Confirm local matches remote
git log HEAD..origin/main   # should be empty
git log origin/main..HEAD   # should be empty (unless intentionally ahead)

# 4. Review wrangler.toml bindings match Env interface
grep "binding" apps/bridge/wrangler.toml
grep -A 10 "interface Env" apps/bridge/src/worker.ts
```

## Deploy

```bash
cd apps/bridge
wrangler deploy
```

## Post-deploy smoke

```bash
# Health check — should show all bindings: true
curl -s https://aether-bridge.atomicmoonbeam88.workers.dev/health | jq .

# Heartbeat — should return {"ok":true}
curl -s -X POST https://aether-bridge.atomicmoonbeam88.workers.dev/api/ai/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"ai_id":"smoke-test","name":"deploy-verify","status":"active"}'

# Tasks — should return {"ok":true, "task_id":...}
curl -s -X POST https://aether-bridge.atomicmoonbeam88.workers.dev/tasks \
  -H "Content-Type: application/json" \
  -d '{"ai_id":"smoke-test","title":"deploy-verify","description":"post-deploy smoke"}'

# Verify D1 write landed
wrangler d1 execute aether-bridge-db --remote \
  --command "SELECT event_id, source, kind, created_at FROM events WHERE source='api' ORDER BY created_at DESC LIMIT 3"
```

## Rollback (if needed)

```bash
wrangler deployments list aether-bridge
wrangler rollback --version <previous-version-id>
```
