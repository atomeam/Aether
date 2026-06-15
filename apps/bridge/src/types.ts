// Extended env types for bridge
// Extends @aether/env with bridge-specific bindings

import type { DurableObjectNamespace } from '@cloudflare/workers-types';

// Unified Telemetry Schema for Multi-Crew Controller
export interface CrewTelemetry {
  agentId: string;
  crew: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  action: 'detect' | 'remediate' | 'broadcast' | 'command';
  payload: any;
}

// Cloudflare bindings - using unknown for external types
export interface BridgeBindings {
  DB: D1Database;
  BRIDGE_DB: D1Database;
  RELIABILITY_TRACING: D1Database;
  STATE: KVNamespace;
  STATE_CACHE: KVNamespace;
  METRICS: KVNamespace;
  RELIABILITY_DLQ: KVNamespace;
  RELIABILITY_METRICS: KVNamespace;
  RELIABILITY_IDEMPOTENCY: KVNamespace;
  _LOGS: R2Bucket;
  MYBROWSER: unknown; // Browser from @cloudflare/workers-types
  CURATOR_QUEUE: Queue;
  DISPATCHER: Fetcher;
  AETHER: Fetcher;
  GITHUB_WEBHOOK_SECRET?: string;
  GITHUB_PAT?: string;
  NOTION_WEBHOOK_SECRET?: string;
  STATE_BROADCASTER: DurableObjectNamespace;
  ANTHROPIC_API_KEY?: string;
}

// Kraken-specific env extension
export interface KrakenBridgeEnv extends Record<string, unknown> {
  KRAKEN_API_KEY?: string;
  KRAKEN_API_SECRET?: string;
  DB: D1Database;
  STATE: KVNamespace;
  STRIPE_API_KEY?: string;
}