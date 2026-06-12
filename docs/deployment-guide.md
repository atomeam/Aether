# Deployment Guide

## Overview

AtoMind deploys across multiple platforms:
- **Cloudflare Workers** — 13 workers (bridge, notion, billing, etc.)
- **Vercel** — Frontend SPA + Express backend API
- **Cloudflare D1** — SQLite databases
- **Cloudflare KV** — Key-value stores
- **Cloudflare R2** — Object storage

## Prerequisites

- Node.js >= 18
- npm >= 9
- Cloudflare account with Workers, D1, KV, R2 enabled
- Vercel account
- Stripe account (for billing)
- Google Cloud account (for Gemini API)

## 1. Cloudflare Workers Deployment

### Bridge Worker

```bash
cd apps/bridge

# Install dependencies
npm install

# Set secrets
npx wrangler secret put STRIPE_API_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# Deploy
npx wrangler deploy
```

### Verify Deployment

```bash
# Health check
curl https://bridge.a-to-mind.com/health

# Crew status
curl https://bridge.a-to-mind.com/crew/status
```

### Other Workers

```bash
# Deploy each worker
cd apps/notion-worker && npx wrangler deploy
cd apps/billing-worker && npx wrangler deploy
cd apps/crew-room && npx wrangler deploy
# ... etc
```

## 2. Vercel Deployment

### Frontend + Backend

```bash
# From project root
cd Aether

# Install dependencies
npm install

# Build
npm run build

# Deploy to Vercel
npx vercel --prod
```

### Environment Variables (Vercel)

Set in Vercel dashboard:

| Variable | Value | Environment |
|----------|-------|-------------|
| `GEMINI_API_KEY` | `AIza...` | Production |
| `ALLOW_DEGRADED` | `1` | Production |
| `NODE_ENV` | `production` | Production |

### Verify Deployment

```bash
# Health check
curl https://a-to-mind.com/api/health

# Stack status
curl https://a-to-mind.com/api/stack
```

## 3. Database Setup (D1)

### Create Databases

```bash
# Council routing database
npx wrangler d1 create council-routing-db

# Bridge database
npx wrangler d1 create aether-bridge-db
```

### Run Migrations

```bash
# Apply schema
npx wrangler d1 execute council-routing-db --file=./migrations/001_initial.sql
npx wrangler d1 execute aether-bridge-db --file=./migrations/001_initial.sql
```

### Verify

```bash
npx wrangler d1 execute council-routing-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

## 4. KV Namespace Setup

### Create Namespaces

```bash
# State storage
npx wrangler kv namespace create STATE

# State cache
npx wrangler kv namespace create STATE_CACHE

# Metrics
npx wrangler kv namespace create METRICS
```

### Update wrangler.toml

Copy the namespace IDs from the output into `wrangler.toml`.

## 5. R2 Bucket Setup

### Create Bucket

```bash
npx wrangler r2 bucket create aether-logs
```

### Verify

```bash
npx wrangler r2 bucket list
```

## 6. Stripe Setup

### Create Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://bridge.a-to-mind.com/api/billing/webhook`
3. Events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy webhook signing secret

### Set Secrets

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### Create Payment Link

1. Go to Stripe Dashboard → Payment Links
2. Create link for Pro tier
3. Add metadata: `tier=pro`
4. Set success URL: `https://a-to-mind.com/welcome?session_id={CHECKOUT_SESSION_ID}`

## 7. Post-Deployment Verification

### Smoke Test

```bash
cd Aether
npm run smoke
```

Expected: 5/5 PASS

### Billing Verification

```bash
npm run verify:billing
```

Expected: 6/6 PASS

### Health Checks

```bash
# Backend
curl https://a-to-mind.com/api/health

# Bridge
curl https://bridge.a-to-mind.com/health

# Stack
curl https://a-to-mind.com/api/stack
```

## 8. Rollback Procedures

### Cloudflare Workers

1. Go to Cloudflare Dashboard → Workers
2. Select worker → Deployments
3. Select previous successful deployment
4. Click Rollback

### Vercel

1. Go to Vercel Dashboard → Project
2. Select Deployments
3. Select previous successful deployment
4. Click Promote to Production

### Database

1. Restore from backup:
   ```bash
   npx wrangler d1 execute council-routing-db --file=./backups/latest.sql
   ```

## 9. Monitoring

### Key Metrics

- Backend health: `https://a-to-mind.com/api/health`
- Agent status: `https://a-to-mind.com/api/agents`
- Bridge health: `https://bridge.a-to-mind.com/health`

### Alert Thresholds

- Error rate: < 5%
- Response time: < 2s (p95)
- Webhook success: > 95%

## 10. Troubleshooting

See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for common issues.