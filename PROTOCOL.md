# Aether Runtime Protocol v0.1

> **Status:** Draft
> **Date:** 2026-05-21
> **Authors:** Aether Architecture Team

This document defines the contracts, event envelopes, and operational invariants for the Aether distributed workspace.

---

## 1. Topology

| Worker | Responsibility | Domain |
|--------|-------------|--------|
| `aether` | Orchestration / Control Plane | `aether.atomeam.com` |
| `aether-bridge` | Execution / Runtime | `bridge.atomeam.com` |
| `homebase` | Observability / Operator UI | `homebase.atomeam.com` |

---

## 2. Event Envelope

All events in the system MUST conform to this schema:

```ts
export interface AetherEvent<T = unknown> {
  // Identity
  id: string          // UUID, globally unique
  ts: string        // ISO 8601 timestamp
  
  // Distributed Tracing
  trace_id: string   // Correlates entire workflow
  session_id?: string
  
  // Provenance
  source: "aether" | "aether-bridge" | "homebase"
  version: string   // Protocol version, e.g. "2026-05-21"
  
  // Causation Graph
  causation_id?: string   // What triggered this event
  correlation_id?: string // Larger workflow this belongs to
  
  // Payload
  type: string      // Event type, e.g. "JOB_DISPATCHED"
  payload: T      // Type-specific data
}
```

### Versioning

Event schema versions use **date-based versioning** (`YYYY-MM-DD`) for simplicity:

```ts
version: "2026-05-21"
```

Semver is NOT used — events should be backward-compatible within a version.

---

## 3. Queue Contracts

### Queue: `curator-jobs`

**Producer:** `aether`  
**Consumer:** `aether-bridge`

```ts
interface CuratorJob {
  id: string
  event_id: string
  eventType: string     // e.g. "BUILD_REQUEST", "EVALUATE"
  pageId: string
  databaseId?: string
  sessionId?: string
  trace_id: string
  payload: unknown
  receivedAt: string
}
```

### Retry Policy

| Parameter | Value |
|-----------|-------|
| Max Retries | 3 |
| Backoff | Exponential, 60s → 120s → 240s |
| Dead Letter | Events with `retry_count >= 3` moved to DLQ |

### Poison Queue Behavior

Jobs that fail 3 times are:
1. Marked with `dead_letter: true`
2. Written to `logs/dlq/{date}/{job-id}.json`
3. NOT retried automatically

### Idempotency Strategy

Consumers MUST deduplicate on `event_id`:
- Check KV `processed:{event_id}` BEFORE processing
- Write `processed:{event_id}` AFTER successful completion
- TTL: 7 days

### Ack Timing

- Optimistic processing: ack immediately after validation
- If processing takes >30s, use late ack pattern

---

## 4. R2 Log Strategy

Logs are treated as **immutable append-only artifacts**, NOT debug strings.

### Pathing Convention

```
logs/{type}/{yyyy}/{mm}/{dd}/{trace_id}_{event_id}.json
```

**Examples:**
```
logs/job_dispatched/2026/05/21/abc123_def456.json
logs/execution_complete/2026/05/21/ghi789_jkl012.json
logs/error/2026/05/21/mno345_pqr678.json
```

### Log Types

| Type | Description |
|------|-------------|
| `job_dispatched` | Job enqueued to curator-jobs |
| `job_received` | Job dequeued by bridge |
| `execution_complete` | Job finished successfully |
| `execution_failed` | Job failed |
| `error` | System error |
| `dlq` | Dead letter queue |

### Retention

- **Hot:** 30 days (standard storage)
- **Cold:** 365 days (rare access)
- **Delete:** After 365 days

---

## 5. Internal RPC Boundaries

All internal communication uses narrow, documented routes:

| Route | Method | Description |
|-------|--------|-------------|
| `/internal/dispatch` | POST |调度 curator-jobs |
| `/internal/report` | GET | Execution status |
| `/internal/health` | GET | Worker health |
| `/internal/replay` | POST | Replay from event ID |
| `/internal/status` | GET | Aggregated workspace status |

### Auth Propagation

Internal routes MUST forward `X-Aether-Trace-ID` header.

```http
X-Aether-Trace-ID: {trace_id}
X-Aether-Source: {worker-name}
```

### Rate Limits

| Route | Limit |
|-------|-------|
| `/internal/dispatch` | 100/minute/IP |
| `/internal/replay` | 10/minute/IP |

---

## 6. Trace Propagation

Every request MUST carry a trace context:

```http
X-Aether-Trace-ID: {uuid}
X-Aether-Causation-ID: {parent-event-id}  # optional
```

If not provided, generate new `trace_id` at ingress.

Trace context flows through:
1. Queue message headers
2. Service binding calls
3. R2 metadata
4. All internal RPC headers

---

## 7. Storage Summary

| Resource | Worker | Purpose |
|----------|--------|---------|
| D1 `council-routing-db` | aether, bridge | Events table |
| KV `STATE` | aether, bridge, homebase | Long-term state |
| KV `STATE_CACHE` | aether, bridge | Ephemeral cache |
| R2 `aether-logs` | aether, bridge, homebase | Structured logs |
| Queue `curator-jobs` | aether → bridge | Job queue |

---

## 8. Security Boundaries

### Bindings by Worker

| Worker | DB | STATE | KV_CACHE | R2 | Queue | Services |
|--------|----|-------|---|-----|-------|---------|
| aether | ✅ | ✅ | ✅ | ✅ (write) | producer | BRIDGE |
| bridge | ✅ | ✅ | ✅ | ✅ (write) | consumer | AETHER |
| homebase | ❌ | ✅ (ro) | ❌ | ✅ (ro) | ❌ |

### Never Do

- Don't write to R2 from homebase
- Don't consume queues from homebase
- Don't use DB from homebase
- Don't call external services from bridge (only from aether)

---

## 9. Error Codes

Standard error responses:

| Code | Meaning |
|------|--------|
| 400 | Bad request / invalid payload |
| 401 | Missing/invalid auth |
| 403 | Forbidden (scope) |
| 404 | Not found |
| 422 | Validation failed (curator deny) |
| 429 | Rate limited |
| 500 | Internal error |
| 503 | Temporary unavailable |

Error response format:

```ts
interface ErrorResponse {
  error: string
  code: string      // e.g. "RATE_LIMITED"
  trace_id?: string
  details?: unknown
}
```

---

## 10. Health Checks

| Endpoint | Worker | Returns |
|----------|--------|--------|
| `/health` | All | `{ ok, service, version, bindings, bindingsMissing }` |
| `/crew/status` | aether, bridge | `{ ok, proposals, lessons, proposals:count }` |
| `/internal/health` | All | `{ ok, dependencies: { DB, KV, R2, Queue } }` |

---

## Appendix: Example Flows

### Flow 1: Job Dispatch

```
1. External → aether POST /api/build
2. aether validates, creates AetherEvent with trace_id
3. aether writes job to curator-queue
4. aether writes to logs/job_dispatched/...
5. Queue → bridge (async)
6. bridge processes, ACKs
7. bridge writes logs/execution_complete/...
```

### Flow 2: Error Recovery

```
1. Job fails in bridge (retries 3x)
2. bridge writes to logs/dlq/...
3. Operator reviews DLQ via homebase
4. Operator POST /internal/replay with event_id
5. aether reads original, replays to queue
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-05-21 | Initial draft |