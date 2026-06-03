-- Bootstrap P-Value Results Table
CREATE TABLE IF NOT EXISTS bootstrap_results (
  id TEXT PRIMARY KEY,
  strategy_id TEXT NOT NULL,
  observed_metric REAL NOT NULL,
  p_value REAL NOT NULL,
  confidence_interval_lower REAL NOT NULL,
  confidence_interval_upper REAL NOT NULL,
  threshold REAL NOT NULL,
  action_needed INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Infrastructure Adjustments Table
CREATE TABLE IF NOT EXISTS infrastructure_adjustments (
  id TEXT PRIMARY KEY,
  strategy_id TEXT NOT NULL,
  p_value REAL NOT NULL,
  observed_metric REAL NOT NULL,
  action_type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bootstrap_strategy_id ON bootstrap_results(strategy_id);
CREATE INDEX IF NOT EXISTS idx_bootstrap_timestamp ON bootstrap_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_infra_adjustments_strategy_id ON infrastructure_adjustments(strategy_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_strategy_id ON agent_actions(strategy_id);
