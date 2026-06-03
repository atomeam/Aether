-- API usage rollups for analytics and billing
CREATE TABLE IF NOT EXISTS api_usage_rollups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_api_usage_rollups_user_id ON api_usage_rollups(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_rollups_date ON api_usage_rollups(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_usage_rollups_unique ON api_usage_rollups(user_id, date);
