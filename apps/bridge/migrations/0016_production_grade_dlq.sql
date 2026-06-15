-- Dead Letter Queue (DLQ) Schema Extension
-- Adds failed_tasks table for poison-pill task handling and retry tracking

-- Failed Tasks: Dead Letter Queue for tasks that failed after max retries
CREATE TABLE IF NOT EXISTS failed_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  task_type TEXT NOT NULL, -- ci_medic_task, heartbeat_task, etc.
  original_payload TEXT NOT NULL, -- JSON payload of original task
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, moved_to_dlq, resolved
  agent_id TEXT,
  crew TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- API Cost Monitoring: Track daily API spend for budget interlock
CREATE TABLE IF NOT EXISTS api_cost_monitor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  api_provider TEXT NOT NULL, -- anthropic, github, etc.
  api_endpoint TEXT NOT NULL,
  cost_usd REAL DEFAULT 0,
  request_count INTEGER DEFAULT 1,
  date TEXT NOT NULL, -- YYYY-MM-DD for daily aggregation
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sequence IDs: Log vector for forensic accuracy and event ordering
CREATE TABLE IF NOT EXISTS event_sequence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sequence_id TEXT NOT NULL UNIQUE, -- Global sequence ID
  agent_id TEXT NOT NULL,
  crew TEXT NOT NULL,
  event_id INTEGER, -- Reference to crew_events.id
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_failed_tasks_task_id ON failed_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_failed_tasks_task_type ON failed_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_failed_tasks_status ON failed_tasks(status);
CREATE INDEX IF NOT EXISTS idx_failed_tasks_agent_id ON failed_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_api_cost_monitor_agent_id ON api_cost_monitor(agent_id);
CREATE INDEX IF NOT EXISTS idx_api_cost_monitor_date ON api_cost_monitor(date);
CREATE INDEX IF NOT EXISTS idx_event_sequence_sequence_id ON event_sequence(sequence_id);
CREATE INDEX IF NOT EXISTS idx_event_sequence_agent_id ON event_sequence(agent_id);
CREATE INDEX IF NOT EXISTS idx_event_sequence_timestamp ON event_sequence(timestamp DESC);