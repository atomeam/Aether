/**
 * @aether/kv-writers — Instrumented KV access layer for Aether Workers.
 *
 * Usage:
 *   import { createKVContext } from '@aether/kv-writers';
 *
 *   const kv = createKVContext(env, 'aether-bridge');
 *   const data = await kv.state.getJSON<MyType>(StateKeys.usage('1.2.3.4'));
 *   kv.cache.enqueueJSON(CacheKeys.crewSnapshot, snapshot);
 *   ctx.waitUntil(kv.flush());
 */

export { StateKeys, CacheKeys, MetricsKeys } from './keys';
export type { StateKey, CacheKey, MetricsKey } from './keys';

export { InstrumentedKV } from './writer';
export type { WriteOp } from './writer';

export { KVTelemetry } from './telemetry';
export type { KVOp, KVOpCounters, TelemetrySnapshot } from './telemetry';

export { CrewManager } from './crew';
export type { AgentStatus, CrewSnapshot } from './crew';

// ─── Factory ─────────────────────────────────────────────────────────

interface KVBindings {
  STATE: KVNamespace;
  STATE_CACHE: KVNamespace;
  METRICS?: KVNamespace;
}

export interface KVContext {
  state: InstrumentedKV;
  cache: InstrumentedKV;
  metrics: InstrumentedKV | null;
  telemetry: KVTelemetry;
  crew: CrewManager;
  /** Flush all pending writes + telemetry. Call from ctx.waitUntil(). */
  flush: () => Promise<void>;
}

import { InstrumentedKV } from './writer';
import { KVTelemetry } from './telemetry';
import { CrewManager } from './crew';

/**
 * Create a full KV context for a worker invocation.
 *
 * @param env - Worker environment bindings
 * @param workerName - Name for telemetry grouping (e.g. 'aether-bridge')
 */
export function createKVContext(env: KVBindings, workerName: string): KVContext {
  const telemetry = new KVTelemetry(workerName, env.METRICS ?? null);

  const state = new InstrumentedKV(env.STATE, telemetry, 'STATE');
  const cache = new InstrumentedKV(env.STATE_CACHE, telemetry, 'STATE_CACHE');
  const metrics = env.METRICS
    ? new InstrumentedKV(env.METRICS, telemetry, 'METRICS')
    : null;

  const crew = new CrewManager(state, cache);

  return {
    state,
    cache,
    metrics,
    telemetry,
    crew,
    async flush() {
      const [stateResult, cacheResult, metricsResult] = await Promise.allSettled([
        state.flushWrites(),
        cache.flushWrites(),
        metrics?.flushWrites(),
      ]);

      // Log any flush errors (but don't throw)
      for (const r of [stateResult, cacheResult, metricsResult]) {
        if (r?.status === 'fulfilled' && r.value?.errors?.length) {
          console.error(`[kv-writers] flush errors:`, r.value.errors);
        }
      }

      // Flush telemetry counters to METRICS KV
      await telemetry.flush();
    },
  };
}
