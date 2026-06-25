# Environment Variables

This document describes all environment variables used in the Aether project, their purposes, and how to configure them.

## Table of Contents

- [Overview](#overview)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Environment-Specific Variables](#environment-specific-variables)
- [Cloudflare Variables](#cloudflare-variables)
- [Vercel Variables](#vercel-variables)
- [Application Variables](#application-variables)
- [Security Best Practices](#security-best-practices)
- [Managing Secrets](#managing-secrets)

## Overview

Aether uses environment variables to configure:

- Application behavior (Node environment, log levels)
- API keys and authentication tokens
- Database connections
- Deployment platform credentials
- Feature flags and configuration

Environment variables are managed through:

1. **Local development**: `.env` file
2. **CI/CD**: GitHub Secrets
3. **Cloudflare**: Worker environment variables
4. **Vercel**: Project environment variables

## Required Variables

These variables are required for the application to function:

### Application Variables

| Variable | Description | Example | Secret |
|----------|-------------|---------|--------|
| `NODE_ENV` | Node environment (development, staging, production) | `production` | No |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | `AIzaSy...` | Yes |

### Cloudflare Variables

| Variable | Description | Example | Secret |
|----------|-------------|---------|--------|
| `CF_API_TOKEN` | Cloudflare API token for worker deployment | `abc123...` | Yes |
| `CF_ACCOUNT_ID` | Cloudflare account ID | `abc123def456...` | Yes |

### Vercel Variables

| Variable | Description | Example | Secret |
|----------|-------------|---------|--------|
| `VERCEL_TOKEN` | Vercel authentication token | `abc123...` | Yes |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_abc123...` | Yes |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_abc123...` | Yes |

## Optional Variables

These variables are optional but recommended for production:

| Variable | Description | Example | Default | Secret |
|----------|-------------|---------|---------|--------|
| `DATABASE_URL` | Database connection URL | `postgresql://...` | - | Yes |
| `REDIS_URL` | Redis connection URL | `redis://...` | - | Yes |
| `SENTRY_DSN` | Sentry DSN for error tracking | `https://...@sentry.io/...` | - | Yes |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` | `info` | No |
| `ALLOW_DEGRADED` | Allow degraded mode operation | `1` | `0` | No |

## Environment-Specific Variables

### Development (.env.development)

```bash
NODE_ENV=development
GEMINI_API_KEY=your_dev_gemini_key
LOG_LEVEL=debug
ALLOW_DEGRADED=1
```

### Staging (.env.staging)

```bash
NODE_ENV=staging
GEMINI_API_KEY=your_staging_gemini_key
LOG_LEVEL=info
ALLOW_DEGRADED=0
SENTRY_DSN=your_staging_sentry_dsn
```

### Production (.env.production)

```bash
NODE_ENV=production
GEMINI_API_KEY=your_prod_gemini_key
LOG_LEVEL=warn
ALLOW_DEGRADED=0
SENTRY_DSN=your_prod_sentry_dsn
DATABASE_URL=your_prod_database_url
REDIS_URL=your_prod_redis_url
```

## Cloudflare Variables

### Setting Variables in Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Settings → Variables
5. Add environment variables for each environment

### Setting Variables via Wrangler CLI

```bash
# Add variable for production
wrangler secret put GEMINI_API_KEY --env production

# Add variable for staging
wrangler secret put GEMINI_API_KEY --env staging

# Add variable for development
wrangler secret put GEMINI_API_KEY --env development
```

### Worker Environment Variables

Variables can also be set in `wrangler.toml`:

```toml
[vars]
NODE_ENV = "production"
LOG_LEVEL = "info"
ALLOW_DEGRADED = "0"
```

**Note**: Never put secrets in `wrangler.toml`. Use `wrangler secret put` instead.

## Vercel Variables

### Setting Variables in Vercel Dashboard

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add variables for each environment (Development, Preview, Production)

### Setting Variables via Vercel CLI

```bash
# Add variable for production
vercel env add GEMINI_API_KEY production

# Add variable for preview
vercel env add GEMINI_API_KEY preview

# Add variable for development
vercel env add GEMINI_API_KEY development
```

### Environment-Specific Values

Vercel allows different values for the same variable across environments:

```bash
# Production
GEMINI_API_KEY=prod_key_123

# Preview deployments
GEMINI_API_KEY=preview_key_456

# Development
GEMINI_API_KEY=dev_key_789
```

## Application Variables

### Using Environment Variables in Code

```typescript
import { config } from 'dotenv';

// Load environment variables
config();

// Access variables
const geminiApiKey = process.env.GEMINI_API_KEY;
const nodeEnv = process.env.NODE_ENV;
const logLevel = process.env.LOG_LEVEL || 'info';
```

### Type-Safe Environment Variables

Using the deploy-automation package:

```typescript
import { EnvironmentManager, AETHER_ENV_VARIABLES } from '@aether/deploy-automation';

const envManager = new EnvironmentManager('prod');

// Load predefined variables
AETHER_ENV_VARIABLES.forEach(variable => {
  envManager.add(variable);
});

// Validate all required variables are set
const validation = envManager.validate();
if (!validation.valid) {
  throw new Error(`Missing required variables: ${validation.missing.join(', ')}`);
}

// Export to process.env
envManager.exportToProcess();
```

### Environment Variable Schema

The deploy-automation package provides Zod schemas for validation:

```typescript
import { EnvironmentVariableSchema } from '@aether/deploy-automation';

const envVar = EnvironmentVariableSchema.parse({
  name: 'API_KEY',
  value: 'secret123',
  required: true,
  description: 'API key for external service',
  environment: ['prod'],
  isSecret: true
});
```

## Security Best Practices

### 1. Never Commit Secrets

Never commit `.env` files or secrets to the repository:

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

### 2. Use Environment-Specific Files

Use separate files for different environments:

```bash
.env.development
.env.staging
.env.production
```

### 3. Rotate Secrets Regularly

Rotate API keys and tokens regularly:
- Every 90 days for production
- Every 180 days for staging
- As needed for development

### 4. Use Principle of Least Privilege

Grant minimum required permissions:
- API tokens should have only necessary scopes
- Database users should have limited access
- Service accounts should be role-specific

### 5. Audit Secret Access

Monitor who has access to secrets:
- Review GitHub repository collaborators
- Audit Cloudflare API token usage
- Check Vercel team member access

### 6. Use Secret Scanning

Enable secret scanning:
- GitHub Advanced Security (if available)
- GitGuardian or similar tools
- Pre-commit hooks to detect secrets

## Managing Secrets

### GitHub Secrets

GitHub Actions uses repository secrets for CI/CD:

**Setting Secrets:**

1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add name and value
5. Click "Add secret"

**Using Secrets in Workflows:**

```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

### Cloudflare Secrets

**Setting Secrets via Dashboard:**

1. Go to Workers & Pages
2. Select worker
3. Settings → Variables → Encrypted
4. Add secret

**Setting Secrets via CLI:**

```bash
wrangler secret put SECRET_NAME
```

### Vercel Secrets

**Setting Secrets via Dashboard:**

1. Go to project Settings
2. Environment Variables
3. Add variable and mark as "Encrypted"

**Setting Secrets via CLI:**

```bash
vercel env add SECRET_NAME
```

### Local Development

**Using .env Files:**

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

**Loading in Code:**

```typescript
import { config } from 'dotenv';
config();
```

## Environment Variable Reference

### Complete List

See `packages/deploy-automation/src/env/manager.ts` for the complete list of predefined environment variables:

```typescript
export const AETHER_ENV_VARIABLES: EnvironmentVariable[] = [
  {
    name: 'NODE_ENV',
    value: 'development',
    required: true,
    description: 'Node environment (development, staging, production)',
    environment: ['dev', 'staging', 'prod'],
    isSecret: false
  },
  {
    name: 'GEMINI_API_KEY',
    value: '',
    required: true,
    description: 'Google Gemini API key for AI features',
    environment: ['dev', 'staging', 'prod'],
    isSecret: true
  },
  // ... more variables
];
```

### Adding New Variables

To add a new environment variable:

1. Add to `AETHER_ENV_VARIABLES` in `packages/deploy-automation/src/env/manager.ts`
2. Add to `.env.example`
3. Add to GitHub Secrets for CI/CD
4. Add to Cloudflare/Vercel environment variables
5. Update this documentation

## Troubleshooting

### Variable Not Loading

**Problem**: Environment variable is undefined in code

**Solutions**:
- Ensure `.env` file exists in project root
- Check variable name matches exactly (case-sensitive)
- Verify `dotenv.config()` is called before use
- Check for typos in variable name

### Secret Not Working in CI/CD

**Problem**: Secret not available in GitHub Actions

**Solutions**:
- Verify secret is set in repository settings
- Check secret name matches exactly in workflow
- Ensure workflow has access to secrets
- Check for typos in secret reference

### Cloudflare Worker Fails to Start

**Problem**: Worker fails due to missing environment variable

**Solutions**:
- Verify variable is set in Cloudflare dashboard
- Check variable is set for correct environment
- Use `wrangler secret list` to verify
- Check worker logs for specific error

### Vercel Build Fails

**Problem**: Build fails due to missing environment variable

**Solutions**:
- Verify variable is set in Vercel dashboard
- Check variable is set for correct environment
- Use `vercel env ls` to verify
- Check build logs for specific error

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment procedures
- Read [ROLLBACK.md](./ROLLBACK.md) for rollback procedures
- Read [MONITORING.md](./MONITORING.md) for monitoring setup
