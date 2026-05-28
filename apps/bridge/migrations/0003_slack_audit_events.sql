-- Migration: Slack Ops Automation - slack_audit_events table
-- Stores RUN data for Slack completion detector
-- Uses separate table to avoid conflict with existing audit_events schema

CREATE TABLE IF NOT EXISTS slack_audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL UNIQUE,
  task_url TEXT,
  result TEXT NOT NULL,
  type TEXT,
  env TEXT,
  owner TEXT,
  started_at TEXT,
  ended_at TEXT,
  slack_ts TEXT,
  thread_ts TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Index for fast lookups by run_id
CREATE INDEX IF NOT EXISTS idx_slack_audit_events_run_id ON slack_audit_events(run_id);

-- Index for task_url lookups (for Notion correlation)
CREATE INDEX IF NOT EXISTS idx_slack_audit_events_task_url ON slack_audit_events(task_url);

-- Index for result filtering
CREATE INDEX IF NOT EXISTS idx_slack_audit_events_result ON slack_audit_events(result);