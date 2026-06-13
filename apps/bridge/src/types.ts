// Extended env types for bridge
// Extends @aether/env with bridge-specific bindings

// Cloudflare bindings - using unknown for external types
export interface BridgeBindings {
  DB: D1Database;
  BRIDGE_DB: D1Database;
  STATE: KVNamespace;
  STATE_CACHE: KVNamespace;
  METRICS: KVNamespace;
  _LOGS: R2Bucket;
  MYBROWSER: unknown; // Browser from @cloudflare/workers-types
  CURATOR_QUEUE: Queue;
  DISPATCHER: Fetcher;
  AETHER: Fetcher;
}

// Kraken-specific env extension
export interface KrakenBridgeEnv extends Record<string, unknown> {
  KRAKEN_API_KEY?: string;
  KRAKEN_API_SECRET?: string;
  DB: D1Database;
  STATE: KVNamespace;
  STRIPE_API_KEY?: string;
}