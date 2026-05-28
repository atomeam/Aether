-- Migration: tasks + audit_events tables
-- Atomic audit events for /tasks mutations

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  correlation_id TEXT,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  source TEXT NOT NULL DEFAULT 'api',
  ok INTEGER NOT NULL DEFAULT 1,
  error_code TEXT,
  error_message TEXT,
  input_json TEXT,
  output_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);