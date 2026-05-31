# Observability Strategy

**Status:** ACTIVE — CF Workers Observability  
**Last Updated:** 2026-05-29  
**Datadog:** DEFERRED — see §5 for migration triggers

---

## §1 What CF Workers Observability Provides

Cloudflare Workers Observability (enabled via `[observability] enabled = true` in `wrangler.toml`) gives us:

| Feature | Details |
|---------|---------|
| **Built-in logs** | `console.log()`, `worker.trace()`, exceptions auto-captured |
| **Request logs** | Method, URL, status, duration, headers |
| **Tail sampling** | Configurable head sampling rate (0-100%) |
| **Error tracking** | Uncaught exceptions, rejected promises |
| **Real-time Tail Workers** | Process/log every request with custom logic |
| **Metrics** | Requests/min, error rate, CPU time, memory |
| **Free tier** | 100% of logs on Workers with paid plan |

**Limits:**
- Log retention: 7 days on free tier
- No native SLO alerting (needs external hook)
- Per-Worker granularity, not cross-account aggregation by default

---

## §2 Recommended `wrangler.toml` Observability Config

### For all Workers (baseline)

```toml
[observability]
enabled = true
logpush = true
```

### High-traffic Workers (reduce sampling to save costs)

```toml
[observability]
enabled = true
logpush = true
# Override tail sampling via environment
```

### Critical Workers (100% tail sampling)

```toml
[observability]
enabled = true
logtail = true  # Enable real-time tail
```

### Per-Worker Configuration

| Worker | Profile | Config |
|--------|---------|--------|
| `aether-bridge` | Critical | `logtail = true`, all errors |
| `notion-worker` | Critical | `logtail = true`, all errors |
| `billing-worker` | Critical | `logtail = true`, all errors |
| `aether` | High | Head sampling 50% |
| `homebase` | Low | Head sampling 10% |
| `alpha-orchestrator` | Critical | `logtail = true`, all errors |
| All others | Medium | Head sampling 25% |

### Error Log Retention Enhancement

```toml
[observability]
enabled = true

# Override sampling for errors (capture 100% of error logs regardless of sampling rate)
log_errors = true
```

---

## §3 Tail Worker Pattern for Slack Alerts

### Architecture

```
Worker (error) → Tail Worker → Cloudflare Logs → Slack #ops-alerts
```

### Skeleton: `tail-alerts-worker/index.ts`

```typescript
export default {
  async tail(events, env, ctx) {
    for (const event of events) {
      // Only forward error-level events
      if (event.event.error || event.event.status >= 500) {
        const payload = JSON.stringify({
          worker: event.event.request?.url?.includes('workers.dev') 
            ? extractWorkerName(event.event.request.url) 
            : 'unknown',
          status: event.event.status,
          error: event.event.error?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
          requestId: event.event.request?.headers?.get('CF-Ray') || 'N/A'
        });

        // POST to Slack webhook (wired post-NS-swap)
        await fetch(env.SLACK_ALERTS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Worker Error Alert`,
            blocks: [{
              type: 'section',
              text: { type: 'mrkdwn', text: `\`${payload.worker}\` returned ${payload.status}\n\`${payload.error}\`` }
            }]
          })
        });
      }
    }
  }
};
```

### wrangler.toml binding

```toml
# tail-alerts-worker/wrangler.toml
main = "src/index.ts"

[[tail_workers]]
binding = "CRITICAL_WORKERS"
workers = [
  "aether-bridge",
  "notion-worker", 
  "billing-worker",
  "alpha-orchestrator"
]

[observability]
enabled = true
logtail = true
```

**Status:** 🟡 SKELETON — wire Slack webhook URL post-NS-swap when `bridge.atomind.io` resolves.

---

## §4 Monitoring Dashboard

### CF Dashboard Links (for operator)

| View | URL |
|------|-----|
| Workers Overview | `https://dash.cloudflare.com/{account}/workers-and-pages` |
| Tail Workers | `https://dash.cloudflare.com/{account}/workers/tail` |
| Logs | `https://dash.cloudflare.com/{account}/logs` |
| Analytics | `https://dash.cloudflare.com/{account}/analytics/workers` |

### Key Metrics to Watch

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 1% | Investigate via logs |
| P99 latency | > 5000ms | Review Worker CPU/memory |
| 5xx count | > 10/hour | Immediate alert to Slack |
| Queue depth | > 100 | Scale consumer or investigate |

### Recommended Alerts (via Tail Worker → Slack)

```typescript
const ALERT_THRESHOLDS = {
  errorRatePercent: 1,        // Alert if > 1% errors
  p99LatencyMs: 5000,         // Alert if > 5s P99
  criticalErrorsPerHour: 10,   // Alert if > 10 critical/hour
  queueDepth: 100             // Alert if queue > 100 messages
};
```

---

## §5 Datadog Migration Plan (DEFERRED)

### When to Trigger Migration

Datadog integration will be considered when **any** of these conditions are met:

| Trigger | Rationale |
|---------|-----------|
| **Non-CF services need correlation** | Stripe webhooks, external APIs, on-prem that can't emit to CF |
| **SLO tracking required** | Paid alerting, on-call routing, PagerDuty integration |
| **Log retention > 7 days** | CF free tier caps at 7 days; Datadog offers 90d+ |
| **Loxa customer shared dashboards** | Multi-tenant monitoring requiring customer-facing views |
| **Cross-cloud cost analysis** | Combine CF + GCP + AWS in single billing view |

### Deferred Implementation Plan

```markdown
## Datadog Integration (DEFERRED)

### Prerequisites
- [ ] `DD_API_KEY` from Datadog account
- [ ] `DD_APP_KEY` with APM permissions
- [ ] `DD_SITE` (e.g., `datadoghq.com`)
- [ ] GitHub secret `DD_API_KEY`, `DD_APP_KEY` in repo

### Integration Points
- [ ] Worker logs → Datadog via `ddtrace` or HTTP export
- [ ] Error tracking → Datadog Errors dashboard
- [ ] Custom metrics → Datadog Metrics API
- [ ] Alert routing → Datadog Monitors → PagerDuty

### Cost Estimate
- Datadog Pro: $15/host/month minimum
- Workers: bill by log volume, not hosts
- Estimated: $0 for Workers (log-based), $15-30/month for APM if used
```

### Current Decision

**Datadog is NOT active.** The crew uses CF Workers Observability because:
- ✅ Already enabled (`[observability] enabled = true`)
- ✅ Free for Workers
- ✅ Native to all 13 Workers
- ✅ No additional credentials needed
- ✅ No integration surface to maintain

**Datadog remains an option.** When triggers above are met, uncomment and execute the deferred plan.

---

## §6 Revision Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-29 | Initial draft | OpenHands |
| — | — | — |

---

## Todo

- [ ] Wire Slack webhook URL in tail-alerts-worker (post-NS-swap)
- [ ] Apply per-Worker sampling configs to wrangler.toml
- [ ] Configure Tail Worker for critical Workers
- [ ] Verify log retention in CF dashboard
- [ ] Test Slack alert delivery