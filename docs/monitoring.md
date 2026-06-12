# Monitoring & Observability

## Overview

AtoMind implements a comprehensive monitoring stack across all services.

## Health Checks

### Backend Endpoints

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/health` | GET | Overall health status |
| `/api/stack` | GET | Stack component status |
| `/api/agents` | GET | Agent health + metrics |
| `/api/agents/evaluate` | GET | Pattern analysis |

### Bridge Worker

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/health` | GET | Worker health + binding status |
| `/crew/status` | GET | Crew status + binding validation |

### Expected Responses

**Healthy:**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-11T21:00:00Z",
  "version": "0.1.0"
}
```

**Degraded:**
```json
{
  "status": "degraded",
  "timestamp": "2026-06-11T21:00:00Z",
  "reason": "GEMINI_API_KEY not set — AI routes unavailable"
}
```

## Metrics

### Request Metrics

- **Request count** — total requests by endpoint, method, status
- **Request duration** — histogram of response times
- **Error rate** — percentage of 4xx/5xx responses

### Agent Metrics

- **Execution count** — by tool name
- **Success rate** — percentage of successful executions
- **Average duration** — per tool execution time
- **Circuit breaker state** — open/closed/half-open

### Infrastructure Metrics

- **D1 query duration** — database performance
- **KV read/write count** — cache hit rate
- **Worker CPU time** — Cloudflare worker performance
- **Memory usage** — backend process memory

## Alerting

### Alert Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | > 5% for 5 min | Critical |
| Slow responses | p95 > 2s for 5 min | Warning |
| Memory high | > 80% for 5 min | Warning |
| DB connection fail | Any failure | Critical |
| KV write fail | Any failure | Warning |
| Gemini API fail | > 3 consecutive | Critical |
| Webhook delivery fail | > 5 consecutive | Warning |

### Notification Channels

- **Slack** — #ops-runs channel
- **Email** — admin alerts
- **Webhook** — custom endpoints

## Logging

### Structured Logging

All logs follow this format:

```json
{
  "timestamp": "2026-06-11T21:00:00Z",
  "level": "error",
  "service": "backend",
  "traceId": "abc-123",
  "message": "Gemini API timeout",
  "context": {
    "endpoint": "/api/build",
    "duration": 30000
  }
}
```

### Log Levels

- **debug** — verbose diagnostic info
- **info** — normal operation events
- **warn** — unexpected but recoverable
- **error** — failures requiring attention

### Log Retention

- Active logs: 30 days
- Archived logs: 90 days (R2)

## Distributed Tracing

### Trace Context

Every request gets a unique `traceId` that propagates through:
- Backend route handlers
- Agent loop execution
- MCP tool invocations
- External API calls

### Trace Export

Traces are exported to:
- Ledger (execution audit trail)
- R2 (long-term storage)
- Monitoring dashboard (real-time)

## Dashboards

### System Dashboard

- Overall health status
- Request rate and latency
- Error rate trend
- Active agents

### Agent Dashboard

- Agent execution timeline
- Tool usage breakdown
- Success/failure rates
- Circuit breaker status

### Infrastructure Dashboard

- D1 query performance
- KV cache hit rate
- Worker CPU/memory usage
- Queue depth

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | System down | Immediate |
| P1 | Major feature broken | 1 hour |
| P2 | Minor feature broken | 4 hours |
| P3 | Cosmetic issue | Next sprint |

### Runbooks

- High error rate → check logs, rollback if needed
- Slow responses → check D1 queries, add indexes
- Memory pressure → check for leaks, restart
- Gemini failures → check API key, quota