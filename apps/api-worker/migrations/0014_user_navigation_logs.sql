-- User navigation logs for S5 Architect telemetry
CREATE TABLE IF NOT EXISTS user_navigation_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    panel_id TEXT NOT NULL,
    action TEXT NOT NULL,
    duration_ms INTEGER,
    timestamp TEXT NOT NULL,
    page_url TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_navigation_timestamp ON user_navigation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_navigation_user_id ON user_navigation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_navigation_panel_id ON user_navigation_logs(panel_id);