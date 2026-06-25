# Monitoring Setup

This document describes the monitoring setup for the Aether project, including health checks, metrics, logging, and alerting.

## Table of Contents

- [Overview](#overview)
- [Health Checks](#health-checks)
- [Metrics Collection](#metrics-collection)
- [Logging](#logging)
- [Alerting](#alerting)
- [Cloudflare Monitoring](#cloudflare-monitoring)
- [Vercel Monitoring](#vercel-monitoring)
- [Custom Monitoring](#custom-monitoring)
- [Monitoring Best Practices](#monitoring-best-practices)

## Overview

Aether uses a multi-layered monitoring approach:

- **Health Checks**: Automated endpoint monitoring
- **Metrics**: Performance and usage metrics
- **Logging**: Structured logging for debugging
- **Alerting**: Automated notifications for issues

### Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Health Checks | Custom (deploy-automation) | Endpoint availability |
| Metrics | Cloudflare Analytics, Vercel Analytics | Performance metrics |
| Logging | Cloudflare Workers Logpush, Vercel Logs | Debugging and auditing |
| Error Tracking | Sentry (optional) | Error aggregation |
| Uptime Monitoring | UptimeRobot or similar | External monitoring |

## Health Checks

### Automated Health Checks

The deploy-automation package provides automated health checks:

```typescript
import { HealthChecker, AETHER_HEALTH_CHECKS, runAetherHealthChecks } from '@aether/deploy-automation';

// Run all health checks
const results = await runAetherHealthChecks();

console.log('Health check results:', results);
```

### Predefined Health Checks

```typescript
export const AETHER_HEALTH_CHECKS: Record<string, HealthCheckConfig> = {
  backend: {
    endpoint: 'https://aether.a-to-mind.com/api/stack',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    retries: 3,
    interval: 5000
  },
  frontend: {
    endpoint: 'https://aether.a-to-mind.com',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    retries: 3,
    interval: 5000
  },
  bridge: {
    endpoint: 'https://aether-bridge.a-to-mind.com/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    retries: 3,
    interval: 5000
  }
};
```

### Running Health Checks

#### Manual Health Check

```bash
# Check backend
curl https://aether.a-to-mind.com/api/stack

# Check frontend
curl https://aether.a-to-mind.com

# Check bridge
curl https://aether-bridge.a-to-mind.com/health
```

#### Automated Health Check

```typescript
import { HealthChecker } from '@aether/deploy-automation';

const checker = new HealthChecker({
  endpoint: 'https://aether.a-to-mind.com/api/stack',
  method: 'GET',
  expectedStatus: 200,
  timeout: 10000,
  retries: 3,
  interval: 5000
});

const result = await checker.checkWithRetries();
console.log('Health check result:', result);
```

#### Continuous Health Checks

```typescript
import { HealthChecker } from '@aether/deploy-automation';

const checker = new HealthChecker({
  endpoint: 'https://aether.a-to-mind.com/api/stack',
  method: 'GET',
  expectedStatus: 200,
  timeout: 10000,
  retries: 3,
  interval: 5000
});

// Start continuous checks every 60 seconds
await checker.startContinuousChecks(60000, (result) => {
  if (!result.healthy) {
    console.error('Health check failed:', result.error);
    // Send alert
  }
});
```

### Health Check Endpoints

Implement health check endpoints in your applications:

#### Backend Health Check

```typescript
// apps/backend/src/health.ts
export async function healthCheck(req: Request, env: Env) {
  try {
    // Check database connection
    // Check external services
    // Check configuration

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.VERSION || '1.0.0'
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 });
  }
}
```

#### Frontend Health Check

```typescript
// apps/frontend/src/health.ts
export async function healthCheck() {
  try {
    // Check API connectivity
    const response = await fetch('/api/stack');

    if (response.ok) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        status: 'unhealthy',
        error: 'API unavailable'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}
```

## Metrics Collection

### Cloudflare Metrics

Cloudflare provides built-in metrics:

- **Request count**: Number of requests to workers
- **Response time**: Worker execution time
- **Error rate**: Percentage of failed requests
- **CPU usage**: Worker CPU consumption
- **Memory usage**: Worker memory consumption

**Accessing Metrics**:

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. View Analytics tab

### Vercel Metrics

Vercel provides built-in metrics:

- **Page views**: Number of page views
- **Unique visitors**: Number of unique visitors
- **Build time**: Time to build deployment
- **Edge function latency**: Edge function execution time
- **Bandwidth**: Data transfer usage

**Accessing Metrics**:

1. Go to Vercel Dashboard
2. Select your project
3. View Analytics tab

### Custom Metrics

Implement custom metrics using the deploy-automation package:

```typescript
import { HealthChecker } from '@aether/deploy-automation';

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

class MetricsCollector {
  private metrics: Metric[] = [];

  record(metric: Metric) {
    this.metrics.push(metric);
  }

  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  getStatistics(name: string) {
    const metrics = this.getMetrics(name);
    const values = metrics.map(m => m.value);

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    };
  }
}

// Usage
const collector = new MetricsCollector();
collector.record({
  name: 'response_time',
  value: 123,
  timestamp: new Date(),
  tags: { endpoint: '/api/stack' }
});
```

## Logging

### Cloudflare Workers Logging

Cloudflare Workers provide built-in logging:

```typescript
// In your worker
export default {
  async fetch(request, env, ctx) {
    console.log('Request received:', request.url);
    console.log('Environment:', JSON.stringify(env));

    try {
      // Your logic
      console.log('Request processed successfully');
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
};
```

**Viewing Logs**:

```bash
# Real-time logs
wrangler tail

# Logs for specific worker
wrangler tail --name aether

# Filter logs
wrangler tail --format pretty
```

### Vercel Logging

Vercel provides built-in logging:

```typescript
// In your application
console.log('Application started');
console.log('Processing request:', request.url);
console.error('Error occurred:', error);
```

**Viewing Logs**:

1. Go to Vercel Dashboard
2. Select your project
3. View Logs tab
4. Filter by deployment or time range

### Structured Logging

Implement structured logging for better analysis:

```typescript
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private context: Record<string, unknown> = {};

  constructor(context: Record<string, unknown> = {}) {
    this.context = context;
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...context },
      error
    };

    console.log(JSON.stringify(entry));
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }
}

// Usage
const logger = new Logger({ service: 'backend' });
logger.info('Request received', { url: request.url });
logger.error('Request failed', error, { url: request.url });
```

### Log Aggregation

For production, consider log aggregation:

#### Cloudflare Logpush

```bash
# Enable Logpush in Cloudflare dashboard
# Configure destination (R2, S3, etc.)
# Set up log retention policy
```

#### Vercel Log Drains

```bash
# Configure log drain in Vercel dashboard
# Send logs to external service (Datadog, Loggly, etc.)
```

## Alerting

### Alert Configuration

Set up alerts for critical issues:

#### Cloudflare Alerts

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Monitoring → Alerts
5. Configure alert rules:
   - Error rate > 5%
   - Response time > 5s
   - Request count < expected

#### Vercel Alerts

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Alerts
4. Configure alert rules:
   - Build failures
   - Deployment failures
   - Error rate increases

### Custom Alerting

Implement custom alerting using the deploy-automation package:

```typescript
import { HealthChecker } from '@aether/deploy-automation';

class AlertManager {
  private alerts: string[] = [];

  async checkAndAlert(checker: HealthChecker, serviceName: string) {
    const result = await checker.checkWithRetries();

    if (!result.healthy) {
      const alert = `${serviceName} health check failed: ${result.error}`;
      this.alerts.push(alert);
      await this.sendAlert(alert);
    }
  }

  private async sendAlert(message: string) {
    // Send to Slack
    // Send to email
    // Send to PagerDuty
    console.error('ALERT:', message);
  }

  getAlerts(): string[] {
    return this.alerts;
  }
}

// Usage
const alertManager = new AlertManager();

const backendChecker = new HealthChecker(AETHER_HEALTH_CHECKS.backend);
await alertManager.checkAndAlert(backendChecker, 'Backend');

const frontendChecker = new HealthChecker(AETHER_HEALTH_CHECKS.frontend);
await alertManager.checkAndAlert(frontendChecker, 'Frontend');
```

### Alert Channels

Configure alert channels:

#### Slack Integration

```typescript
async function sendSlackAlert(message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message,
      username: 'Aether Monitor',
      icon_emoji: ':warning:'
    })
  });
}
```

#### Email Integration

```typescript
async function sendEmailAlert(message: string) {
  // Use your email service (SendGrid, AWS SES, etc.)
  console.log('Sending email alert:', message);
}
```

#### PagerDuty Integration

```typescript
async function sendPagerDutyAlert(message: string) {
  const apiKey = process.env.PAGERDUTY_API_KEY;

  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: apiKey,
      event_action: 'trigger',
      payload: {
        summary: message,
        source: 'aether-monitor',
        severity: 'critical'
      }
    })
  });
}
```

## Cloudflare Monitoring

### Real-Time Monitoring

Monitor Cloudflare Workers in real-time:

```bash
# Tail logs
wrangler tail

# Monitor metrics
# View in Cloudflare Dashboard
```

### Analytics Dashboard

Access Cloudflare Analytics:

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. View Analytics tab

**Key Metrics**:
- Requests per minute
- Average response time
- Error rate
- CPU usage
- Memory usage

### Log Retention

Configure log retention:

```bash
# Enable Logpush
wrangler logpush create

# Configure retention
# Set retention period (e.g., 30 days)
```

## Vercel Monitoring

### Real-Time Monitoring

Monitor Vercel deployments in real-time:

```bash
# View deployment logs
vercel logs

# View build logs
# View in Vercel Dashboard
```

### Analytics Dashboard

Access Vercel Analytics:

1. Go to Vercel Dashboard
2. Select your project
3. View Analytics tab

**Key Metrics**:
- Page views
- Unique visitors
- Build time
- Edge function latency
- Bandwidth usage

### Log Drains

Configure log drains:

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Log Drains
4. Add log drain (Datadog, Loggly, etc.)

## Custom Monitoring

### Monitoring Dashboard

Create a custom monitoring dashboard:

```typescript
import { HealthChecker, AETHER_HEALTH_CHECKS } from '@aether/deploy-automation';

async function getMonitoringData() {
  const results = await runAetherHealthChecks();

  return {
    timestamp: new Date(),
    services: {
      backend: results.backend,
      frontend: results.frontend,
      bridge: results.bridge
    },
    overall: Object.values(results).every(r => r.healthy) ? 'healthy' : 'unhealthy'
  };
}

// Expose as API endpoint
export async function monitoringHandler(req: Request) {
  const data = await getMonitoringData();
  return Response.json(data);
}
```

### Monitoring Script

Create a monitoring script:

```typescript
#!/usr/bin/env node

import { HealthChecker, AETHER_HEALTH_CHECKS } from '@aether/deploy-automation';

async function main() {
  console.log('Running health checks...');

  const results = await runAetherHealthChecks();

  for (const [service, result] of Object.entries(results)) {
    const status = result.healthy ? '✓' : '✗';
    console.log(`${status} ${service}: ${result.healthy ? 'OK' : result.error}`);
  }

  const allHealthy = Object.values(results).every(r => r.healthy);
  process.exit(allHealthy ? 0 : 1);
}

main().catch(console.error);
```

## Monitoring Best Practices

### 1. Monitor All Layers

Monitor at every layer:
- Application health
- Database health
- External service health
- Infrastructure health

### 2. Set Appropriate Thresholds

Configure thresholds based on:
- Historical data
- Service level objectives (SLOs)
- User expectations

### 3. Alert on Degradation

Alert before complete failure:
- Warning alerts for degradation
- Critical alerts for failures
- Info alerts for informational events

### 4. Monitor Continuously

Run health checks continuously:
- Every 30 seconds for critical services
- Every minute for important services
- Every 5 minutes for less critical services

### 5. Retain Logs

Keep logs for analysis:
- 7 days for development
- 30 days for staging
- 90 days for production

### 6. Review Metrics Regularly

Review metrics regularly:
- Daily for critical metrics
- Weekly for important metrics
- Monthly for less critical metrics

### 7. Test Alerting

Test alerting regularly:
- Weekly test alerts
- Monthly full alert test
- Quarterly alert review

### 8. Document Incidents

Document all incidents:
- What happened
- When it happened
- How it was resolved
- How to prevent recurrence

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment procedures
- Read [ENVIRONMENT.md](./ENVIRONMENT.md) for environment variable details
- Read [ROLLBACK.md](./ROLLBACK.md) for rollback procedures
