# Critical Issues Fixed - 2026-06-10

## Issues Fixed

### 1. JSON.parse Bug in Bridge Worker ✅ FIXED
**Issue:** `/api/ai/heartbeat` and `/api/council/log` on main were missing JSON.parse error handling
**Impact:** Heartbeats broken since May 21, error response leaks council registry
**Fix:** Added try-catch around request.json() in both endpoints
**Branch:** fix/bridge-json-parse-bug
**Commit:** 6dc7f73
**Status:** Ready for PR and merge

### 2. Command Injection Vulnerability ✅ FIXED
**Issue:** apps/backend/server.ts had command injection vulnerability
**Impact:** Arbitrary command execution possible
**Fix:** Added command validation allowlist
**Branch:** security-consolidation
**Commit:** 505f388
**Status:** Ready for PR and merge

---

## Issues Requiring Investigation

### 3. Curator Pipeline Spam
**Issue:** 12 proposals stuck in pending_review since May 20, 8 junk "Untitled" rows from webhook echo loop
**Impact:** Curator pipeline jammed, no filtering
**Status:** ⏳ PENDING - Requires Notion database investigation

### 4. Coordination Systems Never Merged
**Issue:** Slack plane (Atom Bomb + Viktor DMs) went silent ~June 5 with open work, Notion Council Relay (AD-025) took over but doesn't include Viktor or CF agent
**Impact:** Orphaned work in abandoned plane
**Status:** ⏳ PENDING - Requires coordination system redesign

### 5. Standing Repo Violations
**Issue:** Deployed bridge runs uncommitted code (/tasks route and cron live only in local checkout, not on main)
**Impact:** Redeploy from main would silently delete live functionality
**Status:** ⏳ PENDING - Need to verify if /tasks and cron are actually in main (they appear to be in main branch)

---

## Dead Endpoints

### Dead (Confirmed)
- a-to-mind.com/api/* (Vercel apex) - returns truly empty
- aether. subdomain
- notion. subdomain
- notion-worker.workers.dev (was smoke-verified May 28, now unreachable)

### Alive (Confirmed)
- bridge.a-to-mind.com (Cloudflare worker) - fully alive, /health ok, /api/stack returns online, all 5 bindings live

---

## Next Steps

### Immediate (Human Required)
1. Review and merge fix/bridge-json-parse-bug PR
2. Review and merge security-consolidation PR
3. Investigate curator pipeline spam in Notion database
4. Verify /tasks endpoint and cron triggers in deployed bridge worker

### Medium Term
1. Consolidate coordination systems (Slack + Notion Council Relay)
2. Fix Vercel backend deploy (a-to-mind.com/api/*)
3. Fix dead subdomains (aether., notion.)
4. Fix notion-worker.workers.dev

### Long Term
1. Implement Multi-Agent Coordination Protocol fully
2. Implement git worktree for each agent
3. Implement lease system in Notion Runs ledger
4. Implement single merge gate (PR-based workflow)

---

## Summary

**Fixed:** 2 critical bugs (JSON.parse, command injection)
**Pending:** 5 issues requiring investigation or human action
**Status:** Immediate security fixes ready for merge, infrastructure issues require investigation
