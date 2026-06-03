-- Events table for observation layer
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'error', 'deploy', 'health_check', 'cost_anomaly', 'user_action'
  source TEXT NOT NULL, -- 'api_worker', 'monday', 'kraken', 'google', 'system'
  severity TEXT NOT NULL, -- 'info', 'warning', 'error', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  metadata TEXT, -- JSON string for additional data
  evidence_links TEXT, -- JSON array of URLs to logs/dashboards
  created_at TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE
);

-- Proposals table for self-improvement queue
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- 'self_healing', 'optimization', 'feature', 'bug_fix'
  priority TEXT NOT NULL, -- 'p0', 'p1', 'p2', 'p3'
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'implemented'
  evidence TEXT, -- JSON string with supporting evidence
  suspected_cause TEXT,
  recommended_fix TEXT,
  rollback_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  approved_by TEXT,
  implemented_at TEXT
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_processed ON events(processed);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_priority ON proposals(priority);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at);