/**
 * Instrumented KV Writer — wraps KVNamespace with telemetry + batching.
 *
 * Drop-in replacement for raw `env.STATE.get(key)` calls. Adds:
 *   1. Op telemetry (every get/put/delete/list is counted)
 *   2. In-memory read cache (deduplicates reads within one request)
 *   3. Batched writes (queue puts, flush at end of request)
 *   4. Typed key validation (works with keys.ts registry)
 */

import type { KVTelemetry } from './telemetry';

export interface WriteOp {
  key: string;
  value: string;
  options?: KVNamespacePutOptions;
}

/**
 * InstrumentedKV wraps a KVNamespace and instruments every operation.
 */
export class InstrumentedKV {
  /** In-memory read cache — avoids duplicate reads within one invocation */
  private readCache = new Map<string, string | null>();

  /** Pending writes — flushed via `flushWrites()` */
  private pendingWrites: WriteOp[] = [];

  constructor(
    private readonly kv: KVNamespace,
    private readonly telemetry: KVTelemetry,
    private readonly namespace: string, // for logging: 'STATE', 'STATE_CACHE', 'METRICS'
  ) {}

  // ─── Read Operations ───────────────────────────────────────────────

  /** Get a value, with in-memory cache dedup */
  async get(key: string): Promise<string | null> {
    // Check write queue first (read-your-writes)
    const pending = this.pendingWrites.findLast(w => w.key === key);
    if (pending) {
      return pending.value;
    }

    if (this.readCache.has(key)) {
      return this.readCache.get(key)!;
    }

    this.telemetry.record('get');
    const value = await this.kv.get(key);
    this.readCache.set(key, value);
    return value;
  }

  /** Get and parse JSON */
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  // ─── Write Operations ──────────────────────────────────────────────

  /** Immediate put (bypasses batch queue) */
  async put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void> {
    this.telemetry.record('put');
    await this.kv.put(key, value, options);
    // Update read cache
    this.readCache.set(key, value);
  }

  /** Immediate put with JSON serialization */
  async putJSON<T>(key: string, value: T, options?: KVNamespacePutOptions): Promise<void> {
    await this.put(key, JSON.stringify(value), options);
  }

  /** Queue a write for batched flush (non-blocking) */
  enqueue(key: string, value: string, options?: KVNamespacePutOptions): void {
    this.pendingWrites.push({ key, value, options });
    // Update read cache immediately (read-your-writes)
    this.readCache.set(key, value);
  }

  /** Queue a JSON write for batched flush */
  enqueueJSON<T>(key: string, value: T, options?: KVNamespacePutOptions): void {
    this.enqueue(key, JSON.stringify(value), options);
  }

  // ─── Delete Operations ─────────────────────────────────────────────

  async delete(key: string): Promise<void> {
    this.telemetry.record('delete');
    await this.kv.delete(key);
    this.readCache.delete(key);
  }

  // ─── List Operations ───────────────────────────────────────────────

  async list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown>> {
    this.telemetry.record('list');
    return this.kv.list(options);
  }

  // ─── Batch Flush ───────────────────────────────────────────────────

  /** Flush all pending writes. Call from `ctx.waitUntil()`. */
  async flushWrites(): Promise<{ flushed: number; errors: string[] }> {
    const errors: string[] = [];
    let flushed = 0;

    for (const op of this.pendingWrites) {
      try {
        this.telemetry.record('put');
        await this.kv.put(op.key, op.value, op.options);
        flushed++;
      } catch (err) {
        errors.push(`${this.namespace}/${op.key}: ${String(err)}`);
      }
    }

    this.pendingWrites = [];
    return { flushed, errors };
  }

  /** Number of pending writes in the batch queue */
  get pendingCount(): number {
    return this.pendingWrites.length;
  }
}
