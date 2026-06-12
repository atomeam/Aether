# Deployment Guide

This guide covers the complete deployment process for the Aether project, including automated CI/CD pipelines, manual deployment procedures, and troubleshooting.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Automated Deployment](#automated-deployment)
- [Manual Deployment](#manual-deployment)
- [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Pre-Deployment Checks](#pre-deployment-checks)
- [Post-Deployment Validation](#post-deployment-validation)
- [Troubleshooting](#troubleshooting)

## Overview

Aether uses a multi-platform deployment strategy:

- **Cloudflare Workers**: Backend API and bridge services
- **Vercel**: Frontend application
- **GitHub Actions**: Automated CI/CD pipeline

The deployment process is fully automated via GitHub Actions, with support for:
- Multi-environment deployments (dev, staging, prod)
- Pre-deployment validation (typecheck, lint, test, build)
- Post-deployment health checks
- Automatic rollback on failure

## Prerequisites

### Required Accounts

1. **Cloudflare** - For Workers deployment
   - Account ID
   - API Token with Workers permissions
   - Custom domain (optional)

2. **Vercel** - For frontend deployment
   - Account
   - Project ID
   - Organization ID
   - Authentication token

3. **GitHub** - For CI/CD
   - Repository access
   - Actions permissions
   - Secrets configuration

### Required Secrets

Configure the following secrets in your GitHub repository settings:

#### Cloudflare Secrets
```
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id
```

#### Vercel Secrets
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Application Secrets
```
GEMINI_API_KEY=your_gemini_api_key
```

### Local Setup

```bash
# Clone the repository
git clone https://github.com/your-org/aether.git
cd aether

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Verify setup
npm run typecheck
npm run test
npm run build
```

## Environment Setup

### Environments

Aether supports three environments:

| Environment | Branch | Purpose | URL |
|-------------|--------|---------|-----|
| dev | develop | Development testing | `dev.aether.a-to-mind.com` |
| staging | staging | Pre-production validation | `staging.aether.a-to-mind.com` |
| prod | main | Production | `aether.a-to-mind.com` |

### Environment-Specific Configuration

Each environment has its own configuration in `wrangler.toml`:

```toml
[env.production]
vars = { ENVIRONMENT = "production" }

[env.staging]
vars = { ENVIRONMENT = "staging" }

[env.development]
vars = { ENVIRONMENT = "development" }
```

## Automated Deployment

### GitHub Actions Workflow

The deployment workflow (`.github/workflows/deploy.yml`) automatically triggers on:

- Push to `main`, `staging`, or `develop` branches
- Manual workflow dispatch with environment selection

### Workflow Stages

1. **Setup Environment**
   - Determines target environment based on branch or input
   - Sets deployment flags

2. **Pre-Deployment Checks**
   - Type checking
   - Linting
   - Testing (can be skipped for emergency deployments)
   - Building
   - Artifact upload

3. **Cloudflare Deployment**
   - Deploys Workers to Cloudflare
   - Runs health checks
   - Validates deployment

4. **Vercel Deployment**
   - Deploys frontend to Vercel
   - Runs health checks
   - Validates deployment

5. **Post-Deployment Validation**
   - Smoke tests
   - Integration tests
   - Success/failure notification

6. **Rollback (if needed)**
   - Automatic rollback on production failure
   - Restores previous deployment

### Manual Deployment Trigger

To trigger a manual deployment:

1. Go to GitHub Actions tab
2. Select "Automated Deployment" workflow
3. Click "Run workflow"
4. Select environment (dev/staging/prod)
5. Choose whether to skip tests (not recommended for prod)
6. Click "Run workflow"

## Manual Deployment

### Cloudflare Workers Manual Deployment

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate
wrangler login

# Deploy to production
wrangler deploy --env production

# Deploy to staging
wrangler deploy --env staging

# Deploy to development
wrangler deploy --env development
```

### Vercel Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Authenticate
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## Cloudflare Workers Deployment

### Configuration

The main configuration is in `wrangler.toml`:

```toml
name = "aether"
main = "apps/backend/src/index.ts"
compatibility_date = "2026-05-19"
compatibility_flags = ["nodejs_compat"]

# D1 Databases
[[d1_databases]]
binding = "DB"
database_name = "council-routing-db"
database_id = "your-database-id"

# KV Namespaces
[[kv_namespaces]]
binding = "STATE"
id = "your-kv-id"

# R2 Buckets
[[r2_buckets]]
binding = "_LOGS"
bucket_name = "aether-logs"

# Queues
[[queues.producers]]
binding = "CURATOR_QUEUE"
queue = "curator-jobs"

# Service Bindings
[[services]]
binding = "BRIDGE"
service = "aether-bridge"
```

### Creating Resources

#### D1 Database

```bash
# Create database
wrangler d1 create council-routing-db

# Add to wrangler.toml
# Use the returned database_id
```

#### KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create STATE

# Add to wrangler.toml
# Use the returned id
```

#### R2 Bucket

```bash
# Create R2 bucket
wrangler r2 bucket create aether-logs

# Add to wrangler.toml
```

#### Queue

```bash
# Create queue
wrangler queues create curator-jobs

# Add to wrangler.toml
```

### Deployment Steps

1. **Build the worker**
   ```bash
   npm run build -w @aether/backend
   ```

2. **Deploy to Cloudflare**
   ```bash
   wrangler deploy --env production
   ```

3. **Verify deployment**
   ```bash
   curl https://aether.a-to-mind.com/api/stack
   ```

## Vercel Deployment

### Configuration

Vercel configuration is in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "GEMINI_API_KEY": "@gemini_api_key"
  }
}
```

### Environment Variables

Set environment variables in Vercel dashboard:

1. Go to Project Settings
2. Navigate to Environment Variables
3. Add variables for each environment (Development, Preview, Production)

### Deployment Steps

1. **Build the frontend**
   ```bash
   npm run build -w @aether/frontend
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Verify deployment**
   ```bash
   curl https://aether.vercel.app
   ```

## Pre-Deployment Checks

### Type Checking

```bash
npm run typecheck
```

Ensures all TypeScript code is type-safe.

### Linting

```bash
npm run lint
```

Checks code style and potential issues.

### Testing

```bash
npm run test
```

Runs all unit and integration tests.

### Building

```bash
npm run build
```

Builds all packages and applications.

### Custom Pre-Deployment Checks

You can add custom checks in the deploy-automation package:

```typescript
import { PreDeploymentCheck } from '@aether/deploy-automation';

const customCheck: PreDeploymentCheck = {
  name: 'Custom Validation',
  description: 'Validates custom requirements',
  check: async () => {
    // Your validation logic
    return true;
  },
  required: true
};
```

## Post-Deployment Validation

### Health Checks

Automated health checks run after deployment:

```typescript
import { HealthChecker, AETHER_HEALTH_CHECKS } from '@aether/deploy-automation';

const checker = new HealthChecker(AETHER_HEALTH_CHECKS.backend);
const result = await checker.checkWithRetries();

if (result.healthy) {
  console.log('Deployment is healthy');
} else {
  console.error('Deployment is unhealthy');
}
```

### Smoke Tests

```bash
npm run smoke
```

Runs endpoint smoke tests to verify basic functionality.

### Integration Tests

```bash
npm run test:integration
```

Runs full integration test suite.

### Custom Validations

Add custom post-deployment validations:

```typescript
import { PostDeploymentValidation } from '@aether/deploy-automation';

const customValidation: PostDeploymentValidation = {
  name: 'Custom Validation',
  description: 'Validates custom post-deployment requirements',
  validate: async (result) => {
    // Your validation logic
    return true;
  },
  required: true
};
```

## Troubleshooting

### Common Issues

#### Deployment Fails with "CF_API_TOKEN not set"

**Solution**: Ensure the `CF_API_TOKEN` secret is set in GitHub repository settings.

#### Build Fails with Type Errors

**Solution**: Run `npm run typecheck` locally to identify and fix type errors before pushing.

#### Health Checks Fail After Deployment

**Solution**:
1. Check worker logs in Cloudflare dashboard
2. Verify environment variables are set correctly
3. Check for runtime errors in the code
4. Review deployment logs in GitHub Actions

#### Rollback Fails

**Solution**:
1. Manually rollback using CLI:
   ```bash
   wrangler rollback
   vercel rollback
   ```
2. Check previous deployment exists
3. Verify authentication tokens are valid

### Getting Help

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting
- Review GitHub Actions logs for detailed error messages
- Check Cloudflare Workers logs for runtime errors
- Check Vercel deployment logs for build errors

### Deployment Logs

View deployment logs:

- **GitHub Actions**: Actions tab → Select workflow run
- **Cloudflare**: Dashboard → Workers → Your worker → Logs
- **Vercel**: Dashboard → Your project → Deployments → Select deployment

## Best Practices

1. **Always test in staging first** before deploying to production
2. **Never skip tests** for production deployments unless emergency
3. **Monitor health checks** after deployment
4. **Keep secrets secure** - never commit them to the repository
5. **Review logs** after each deployment
6. **Use feature flags** for gradual rollouts
7. **Have rollback plan** ready before deploying
8. **Document any manual steps** required for deployment

## Next Steps

- Read [ENVIRONMENT.md](./ENVIRONMENT.md) for environment variable details
- Read [ROLLBACK.md](./ROLLBACK.md) for rollback procedures
- Read [MONITORING.md](./MONITORING.md) for monitoring setup
