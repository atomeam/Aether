-- Migration: Slack Ops Automation - processed_slack_events table
-- Stores processed Slack event IDs for deduplication

CREATE TABLE IF NOT EXISTS processed_slack_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  processed_at TEXT NOT NULL
);

-- Index for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_processed_slack_events_event_id ON processed_slack_events(event_id);

-- Index for TTL cleanup (processed_at)
CREATE INDEX IF NOT EXISTS idx_processed_slack_events_processed_at ON processed_slack_events(processed_at);