-- User usage tracking for plan enforcement
CREATE TABLE IF NOT EXISTS user_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usage_unique ON user_usage(user_id, date);