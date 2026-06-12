# Rollback Procedures

This document describes rollback procedures for the Aether project, including automated rollback, manual rollback, and troubleshooting.

## Table of Contents

- [Overview](#overview)
- [Rollback Strategies](#rollback-strategies)
- [Automated Rollback](#automated-rollback)
- [Manual Rollback](#manual-rollback)
- [Cloudflare Workers Rollback](#cloudflare-workers-rollback)
- [Vercel Rollback](#vercel-rollback)
- [Rollback Validation](#rollback-validation)
- [Post-Rollback Steps](#post-rollback-steps)
- [Troubleshooting](#troubleshooting)

## Overview

Rollback is the process of reverting a deployment to a previous version when issues are detected. Aether supports:

- **Automated rollback**: Triggered by CI/CD on deployment failure
- **Manual rollback**: Initiated by operators when needed
- **Health check rollback**: Triggered when health checks fail

### When to Rollback

Rollback should be considered when:

- Critical bugs are discovered immediately after deployment
- Health checks fail repeatedly
- Performance degrades significantly
- Error rates increase beyond thresholds
- Data corruption or integrity issues are detected
- Security vulnerabilities are discovered

### Rollback vs. Hotfix

Consider rollback if:
- Issue is critical and affects all users
- Root cause is unknown
- Fix would take significant time
- Deployment was recent (within last hour)

Consider hotfix if:
- Issue is minor or affects few users
- Root cause is known
- Fix is simple and quick to implement
- Deployment was some time ago

## Rollback Strategies

### Immediate Rollback

Rollback immediately without retries:

- **Use case**: Critical issues requiring immediate action
- **Speed**: Fastest rollback
- **Risk**: May rollback to a version with other issues

### Automatic Rollback

Rollback with automatic retries:

- **Use case**: Temporary issues that may resolve
- **Speed**: Moderate (includes retry delay)
- **Risk**: Delays rollback if issue is persistent

### Manual Rollback

Requires human intervention:

- **Use case**: Complex rollbacks requiring validation
- **Speed**: Slowest (requires manual approval)
- **Risk**: Lowest (human validation)

## Automated Rollback

### GitHub Actions Rollback

The CI/CD pipeline includes automatic rollback for production deployments:

```yaml
# .github/workflows/deploy.yml
rollback:
  name: Rollback on Failure
  runs-on: ubuntu-latest
  needs: [setup, post-deployment]
  if: failure() && needs.setup.outputs.should_deploy == 'true' && needs.setup.outputs.environment == 'prod'
  steps:
    - name: Rollback Cloudflare
      run: |
        git checkout HEAD~1
        npx wrangler deploy --env production

    - name: Rollback Vercel
      run: |
        npx vercel rollback --yes
```

### Rollback Configuration

Configure rollback behavior in the deploy-automation package:

```typescript
import { RollbackManager } from '@aether/deploy-automation';

const rollbackConfig = {
  enabled: true,
  maxRetries: 3,
  timeout: 30000,
  healthCheck: {
    endpoint: 'https://aether.a-to-mind.com/api/stack',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    retries: 3,
    interval: 5000
  },
  rollbackStrategy: 'automatic' // 'immediate' | 'manual' | 'automatic'
};

const rollbackManager = new RollbackManager(rollbackConfig);
```

### Triggering Automated Rollback

Automated rollback triggers when:

1. **Deployment fails**: Any deployment job fails
2. **Health checks fail**: Post-deployment health checks fail
3. **Smoke tests fail**: Integration tests fail
4. **Manual trigger**: Workflow dispatch with rollback flag

## Manual Rollback

### Cloudflare Workers Manual Rollback

#### Using Wrangler CLI

```bash
# Rollback to previous deployment
wrangler rollback

# Rollback to specific version
wrangler rollback --version <version-id>

# Rollback to previous commit
git checkout HEAD~1
wrangler deploy --env production
git checkout main
```

#### Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Deployments
5. Find previous deployment
6. Click "Rollback" button
7. Confirm rollback

#### Using Git

```bash
# View deployment history
git log --oneline -10

# Checkout previous commit
git checkout <commit-sha>

# Deploy
wrangler deploy --env production

# Return to main branch
git checkout main
```

### Vercel Manual Rollback

#### Using Vercel CLI

```bash
# Rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback <deployment-url>

# Promote previous deployment to production
vercel promote <deployment-url> --yes
```

#### Using Vercel Dashboard

1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments
4. Find previous deployment
5. Click "..." menu
6. Select "Promote to Production"
7. Confirm promotion

#### Using Git

```bash
# View deployment history
git log --oneline -10

# Checkout previous commit
git checkout <commit-sha>

# Deploy
vercel --prod

# Return to main branch
git checkout main
```

## Cloudflare Workers Rollback

### Rollback Scenarios

#### Scenario 1: Worker Fails to Start

**Symptoms**:
- Worker returns 500 errors
- Worker logs show startup errors
- Health checks fail

**Rollback Steps**:

```bash
# 1. Check worker logs
wrangler tail

# 2. Identify issue
# Review logs for error messages

# 3. Rollback
wrangler rollback

# 4. Verify
curl https://aether.a-to-mind.com/api/stack
```

#### Scenario 2: Database Migration Failed

**Symptoms**:
- Database errors in logs
- Queries failing
- Data inconsistency

**Rollback Steps**:

```bash
# 1. Rollback database migration
# (Use your database migration tool)

# 2. Rollback worker
wrangler rollback

# 3. Verify database state
# (Check database integrity)

# 4. Verify worker
curl https://aether.a-to-mind.com/api/stack
```

#### Scenario 3: Configuration Error

**Symptoms**:
- Worker fails to load configuration
- Environment variable errors
- Binding errors

**Rollback Steps**:

```bash
# 1. Check wrangler.toml
cat wrangler.toml

# 2. Verify environment variables
wrangler secret list

# 3. Rollback to previous configuration
git checkout HEAD~1 wrangler.toml
wrangler deploy --env production
git checkout main wrangler.toml
```

### Rollback Validation

After Cloudflare rollback:

```bash
# 1. Check worker status
curl https://aether.a-to-mind.com/api/stack

# 2. Check worker logs
wrangler tail

# 3. Run health checks
npm run smoke

# 4. Monitor for errors
# (Check Cloudflare analytics)
```

## Vercel Rollback

### Rollback Scenarios

#### Scenario 1: Build Error

**Symptoms**:
- Build fails in Vercel
- Compilation errors
- Dependency issues

**Rollback Steps**:

```bash
# 1. Check build logs
# (View in Vercel dashboard)

# 2. Identify issue
# Review build error messages

# 3. Rollback
vercel rollback

# 4. Verify
curl https://aether.vercel.app
```

#### Scenario 2: Runtime Error

**Symptoms**:
- Application crashes
- JavaScript errors in browser
- API calls failing

**Rollback Steps**:

```bash
# 1. Check runtime logs
# (View in Vercel dashboard)

# 2. Identify issue
# Review error messages

# 3. Rollback
vercel rollback

# 4. Verify
curl https://aether.vercel.app
```

#### Scenario 3: Environment Variable Error

**Symptoms**:
- Application fails to load config
- Missing environment variables
- Incorrect variable values

**Rollback Steps**:

```bash
# 1. Check environment variables
vercel env ls

# 2. Verify correct values
# (Compare with previous deployment)

# 3. Rollback if needed
vercel rollback

# 4. Or fix variables
vercel env add VARIABLE_NAME production
```

### Rollback Validation

After Vercel rollback:

```bash
# 1. Check application status
curl https://aether.vercel.app

# 2. Check build logs
# (View in Vercel dashboard)

# 3. Run health checks
npm run smoke

# 4. Monitor for errors
# (Check Vercel analytics)
```

## Rollback Validation

### Health Check Validation

Use the deploy-automation package to validate rollback:

```typescript
import { HealthChecker, AETHER_HEALTH_CHECKS } from '@aether/deploy-automation';

async function validateRollback() {
  const results = await Promise.all([
    new HealthChecker(AETHER_HEALTH_CHECKS.backend).checkWithRetries(),
    new HealthChecker(AETHER_HEALTH_CHECKS.frontend).checkWithRetries(),
    new HealthChecker(AETHER_HEALTH_CHECKS.bridge).checkWithRetries()
  ]);

  const allHealthy = results.every(r => r.healthy);

  if (allHealthy) {
    console.log('Rollback validation passed');
  } else {
    console.error('Rollback validation failed');
    // Alert team
  }
}

validateRollback();
```

### Smoke Test Validation

Run smoke tests after rollback:

```bash
npm run smoke
```

### Integration Test Validation

Run full integration test suite:

```bash
npm run test:integration
```

### Manual Validation

Perform manual checks:

1. **Backend**: Check API endpoints respond correctly
2. **Frontend**: Verify UI loads and functions
3. **Bridge**: Check worker communication
4. **Database**: Verify data integrity
5. **Logs**: Check for errors in logs

## Post-Rollback Steps

### 1. Document the Rollback

Create a rollback incident report:

```markdown
# Rollback Incident Report

## Date/Time
2026-06-11 22:00 UTC

## Deployment
- Version: 1.2.3
- Commit: abc123
- Environment: production

## Issue
[Description of the issue that caused rollback]

## Rollback
- Rolled back to: version 1.2.2
- Rollback method: automated
- Rollback time: 22:05 UTC

## Validation
- Health checks: passed
- Smoke tests: passed
- Manual validation: passed

## Next Steps
- Investigate root cause
- Fix issue
- Test fix in staging
- Redeploy to production
```

### 2. Investigate Root Cause

Analyze why the deployment failed:

- Review deployment logs
- Check error messages
- Analyze metrics
- Review code changes
- Check configuration changes

### 3. Fix the Issue

Implement a fix for the root cause:

- Create fix branch
- Implement fix
- Test locally
- Test in staging
- Create pull request
- Code review
- Merge to main

### 4. Redeploy

After fix is validated:

- Deploy to staging
- Run full test suite
- Monitor for issues
- Deploy to production
- Monitor closely

### 5. Update Documentation

Update relevant documentation:

- Update [DEPLOYMENT.md](./DEPLOYMENT.md) if procedure needs improvement
- Update [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) with new issue
- Update runbooks if needed

## Troubleshooting

### Rollback Fails

**Problem**: Rollback command fails

**Solutions**:

1. **Check authentication**
   ```bash
   # Cloudflare
   wrangler whoami

   # Vercel
   vercel whoami
   ```

2. **Check network connectivity**
   ```bash
   # Test connection
   curl https://api.cloudflare.com
   curl https://vercel.com
   ```

3. **Check permissions**
   - Verify API token has necessary permissions
   - Verify user has deployment permissions

4. **Try manual rollback**
   - Use dashboard instead of CLI
   - Use git checkout method

### Rollback to Wrong Version

**Problem**: Rolled back to incorrect version

**Solutions**:

1. **Identify correct version**
   ```bash
   # View deployment history
   git log --oneline -10

   # View Cloudflare deployments
   wrangler deployments list

   # View Vercel deployments
   vercel list
   ```

2. **Rollback to correct version**
   ```bash
   # Cloudflare
   git checkout <correct-commit-sha>
   wrangler deploy --env production
   git checkout main

   # Vercel
   vercel promote <correct-deployment-url> --yes
   ```

### Health Checks Fail After Rollback

**Problem**: Previous version also has issues

**Solutions**:

1. **Check rollback target**
   - Verify previous version was healthy
   - Check previous deployment logs

2. **Rollback further back**
   ```bash
   # Rollback to earlier version
   git checkout HEAD~2
   wrangler deploy --env production
   git checkout main
   ```

3. **Investigate both versions**
   - Compare code changes
   - Identify common issues
   - Check infrastructure changes

### Rollback Causes Data Loss

**Problem**: Rollback results in data loss or inconsistency

**Solutions**:

1. **Stop rollback immediately**
   - Halt any in-progress rollbacks
   - Assess data state

2. **Restore from backup**
   - Restore database from backup
   - Restore any lost data

3. **Investigate data loss**
   - Identify what was lost
   - Determine if data can be recovered
   - Document the incident

4. **Prevent future occurrences**
   - Review rollback procedures
   - Add data validation before rollback
   - Improve backup procedures

## Best Practices

1. **Test rollback procedures regularly**
   - Practice rollback in staging
   - Document any issues found
   - Update procedures as needed

2. **Keep deployment history**
   - Maintain git history
   - Keep deployment logs
   - Document each deployment

3. **Monitor after rollback**
   - Watch metrics closely
   - Check logs for errors
   - Run health checks frequently

4. **Communicate with team**
   - Notify team of rollback
   - Share incident report
   - Discuss root cause

5. **Learn from incidents**
   - Conduct post-mortem
   - Identify improvements
   - Update procedures

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment procedures
- Read [ENVIRONMENT.md](./ENVIRONMENT.md) for environment variable details
- Read [MONITORING.md](./MONITORING.md) for monitoring setup
