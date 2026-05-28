import { z } from 'zod';

// ============================================================================
// RUN Header Contract
// ============================================================================

export const RUN_HEADER_SCHEMA = z.object({
  RUN: z.string(),
  TASK: z.string(),
  TYPE: z.enum(['COUNCIL', 'HUMAN', 'AUTOMATED', 'SLACK']),
  STARTED: z.string().datetime(),
  OWNER: z.enum(['Council', 'Human']),
  STATUS: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED']),
});

export type RunHeader = z.infer<typeof RUN_HEADER_SCHEMA>;

// ============================================================================
// Runs Ledger Schema
// ============================================================================

export const RUN_ROW_SCHEMA = z.object({
  task_id: z.string(),
  run_id: z.string(),
  type: z.enum(['COUNCIL', 'HUMAN', 'AUTOMATED', 'SLACK']),
  started: z.string().datetime(),
  owner: z.enum(['Council', 'Human']),
  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED']),
  ended: z.string().datetime().optional(),
  result: z.enum(['SUCCESS', 'FAILURE', 'BLOCKED']).optional(),
  error: z.string().optional(),
  metadata: z.record(z.string()).optional(), // JSON object
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type RunRow = z.infer<typeof RUN_ROW_SCHEMA>;

// ============================================================================
// Task Close Payload Schema
// ============================================================================

export const TASK_CLOSE_PAYLOAD_SCHEMA = z.object({
  run_id: z.string(),
  result: z.enum(['SUCCESS', 'FAILURE', 'BLOCKED']),
  artifact_links: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    type: z.enum(['PR', 'ISSUE', 'RUN', 'LOG', 'ARTIFACT']),
  })).optional(),
  error_message: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export type TaskClosePayload = z.infer<typeof TASK_CLOSE_PAYLOAD_SCHEMA>;

// ============================================================================
// Registry Upsert Schema
// ============================================================================

export const REGISTRY_ENTRY_SCHEMA = z.object({
  system_name: z.string(),
  system_type: z.enum(['WORKER', 'AGENT', 'SERVICE', 'EXTERNAL']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DEGRADED']),
  health_endpoint: z.string().url().optional(),
  last_heartbeat: z.string().datetime().optional(),
  metadata: z.record(z.string()).optional(),
});

export type RegistryEntry = z.infer<typeof REGISTRY_ENTRY_SCHEMA>;

// ============================================================================
// D1 Table Schemas (for migration reference)
// ============================================================================

export const RUNS_TABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS runs (
  task_id TEXT NOT NULL,
  run_id TEXT NOT NULL PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('COUNCIL', 'HUMAN', 'AUTOMATED', 'SLACK')),
  started TEXT NOT NULL,
  owner TEXT NOT NULL CHECK(owner IN ('Council', 'Human')),
  status TEXT NOT NULL DEFAULT 'RUNNING' CHECK(status IN ('RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED')),
  ended TEXT,
  result TEXT CHECK(result IN ('SUCCESS', 'FAILURE', 'BLOCKED')),
  error TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_runs_task_id ON runs(task_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started);
`;

export const REGISTRY_TABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS registry (
  system_name TEXT NOT NULL PRIMARY KEY,
  system_type TEXT NOT NULL CHECK(system_type IN ('WORKER', 'AGENT', 'SERVICE', 'EXTERNAL')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'DEGRADED')),
  health_endpoint TEXT,
  last_heartbeat TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_registry_status ON registry(status);
CREATE INDEX IF NOT EXISTS idx_registry_type ON registry(system_type);
`;


