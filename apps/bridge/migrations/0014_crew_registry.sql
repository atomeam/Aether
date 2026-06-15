-- Multi-Crew Controller Schema
-- Creates the registry and event history tables for unified agent management

-- Crew Registry: Track agent status and heartbeats
CREATE TABLE IF NOT EXISTS crew_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL UNIQUE,
  crew TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle', -- idle, running, paused, error, stopped
  last_heartbeat TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Crew Events: Unified telemetry event history
CREATE TABLE IF NOT EXISTS crew_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  crew TEXT NOT NULL,
  level TEXT NOT NULL, -- info, warn, error, critical
  action TEXT NOT NULL, -- detect, remediate, broadcast, command
  payload TEXT NOT NULL, -- JSON payload
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_crew_registry_agent_id ON crew_registry(agent_id);
CREATE INDEX IF NOT EXISTS idx_crew_registry_crew ON crew_registry(crew);
CREATE INDEX IF NOT EXISTS idx_crew_registry_status ON crew_registry(status);
CREATE INDEX IF NOT EXISTS idx_crew_events_agent_id ON crew_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_crew_events_crew ON crew_events(crew);
CREATE INDEX IF NOT EXISTS idx_crew_events_level ON crew_events(level);
CREATE INDEX IF NOT EXISTS idx_crew_events_timestamp ON crew_events(timestamp DESC);