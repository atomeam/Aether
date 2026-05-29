/**
 * KV Key Registry — typed key builders for all KV namespaces.
 *
 * Eliminates magic strings. Every KV key in the system is defined here
 * so you get autocomplete, type safety, and a single place to audit
 * what data lives where.
 */

// ─── STATE namespace keys ────────────────────────────────────────────
export const StateKeys = {
  /** Per-IP usage counters: { requests, ai_calls, d1_queries } */
  usage: (ip: string) => `usage:${ip}` as const,

  /** API key → tier mapping (SHA-256 hash of key) */
  apiKey: (hash: string) => `api_key:${hash}` as const,

  /** Daily rate-limit counter per API key */
  dailyCount: (date: string, keyHash: string) =>
    `daily:${date}:${keyHash}` as const,

  /** Agent heartbeat timestamp */
  agentHeartbeat: (agentId: string) =>
    `agent:heartbeat:${agentId}` as const,

  /** Agent registration metadata */
  agentMeta: (agentId: string) =>
    `agent:meta:${agentId}` as const,
} as const;

// ─── STATE_CACHE namespace keys ──────────────────────────────────────
export const CacheKeys = {
  /** Latest proposals snapshot */
  proposalsSnapshot: 'proposals:snapshot' as const,

  /** Lessons-learned index */
  lessonsIndex: 'lessons:index' as const,

  /** Dedup hash for a specific lesson */
  lessonHash: (hash: string) => `lessons:hash:${hash}` as const,

  /** AI presence roster */
  aiPresence: 'ai:presence' as const,

  /** Crew Room aggregate state (all agents + telemetry) */
  crewSnapshot: 'crew:snapshot' as const,

  /** Per-agent crew room state */
  crewAgent: (agentId: string) =>
    `crew:agent:${agentId}` as const,
} as const;

// ─── METRICS namespace keys ──────────────────────────────────────────
export const MetricsKeys = {
  /** Per-worker KV op counters — flushed by scheduled() handler */
  kvOps: (worker: string, date: string) =>
    `kv:ops:${worker}:${date}` as const,

  /** Per-worker request counters */
  requests: (worker: string, date: string) =>
    `requests:${worker}:${date}` as const,

  /** Per-worker error counters */
  errors: (worker: string, date: string) =>
    `errors:${worker}:${date}` as const,

  /** Daily aggregate (all workers) */
  dailyAggregate: (date: string) =>
    `aggregate:${date}` as const,
} as const;

// ─── Type helpers ────────────────────────────────────────────────────
export type StateKey = ReturnType<(typeof StateKeys)[keyof typeof StateKeys]>;
export type CacheKey = ReturnType<(typeof CacheKeys)[keyof typeof CacheKeys]> | typeof CacheKeys[keyof typeof CacheKeys];
export type MetricsKey = ReturnType<(typeof MetricsKeys)[keyof typeof MetricsKeys]>;
