-- Autonomous Actions Tracking Table (for learning and rollback)
CREATE TABLE IF NOT EXISTS autonomous_actions (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  before_metric REAL NOT NULL,
  after_metric REAL,
  expected_outcome TEXT NOT NULL,
  actual_outcome TEXT,
  status TEXT NOT NULL, -- 'pending', 'executed', 'rolled_back'
  rollback_possible INTEGER NOT NULL DEFAULT 1,
  timestamp TEXT NOT NULL,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_status ON autonomous_actions(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_type ON autonomous_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_strategy_id ON autonomous_actions(strategy_id);
