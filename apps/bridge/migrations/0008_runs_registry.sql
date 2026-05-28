-- Migration: Runs Ledger + Registry Tables
-- Copied from apps/notion-worker/migrations/0001_runs_registry.sql (Option A: bridge owns)
-- Shared D1 schema for coordinated architecture (bridge + notion-worker)
-- Production migrations route through apps/bridge/migrations/;
-- notion-worker keeps a dev-bootstrap copy.

-- Runs table - idempotent on run_id
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

-- Registry table - Automation Center system registry
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
