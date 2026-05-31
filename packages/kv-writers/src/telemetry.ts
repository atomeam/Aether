/**
 * KV Operation Telemetry — in-memory counters flushed to METRICS KV.
 *
 * Every KV read/write/delete/list is instrumented here. The counters
 * accumulate in memory during a request and are flushed either:
 *   - At the end of each request via `ctx.waitUntil(telemetry.flush())`
 *   - By the scheduled() cron handler for aggregation
 *
 * This fills the empty "KV usage" table on the Cloudflare inventory page.
 */

export type KVOp = 'get' | 'put' | 'delete' | 'list';

export interface KVOpCounters {
  get: number;
  put: number;
  delete: number;
  list: number;
}

export interface TelemetrySnapshot {
  worker: string;
  date: string;
  ops: KVOpCounters;
  totalRequests: number;
  errors: number;
  flushCount: number;
  lastFlushAt: string;
}

/**
 * In-memory telemetry accumulator.
 * One instance per worker. Counters reset on flush.
 */
export class KVTelemetry {
  private ops: KVOpCounters = { get: 0, put: 0, delete: 0, list: 0 };
  private requests = 0;
  private errors = 0;
  private flushCount = 0;

  constructor(
    private readonly workerName: string,
    private readonly metricsKV: KVNamespace | null,
  ) {}

  /** Record a KV operation */
  record(op: KVOp, count = 1): void {
    this.ops[op] += count;
  }

  /** Record a request */
  recordRequest(): void {
    this.requests++;
  }

  /** Record an error */
  recordError(): void {
    this.errors++;
  }

  /** Current counters (non-destructive read) */
  snapshot(): TelemetrySnapshot {
    const date = new Date().toISOString().slice(0, 10);
    return {
      worker: this.workerName,
      date,
      ops: { ...this.ops },
      totalRequests: this.requests,
      errors: this.errors,
      flushCount: this.flushCount,
      lastFlushAt: new Date().toISOString(),
    };
  }

  /**
   * Flush counters to METRICS KV.
   * Merges with existing daily totals so nothing is lost.
   * Safe to call from `ctx.waitUntil()`.
   */
  async flush(): Promise<void> {
    if (!this.metricsKV) return;
    if (this.ops.get + this.ops.put + this.ops.delete + this.ops.list === 0 &&
        this.requests === 0 && this.errors === 0) {
      return; // nothing to flush
    }

    const date = new Date().toISOString().slice(0, 10);
    const key = `kv:ops:${this.workerName}:${date}`;

    try {
      // Read-modify-write (best-effort; no transactions in KV)
      const existing = await this.metricsKV.get(key, 'json') as TelemetrySnapshot | null;

      const merged: TelemetrySnapshot = {
        worker: this.workerName,
        date,
        ops: {
          get: (existing?.ops.get ?? 0) + this.ops.get,
          put: (existing?.ops.put ?? 0) + this.ops.put,
          delete: (existing?.ops.delete ?? 0) + this.ops.delete,
          list: (existing?.ops.list ?? 0) + this.ops.list,
        },
        totalRequests: (existing?.totalRequests ?? 0) + this.requests,
        errors: (existing?.errors ?? 0) + this.errors,
        flushCount: (existing?.flushCount ?? 0) + 1,
        lastFlushAt: new Date().toISOString(),
      };

      await this.metricsKV.put(key, JSON.stringify(merged), {
        // Keep 30 days of metrics
        expirationTtl: 30 * 24 * 60 * 60,
      });

      // Reset local counters
      this.ops = { get: 0, put: 0, delete: 0, list: 0 };
      this.requests = 0;
      this.errors = 0;
      this.flushCount++;
    } catch (err) {
      // Telemetry should never break the request path
      console.error(`[KVTelemetry] flush failed: ${String(err)}`);
    }
  }
}
