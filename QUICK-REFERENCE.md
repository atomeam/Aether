# Aether Quick Reference Guide

## Essential Commands

### Development
```bash
cd C:\Users\adamm\Aether

# Install dependencies
npm install

# Start backend (port 3000)
npm run dev:backend

# Start frontend (port 5173)
npm run dev:frontend

# Start both in parallel
npm run dev
```

### Testing
```bash
# Run all tests
npm run test

# Run agent tests
npm run test -w @aether/backend
npm run test:agents

# Type check
npm run typecheck

# Build
npm run build
```

### Deployment
```bash
# Deploy to Vercel
pwsh scripts/deploy.ps1 -Target vercel

# Deploy to Cloudflare
pwsh scripts/deploy.ps1 -Target cloudflare

# Deploy to both
pwsh scripts/deploy.ps1 -Target both
```

### Health & Monitoring
```bash
# Health check
pwsh scripts/health-check.ps1

# Health check with verbose output
pwsh scripts/health-check.ps1 -Verbose

# Continuous health monitoring
pwsh scripts/health-check.ps1 -Continuous
```

### Backup & Recovery
```bash
# Create backup
pwsh scripts/backup.ps1

# Restore from backup
pwsh scripts/restore.ps1 -BackupPath "path\to\backup.zip"
```

## Key Endpoints

### Backend (a-to-mind.com)
- `GET /api/health` - Backend health status
- `GET /api/stack` - Stack information
- `GET /api/agents` - Agent system health
- `POST /api/agents/loop/start` - Start agent loop
- `POST /api/agents/loop/stop` - Stop agent loop
- `GET /api/agents/loop/status` - Agent loop status
- `GET /api/agents/evaluate` - Ledger pattern suggestions
- `POST /api/agents/chaos` - Inject chaos scenario
- `GET /api/agents/chaos` - List chaos scenarios

### Project Ops Companion
- URL: https://project-ops-companion.vercel.app
- Features: Status monitoring, GitHub PRs, Vercel deployments, Cloudflare workers, performance metrics

## Important Files

### Configuration
- `package.json` - Root package configuration
- `turbo.json` - Turborepo pipeline configuration
- `apps/backend/package.json` - Backend dependencies
- `apps/frontend/package.json` - Frontend dependencies

### Agent System
- `apps/backend/src/agents/executor.ts` - Executor agent
- `apps/backend/src/agents/evaluator.ts` - Evaluator agent
- `apps/backend/src/agents/agent-loop.ts` - Agent loop integration
- `apps/backend/src/agents/agent-loop.test.ts` - Agent loop tests

### MCP Tools
- `packages/mcp-tools/src/index.ts` - MCP tool registry
- Tools: file_read, file_write, git_status, git_commit, http_request, lessons_write, get_agent_state, trigger_workflow, chaos_inject

### Scripts
- `scripts/deploy.ps1` - Deployment automation
- `scripts/backup.ps1` - Backup automation
- `scripts/restore.ps1` - Restore automation
- `scripts/health-check.ps1` - Health monitoring

## Environment Variables

### Required
- `GEMINI_API_KEY` - Google Gemini API key (for AI operations)

### Optional
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `STRIPE_API_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

## Common Issues & Solutions

### Wrangler Auth Conflicts
**Problem:** "You are logged in with an API Token"
**Solution:** Use Cloudflare Dashboard for manual operations

### Vercel Deployment Fails
**Problem:** "Project not found" or environment variable issues
**Solution:** Clear environment variables: `$env:VERCEL_PROJECT_ID = $null; $env:VERCEL_ORG_ID = $null`

### TypeScript Errors
**Problem:** Build fails with type errors
**Solution:** Run `npm run typecheck` to identify issues

### Package Resolution
**Problem:** 404 errors for @aether/* packages
**Solution:** Use `file:` dependencies in package.json

## Quick Links

### Dashboards
- Vercel: https://vercel.com/atomicmoonbeam88-1661s-projects
- Cloudflare: https://dash.cloudflare.com
- Stripe Test: https://dashboard.stripe.com/test

### Code
- GitHub: https://github.com/atomeam/Aether
- Quest Plan: https://app.notion.com/p/0ee94cf70fb84a5a94c656db5f44af5e
- Council P0: https://app.notion.com/p/8f8421e4f79a4434a5b86da3f55aac47

### Applications
- Project Ops Companion: https://project-ops-companion.vercel.app
- Quest Clean Companion: https://quest-clean-companion.netlify.app

## Agent Loop Quick Start

### Start Agent Loop
```bash
curl -X POST https://a-to-mind.com/api/agents/loop/start
```

### Check Agent Loop Status
```bash
curl https://a-to-mind.com/api/agents/loop/status
```

### Stop Agent Loop
```bash
curl -X POST https://a-to-mind.com/api/agents/loop/stop
```

### Get Agent System Health
```bash
curl https://a-to-mind.com/api/agents
```

## Chaos Testing Quick Start

### List Chaos Scenarios
```bash
curl https://a-to-mind.com/api/agents/chaos
```

### Inject Chaos Scenario
```bash
curl -X POST https://a-to-mind.com/api/agents/chaos \
  -H "Content-Type: application/json" \
  -d '{"scenario": "broken_package_json", "targetPath": "sandbox"}'
```

## Performance Targets

### Response Time
- Target: <100ms
- Good: 100-200ms
- Poor: >200ms

### Error Rate
- Target: <5%
- Elevated: 5-10%
- Critical: >10%

### Uptime
- Target: >99%
- Good: 95-99%
- Poor: <95%

## Git Workflow

### Branch Protection
- Main branch is protected
- Requires 1 review + CodeRabbit
- Requires CI tests to pass
- Requires pre-merge validation
- Linear history enforced

### Cross-Agent Push Protocol
1. Cowork commits locally in `C:\Users\adamm\Claude\Projects\a-to-mind.com`
2. Devin fetches: `git -C C:\Users\adamm\Aether fetch C:\Users\adamm\Claude\Projects\a-to-mind.com main:cowork-import`
3. Push as feature branch and open PR
4. Never target main directly

## Emergency Procedures

### Backend Down
1. Check health endpoint: `curl https://a-to-mind.com/api/health`
2. Check backend logs
3. Restart backend: `cd C:\Users\adamm\Aether && npm run dev:backend`
4. If persistent, restore from backup

### Agent Loop Stuck
1. Check loop status: `curl https://a-to-mind.com/api/agents/loop/status`
2. Stop loop: `curl -X POST https://a-to-mind.com/api/agents/loop/stop`
3. Restart loop: `curl -X POST https://a-to-mind.com/api/agents/loop/start`
4. Monitor for issues

### Deployment Failure
1. Check deployment logs
2. Verify environment variables
3. Run build locally: `npm run build`
4. Use rollback procedure from deployment checklist

---

**Version:** 1.0
**Last Updated:** 2026-06-11
**Purpose:** Quick reference for common operations