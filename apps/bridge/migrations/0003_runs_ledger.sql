-- Migration: Runs Ledger Table
-- Matches Notion field types for ops/run-close integration
-- 14 columns with UNIQUE(run_id) constraint

CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('deploy', 'smoke', 'migration', 'code_change', 'investigation')),
  state TEXT NOT NULL DEFAULT 'running' CHECK(state IN ('running', 'succeeded', 'failed', 'blocked')),
  started TEXT NOT NULL,
  ended TEXT,
  actor TEXT,
  repo TEXT,
  commit_sha TEXT,
  ci_run_url TEXT,
  evidence TEXT,
  required_artifacts_met INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_runs_task_id_started ON runs(task_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_state ON runs(state);
CREATE INDEX IF NOT EXISTS idx_runs_type ON runs(type);
CREATE INDEX IF NOT EXISTS idx_runs_actor ON runs(actor);
