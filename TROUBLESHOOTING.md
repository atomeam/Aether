# Aether Troubleshooting Guide

This guide provides solutions to common issues encountered when developing, deploying, and using the Aether system.

## Table of Contents

- [Getting Started](#getting-started)
- [Common Issues](#common-issues)
  - [Installation Issues](#installation-issues)
  - [Development Issues](#development-issues)
  - [Build Issues](#build-issues)
  - [Deployment Issues](#deployment-issues)
  - [Runtime Issues](#runtime-issues)
  - [Integration Issues](#integration-issues)
- [Emergency Procedures](#emergency-procedures)
- [Getting Help](#getting-help)

## Getting Started

### Quick Diagnosis

Before diving into specific issues, run these quick checks:

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Check npm version
npm --version  # Should be >= 10.9.8

# Check if dependencies are installed
ls node_modules

# Check environment variables
cat .env

# Run health check
npm run smoke
```

## Common Issues

### Installation Issues

#### Issue: npm install fails

**Symptoms:**
- `npm install` hangs or fails
- Dependency resolution errors
- Network timeout errors

**Solutions:**

1. **Clear npm cache**
   ```bash
   npm cache clean --force
   ```

2. **Use npm legacy peer deps**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Check network connectivity**
   ```bash
   ping registry.npmjs.org
   ```

4. **Use a different registry**
   ```bash
   npm install --registry=https://registry.npmjs.org
   ```

5. **Delete node_modules and reinstall**
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

#### Issue: Workspace packages not found

**Symptoms:**
- `Cannot find module '@aether/package-name'`
- 404 errors for @aether/* packages
- Module resolution failures

**Solutions:**

1. **Verify workspaces configuration**
   ```json
   // package.json
   {
     "workspaces": [
       "apps/*",
       "packages/*"
     ]
   }
   ```

2. **Use file: dependencies**
   ```json
   {
     "dependencies": {
       "@aether/contracts": "file:../packages/contracts"
     }
   }
   ```

3. **Regenerate lockfile**
   ```bash
   rm package-lock.json
   npm install
   ```

4. **Check package.json exports**
   ```json
   {
     "exports": {
       ".": {
         "types": "./src/index.ts",
         "default": "./src/index.ts"
       }
     }
   }
   ```

### Development Issues

#### Issue: Backend server won't start

**Symptoms:**
- `npm run dev:backend` fails
- Port already in use error
- Environment variable errors

**Solutions:**

1. **Check if port is in use**
   ```bash
   # Windows
   netstat -ano | findstr :3000

   # Kill process
   taskkill /PID <PID> /F
   ```

2. **Verify environment variables**
   ```bash
   cat .env
   # Ensure GEMINI_API_KEY is set
   ```

3. **Check for syntax errors**
   ```bash
   npm run typecheck -w @aether/backend
   ```

4. **Start with debug logging**
   ```bash
   DEBUG=* npm run dev:backend
   ```

#### Issue: Frontend hot reload not working

**Symptoms:**
- Changes not reflected in browser
- HMR errors in console
- Page refreshes on every change

**Solutions:**

1. **Clear Vite cache**
   ```bash
   rm -rf node_modules/.vite
   ```

2. **Check Vite configuration**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     server: {
       hmr: {
         port: 24678
       }
     }
   })
   ```

3. **Disable browser cache**
   - Open DevTools
   - Network tab
   - Check "Disable cache"

4. **Restart dev server**
   ```bash
   # Stop and restart
   npm run dev:frontend
   ```

#### Issue: Turborepo cache issues

**Symptoms:**
- Old build artifacts used
- Changes not reflected
- Cache corruption

**Solutions:**

1. **Clear Turborepo cache**
   ```bash
   rm -rf .turbo
   ```

2. **Force rebuild**
   ```bash
   npx turbo run build --force
   ```

3. **Disable cache temporarily**
   ```bash
   npx turbo run build --no-cache
   ```

4. **Check turbo.json configuration**
   ```json
   {
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**"]
       }
     }
   }
   ```

### Build Issues

#### Issue: TypeScript compilation errors

**Symptoms:**
- Type errors during build
- Module not found errors
- Import resolution failures

**Solutions:**

1. **Run type check**
   ```bash
   npm run typecheck
   ```

2. **Check import paths**
   - Verify package.json exports
   - Check file paths are correct
   - Ensure @aether/* packages use `file:` dependencies

3. **Update type definitions**
   ```bash
   npm install --save-dev @types/package-name
   ```

4. **Clear build cache**
   ```bash
   rm -rf node_modules/.cache
   rm -rf dist
   npm run build
   ```

5. **Check tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true
     }
   }
   ```

#### Issue: Build fails on Vercel

**Symptoms:**
- Build fails in CI but not locally
- Environment variable errors
- Dependency resolution errors

**Solutions:**

1. **Check environment variables in Vercel**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Verify all required variables are set

2. **Test build locally with production config**
   ```bash
   NODE_ENV=production npm run build
   ```

3. **Check Vercel build logs**
   - Go to Vercel Dashboard
   - Deployments → Latest deployment
   - Review build logs

4. **Verify package.json scripts**
   ```json
   {
     "scripts": {
       "build": "turbo run build"
     }
   }
   ```

### Deployment Issues

#### Issue: Wrangler authentication issues

**Symptoms:**
- "You are logged in with an API Token"
- "The specified queue settings are invalid"
- Cannot set secrets via CLI

**Solutions:**

1. **Use Cloudflare Dashboard** (Recommended)
   - Go to https://dash.cloudflare.com
   - Navigate to Workers & Pages
   - Use Dashboard for all manual operations

2. **Clear environment variables**
   ```powershell
   $env:CLOUDFLARE_API_TOKEN = $null
   $env:CLOUDFLARE_ACCOUNT_ID = $null
   ```

3. **Logout and re-authenticate**
   ```bash
   wrangler logout
   wrangler login
   ```

4. **Check wrangler version**
   ```bash
   wrangler --version
   # Should be 4.x
   npm install -g wrangler@latest
   ```

#### Issue: Vercel deployment failures

**Symptoms:**
- "Project not found" error
- Environment variable conflicts
- Build failures

**Solutions:**

1. **Clear Vercel environment variables**
   ```powershell
   $env:VERCEL_PROJECT_ID = $null
   $env:VERCEL_ORG_ID = $null
   ```

2. **Remove .vercel directory**
   ```powershell
   Remove-Item -Recurse -Force .vercel
   ```

3. **Trigger manual deployment**
   - Go to Vercel Dashboard
   - Navigate to project
   - Click "Redeploy"

4. **Check build locally**
   ```bash
   npm run build
   ```

5. **Verify vercel.json configuration**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": null
   }
   ```

#### Issue: Cloudflare Workers deployment fails

**Symptoms:**
- Deployment timeout
- Binding errors
- Configuration errors

**Solutions:**

1. **Check wrangler.toml**
   ```toml
   name = "bridge"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"

   [[kv_namespaces]]
   binding = "KV"
   id = "your-kv-id"

   [[queues.producers]]
   binding = "QUEUE"
   queue = "your-queue-id"
   ```

2. **Verify bindings exist**
   - Go to Cloudflare Dashboard
   - Workers & Pages → KV/Queues
   - Create missing bindings

3. **Test locally**
   ```bash
   wrangler dev
   ```

4. **Check deployment logs**
   ```bash
   wrangler deployments list
   ```

### Runtime Issues

#### Issue: API returns 422 Curator Rejection

**Symptoms:**
- `/api/build` returns 422
- "curator_denied" error
- Actions rejected

**Solutions:**

1. **Check Curator policy**
   ```bash
   cat packages/curator/policy.yaml
   ```

2. **Verify action types**
   - Ensure action types are in allow-list
   - Check action count (max 10)
   - Review action parameters

3. **Test with /api/test/curator**
   ```bash
   curl -X POST http://localhost:3000/api/test/curator \
     -H "Content-Type: application/json" \
     -d '{"actions": [...]}'
   ```

4. **Review Curator decisions**
   ```bash
   curl http://localhost:3000/api/agents/curator/decisions
   ```

#### Issue: Agent loop not running

**Symptoms:**
- Agent loop not starting
- Loop stuck in processing
- Actions not executing

**Solutions:**

1. **Check loop status**
   ```bash
   curl http://localhost:3000/api/agents
   ```

2. **Restart loop**
   ```bash
   curl -X POST http://localhost:3000/api/agents/loop/stop
   curl -X POST http://localhost:3000/api/agents/loop/start
   ```

3. **Check agent health**
   ```bash
   curl http://localhost:3000/api/agents
   ```

4. **Review logs**
   - Check backend logs for errors
   - Look for curator rejections
   - Verify executor tool availability

#### Issue: High memory usage

**Symptoms:**
- Node.js process using excessive memory
- OOM errors
- Slow performance

**Solutions:**

1. **Profile memory usage**
   ```bash
   node --inspect backend/server.js
   # Open Chrome DevTools → Node.js profiler
   ```

2. **Check for memory leaks**
   - Review large data structures
   - Check for event listener leaks
   - Verify cache sizes

3. **Increase Node.js memory limit**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run dev:backend
   ```

4. **Implement caching limits**
   ```typescript
   // Add cache size limits
   const cache = new LRUCache({ max: 1000 })
   ```

### Integration Issues

#### Issue: Stripe webhook not receiving events

**Symptoms:**
- Webhook not receiving events
- Billing endpoints returning 404
- Secret verification failures

**Solutions:**

1. **Verify secrets in Cloudflare**
   - Go to Cloudflare Dashboard
   - Check Variables & Secrets
   - Verify STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET

2. **Test webhook endpoint**
   ```bash
   curl https://bridge.a-to-mind.com/api/billing/webhook
   ```

3. **Check Stripe Dashboard**
   - Verify webhook is active
   - Check event selection
   - Test with test event

4. **Run billing verification**
   ```bash
   npm run verify:billing
   ```

#### Issue: MCP tool execution fails

**Symptoms:**
- Tool execution errors
- Permission denied
- Tool not found

**Solutions:**

1. **Check tool registration**
   ```typescript
   // packages/mcp-tools/src/index.ts
   export const TOOL_REGISTRY = {
     // Verify tool is registered
   }
   ```

2. **Verify tool permissions**
   - Check file system permissions
   - Verify network access
   - Review security policies

3. **Test tool directly**
   ```bash
   curl -X POST http://localhost:3000/api/mcp/rpc \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"tools/call","params":{...},"id":1}'
   ```

4. **Review tool logs**
   - Check backend logs
   - Look for error messages
   - Verify input validation

#### Issue: Database/Storage issues

**Symptoms:**
- KV read/write failures
- Ledger not recording
- Data persistence issues

**Solutions:**

1. **Check KV bindings**
   - Go to Cloudflare Dashboard
   - Verify KV namespace bindings
   - Check worker configuration

2. **Test KV operations**
   - Use Cloudflare Dashboard KV viewer
   - Test read/write operations
   - Check binding names

3. **Verify worker configuration**
   ```toml
   [[kv_namespaces]]
   binding = "KV"
   id = "your-kv-id"
   ```

4. **Check network connectivity**
   - Verify worker can reach KV
   - Check for rate limits
   - Review error logs

## Emergency Procedures

### System Down

1. **Check health endpoints**
   ```bash
   curl http://localhost:3000/api/stack
   curl http://localhost:3000/api/agents
   ```

2. **Review logs for errors**
   - Backend logs: Check terminal output
   - Worker logs: Cloudflare Dashboard
   - Application logs: Check log files

3. **Restart services**
   ```bash
   # Restart backend
   npm run dev:backend

   # Restart workers (via Cloudflare Dashboard)
   ```

4. **If persistent, restore from backup**
   - Restore database from backup
   - Restore KV from backup
   - Verify data integrity

### Data Loss

1. **Stop all writes**
   - Stop backend server
   - Disable worker processing
   - Pause any automated jobs

2. **Assess damage**
   - Identify affected data
   - Determine time of loss
   - Check available backups

3. **Restore from backup**
   - Restore database from backup
   - Restore KV from backup
   - Verify data integrity

4. **Prevent future loss**
   - Review backup procedures
   - Increase backup frequency
   - Implement monitoring

### Security Incident

1. **Isolate affected systems**
   - Stop affected services
   - Block suspicious IPs
   - Revoke compromised credentials

2. **Review access logs**
   - Check authentication logs
   - Review API access logs
   - Identify unauthorized access

3. **Rotate secrets**
   - Rotate API keys
   - Change passwords
   - Update environment variables

4. **Document incident**
   - Create incident report
   - Document timeline
   - List remediation steps

### Deployment Failure

1. **Stop deployment**
   - Cancel in-progress deployment
   - Rollback if necessary
   - Stabilize current state

2. **Review build logs**
   - Check build errors
   - Review dependency issues
   - Identify root cause

3. **Fix issues**
   - Address build errors
   - Fix dependency conflicts
   - Update configuration

4. **Retry deployment**
   - Test locally first
   - Deploy to staging
   - Deploy to production

## Getting Help

### Documentation

- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API.md](./API.md) - API documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [AGENTS.md](./AGENTS.md) - Agent system documentation
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Deployment procedures
- [DEVELOPER-ONBOARDING.md](./DEVELOPER-ONBOARDING.md) - Onboarding guide
- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Quick commands

### Logs

- **Backend logs**: Check terminal output or log files
- **Worker logs**: Cloudflare Dashboard → Workers → Logs
- **Application logs**: Check log files in `logs/` directory
- **System stream**: `/api/system/stream` SSE endpoint

### Monitoring

- **Health check**: `npm run smoke`
- **Performance**: Monitor response times and resource usage
- **Agent status**: `/api/agents` endpoint
- **Metrics**: `/api/metrics` endpoint

### Debugging

```bash
# Enable debug logging
DEBUG=* npm run dev:backend

# Run with Node.js inspector
node --inspect backend/server.js

# Check environment
node -e "console.log(process.env)"

# Test API endpoints
curl http://localhost:3000/api/stack
```

### Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Discord/Slack**: Real-time chat (if available)

---

**Version:** 2.0
**Last Updated:** 2026-06-11
**Purpose:** Comprehensive troubleshooting guide for Aether
