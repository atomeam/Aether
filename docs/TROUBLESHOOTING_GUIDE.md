# Aether Troubleshooting Guide

## Overview
This guide covers common issues and their solutions for the Aether monorepo.

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Development Issues](#development-issues)
3. [Deployment Issues](#deployment-issues)
4. [Authentication Issues](#authentication-issues)
5. [Worker Issues](#worker-issues)
6. [Database Issues](#database-issues)
7. [Performance Issues](#performance-issues)

---

## Installation Issues

### Issue: pnpm install fails with workspace dependency error

**Error:**
```
Error: @aether/chaos not found in npm registry
```

**Solution:**
```bash
# Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# If still fails, try npm instead
npm install
```

### Issue: wrangler login fails

**Error:**
```
Error: Failed to authenticate
```

**Solution:**
```bash
# Clear wrangler cache
rm -rf ~/.wrangler

# Try login again
wrangler login

# Or use API token
wrangler login --token YOUR_TOKEN
```

### Issue: Vercel CLI not found

**Error:**
```
command not found: vercel
```

**Solution:**
```bash
# Install Vercel CLI
npm install -g vercel

# Or use npx
npx vercel
```

---

## Development Issues

### Issue: Backend won't start

**Error:**
```
Error: tsx not recognized
```

**Solution:**
```bash
# Install tsx locally
cd apps/backend
pnpm add -D tsx

# Or use npx
npx tsx server.ts
```

### Issue: Frontend build fails

**Error:**
```
Error: Module not found
```

**Solution:**
```bash
# Clean install
cd apps/frontend
rm -rf node_modules
pnpm install

# Rebuild
pnpm build
```

### Issue: Port already in use

**Error:**
```
Error: EADDRINUSE: address already in use
```

**Solution:**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 PID  # macOS/Linux
taskkill /PID PID /F  # Windows

# Or use different port
PORT=3001 pnpm dev
```

---

## Deployment Issues

### Issue: Wrangler deployment fails

**Error:**
```
Error: No account id found
```

**Solution:**
```bash
# Add account ID to wrangler.toml
account_id = "your-account-id"

# Or login again
wrangler login
```

### Issue: Worker deployment fails with binding error

**Error:**
```
Error: Binding not found
```

**Solution:**
```bash
# Verify bindings in wrangler.toml
# Check if resources exist
wrangler kv namespace list
wrangler d1 list
wrangler queues list

# Create missing resources
wrangler kv namespace create STATE
wrangler d1 create relay-db
```

### Issue: Vercel deployment fails

**Error:**
```
Error: Build failed
```

**Solution:**
```bash
# Check build logs
vercel logs

# Test build locally
vercel build

# Check environment variables
vercel env ls
```

---

## Authentication Issues

### Issue: Clerk authentication not working

**Error:**
```
Error: Clerk API key invalid
```

**Solution:**
```bash
# Verify Clerk keys in .env
# Check Clerk dashboard for correct keys
# Ensure keys are for correct environment (test vs production)

# Regenerate keys if needed
# Visit: https://dashboard.clerk.com
```

### Issue: Auth middleware returns 401

**Error:**
```
401 Unauthorized
```

**Solution:**
```bash
# Verify Authorization header format
# Should be: Authorization: Bearer YOUR_KEY

# Check if key matches expected scope
# Nucleus key for proposals/lessons write
# Service key for AI heartbeat, council log, tasks
```

### Issue: HMAC verification fails

**Error:**
```
Error: Invalid signature
```

**Solution:**
```bash
# Verify NOTION_WEBHOOK_SECRET is set
wrangler secret list

# Check signature format
# Should be: sha256=HEX_SIGNATURE

# Verify signature generation
# Use same secret to sign payload
```

---

## Worker Issues

### Issue: Worker not responding

**Error:**
```
502 Bad Gateway
```

**Solution:**
```bash
# Check worker logs
wrangler tail

# Check if worker is deployed
wrangler deployments list

# Redeploy worker
wrangler deploy

# Check bindings
wrangler secret list
```

### Issue: Worker memory limit exceeded

**Error:**
```
Error: Memory limit exceeded
```

**Solution:**
```bash
# Increase memory limit in wrangler.toml
[build]
command = "npm run build"

# Or optimize code to use less memory
# Use streaming for large responses
# Cache frequently accessed data
```

### Issue: Worker timeout

**Error:**
```
Error: Request timeout
```

**Solution:**
```bash
# Increase timeout in wrangler.toml
[build]
command = "npm run build"

# Or optimize code to be faster
# Use caching
# Reduce computation
```

---

## Database Issues

### Issue: D1 query fails

**Error:**
```
Error: SQL execution failed
```

**Solution:**
```bash
# Check SQL syntax
# Test query in wrangler d1 execute

wrangler d1 execute relay-db --remote --command="SELECT * FROM relay_tasks"

# Check if table exists
wrangler d1 execute relay-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### Issue: KV read fails

**Error:**
```
Error: KV read failed
```

**Solution:**
```bash
# Check if KV namespace exists
wrangler kv namespace list

# Verify binding in wrangler.toml
[[kv_namespaces]]
binding = "STATE"
id = "your-namespace-id"

# Test KV read
wrangler kv:key get --namespace-id=your-namespace-id "test-key"
```

### Issue: Migration fails

**Error:**
```
Error: Migration failed
```

**Solution:**
```bash
# Check migration SQL syntax
# Test migration locally
wrangler d1 migrations apply relay-db --local

# Check if migration already applied
wrangler d1 migrations list relay-db

# Rollback migration if needed
# Manually revert changes
```

---

## Performance Issues

### Issue: Slow worker response time

**Symptom:** Worker takes >5 seconds to respond

**Solution:**
```bash
# Add caching
# Use KV for frequently accessed data
# Use D1 for persistent data

# Optimize queries
# Add indexes to D1 tables
# Use prepared statements

# Use streaming
# Stream large responses instead of buffering
```

### Issue: High memory usage

**Symptom:** Worker uses >128MB memory

**Solution:**
```bash
# Profile memory usage
wrangler tail

# Optimize code
# Reduce object creation
# Use streaming
# Cache less data

# Increase memory limit
# Contact Cloudflare support
```

### Issue: Rate limiting

**Symptom:** Too many requests error

**Solution:**
```bash
# Implement rate limiting
# Use KV for rate limit state
# Return 429 status code

# Add caching
# Reduce redundant requests
```

---

## Debugging Tips

### Enable Debug Logging

```bash
# Set NODE_ENV=development
export NODE_ENV=development

# Enable verbose logging
export DEBUG=*

# Wrangler verbose mode
wrangler tail --format pretty
```

### Check Worker Logs

```bash
# Real-time logs
wrangler tail

# Historical logs
# Visit: https://dash.cloudflare.com/{account}/workers/logs
```

### Test Locally

```bash
# Run worker locally
wrangler dev

# Test with curl
curl http://localhost:8787/health
```

---

## Common Error Messages

### "Module not found"
- Check if package is installed
- Run `pnpm install`
- Check import path

### "Cannot read property of undefined"
- Check if object exists before accessing
- Add null checks
- Use optional chaining

### "Network error"
- Check internet connection
- Check firewall settings
- Check API endpoint URL

### "Timeout"
- Increase timeout
- Optimize code
- Check network latency

---

## Getting Help

### Documentation
- Check `docs/` directory
- Check README files
- Check inline code comments

### Community
- GitHub issues
- Slack channel
- Discord server

### Support
- Email support team
- Create support ticket
- Schedule office hours

---

## Prevention

### Best Practices
1. Test locally before deploying
2. Use environment variables for secrets
3. Monitor logs regularly
4. Set up alerts for errors
5. Keep dependencies updated
6. Use version control
7. Document changes

### Monitoring
- Set up error tracking (Sentry)
- Set up performance monitoring
- Set up uptime monitoring
- Set up log aggregation

---

## Next Steps

1. Identify the issue
2. Check relevant documentation
3. Try common solutions
4. Check logs for errors
5. Test fixes locally
6. Deploy fix to staging
7. Test staging
8. Deploy to production
9. Monitor for issues
