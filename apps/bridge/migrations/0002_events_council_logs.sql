-- Migration: events + council_logs tables
-- Webhook event tracking and council conversation logging

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  kind TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  page_id TEXT,
  database_id TEXT,
  payload TEXT,
  session_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

CREATE TABLE IF NOT EXISTS council_logs (
  session_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_council_logs_session ON council_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_council_logs_timestamp ON council_logs(timestamp);
