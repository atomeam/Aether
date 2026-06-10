# Aether Deployment Guide

## Overview
This guide covers deploying the Aether monorepo to various platforms including Cloudflare Workers, Vercel, and local development.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
4. [Vercel Deployment](#vercel-deployment)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Node.js 18+
- pnpm (recommended) or npm
- Wrangler CLI (for Cloudflare Workers)
- Vercel CLI (for Vercel deployment)
- Git

### Installation

```bash
# Install Node.js from https://nodejs.org/

# Install pnpm
npm install -g pnpm

# Install Wrangler
npm install -g wrangler

# Install Vercel CLI
npm install -g vercel

# Authenticate Wrangler
wrangler login

# Authenticate Vercel
vercel login
```

---

## Local Development

### Setup

```bash
# Clone repository
git clone https://github.com/atomeam/Aether.git
cd Aether

# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Edit environment files with your values
nano .env
nano apps/backend/.env
nano apps/frontend/.env
```

### Running Services

```bash
# Terminal 1: Backend
cd apps/backend
pnpm dev

# Terminal 2: Frontend
cd apps/frontend
pnpm dev

# Terminal 3: Bridge Worker (local)
cd apps/bridge
wrangler dev
```

### Accessing Services

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Bridge Worker: http://localhost:8787

---

## Cloudflare Workers Deployment

### Deploying Bridge Worker

```bash
cd apps/bridge

# Deploy to production
wrangler deploy

# Deploy to preview environment
wrangler deploy --env preview
```

### Setting Secrets

```bash
cd apps/bridge

# Set secrets
wrangler secret put NOTION_WEBHOOK_SECRET
wrangler secret put NOTION_API_TOKEN
wrangler secret put BRIDGE_NUCLEUS_KEY
wrangler secret put BRIDGE_SERVICE_KEY
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY
```

### Verifying Deployment

```bash
# Check worker status
curl https://bridge.a-to-mind.com/health

# Check bindings
curl https://bridge.a-to-mind.com/crew/status
```

### Deploying Other Workers

```bash
# Deploy aether (dispatcher)
cd apps/aether
wrangler deploy

# Deploy notion-worker
cd apps/notion-worker
wrangler deploy

# Deploy billing-worker
cd apps/billing-worker
wrangler deploy
```

---

## Vercel Deployment

### Deploying Frontend

```bash
cd apps/frontend

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Setting Environment Variables

```bash
# Set environment variables in Vercel dashboard
# Or via CLI:
vercel env add VITE_API_URL
vercel env add VITE_CLERK_PUBLISHABLE_KEY
```

### Deploying Backend

```bash
cd apps/backend

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Setting Backend Secrets

```bash
# Set secrets in Vercel dashboard
# Or via CLI:
vercel env add CLERK_SECRET_KEY
vercel env add GEMINI_API_KEY
```

---

## Environment Variables

### Root .env

```bash
# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WORKSPACE_ID=org_...

# Stripe
STRIPE_API_KEY=sk_test_...

# HubSpot
HUBSPOT_API_KEY=...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Sentry
SENTRY_DSN=...

# Neural Bridge
NEURAL_BRIDGE_URL=http://localhost:8080
VICTUS_RUNTIME_URL=http://localhost:8080

# MCP Server
MCP_SERVER_URL=http://localhost:3100
```

### Backend .env

```bash
# Clerk
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WORKSPACE_ID=org_...

# Gemini
GEMINI_API_KEY=...

# Bridge Auth
BRIDGE_NUCLEUS_KEY=...
BRIDGE_SERVICE_KEY=...

# Notion
NOTION_WEBHOOK_SECRET=...
NOTION_API_TOKEN=...
```

### Frontend .env

```bash
# API
VITE_API_URL=http://localhost:3000

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Integrations
STRIPE_API_KEY=pk_test_...
HUBSPOT_API_KEY=...
SLACK_BOT_TOKEN=xoxb-...
```

---

## CI/CD Deployment

### GitHub Actions

The project includes GitHub Actions workflows for automated deployment:

- `.github/workflows/ci.yml` - CI pipeline
- `.github/workflows/ci-vercel-deploy.yml` - Vercel deployment

### Manual Deployment

```bash
# Deploy all workers
cd apps/bridge && wrangler deploy
cd apps/aether && wrangler deploy
cd apps/notion-worker && wrangler deploy

# Deploy frontend
cd apps/frontend && vercel --prod

# Deploy backend
cd apps/backend && vercel --prod
```

---

## Troubleshooting

### Issue: Wrangler deployment fails

**Error:** `Error: No account id found`

**Solution:**
```bash
wrangler login
# Or set account ID in wrangler.toml
account_id = "your-account-id"
```

### Issue: pnpm install fails

**Error:** `Workspace dependency not found`

**Solution:**
```bash
# Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Issue: Environment variables not loading

**Error:** `process.env.VARIABLE is undefined`

**Solution:**
- Verify .env file exists
- Verify .env is in .gitignore
- Restart server after adding variables
- Check for typos in variable names

### Issue: Worker not responding

**Error:** `502 Bad Gateway`

**Solution:**
```bash
# Check worker logs
wrangler tail

# Check bindings
wrangler secret list

# Redeploy
wrangler deploy
```

### Issue: Vercel deployment fails

**Error:** `Build failed`

**Solution:**
```bash
# Check build logs in Vercel dashboard
# Verify environment variables are set
# Check for missing dependencies
# Test build locally: vercel build
```

---

## Monitoring

### Cloudflare Workers

```bash
# View logs
wrangler tail

# View analytics
# Visit: https://dash.cloudflare.com/{account}/workers/analytics
```

### Vercel

```bash
# View logs
vercel logs

# View analytics
# Visit: https://vercel.com/dashboard
```

---

## Rollback

### Cloudflare Workers

```bash
# Rollback to previous version
wrangler rollback

# Or deploy specific version
wrangler deploy --name aether-bridge@version
```

### Vercel

```bash
# Rollback to previous deployment
vercel rollback

# Or deploy specific commit
vercel --git HEAD~1
```

---

## Best Practices

1. **Always test locally before deploying**
2. **Use environment-specific branches**
3. **Never commit secrets to git**
4. **Use different secrets for different environments**
5. **Monitor deployments after release**
6. **Have rollback plan ready**
7. **Keep documentation up to date**

---

## Next Steps

1. Complete local development setup
2. Test all services locally
3. Deploy to staging environment
4. Test staging environment
5. Deploy to production
6. Monitor production
7. Set up alerts and monitoring

---

## Support

For issues or questions:
- Check documentation in `docs/` directory
- Check GitHub issues
- Contact team via Slack
