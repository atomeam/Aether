-- Analytics Schema for a-to-mind API Monetization Tracking
-- Migration 0014

-- Request logging table
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  api_key_hash TEXT,
  tier TEXT DEFAULT 'free', -- 'free', 'pro', 'ultra', 'mega'
  error_message TEXT
);

-- Daily metrics aggregation table
CREATE TABLE IF NOT EXISTS daily_metrics (
  date DATE PRIMARY KEY,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL,
  unique_users INTEGER NOT NULL,
  avg_response_time_ms REAL NOT NULL,
  error_rate REAL NOT NULL,
  tier_breakdown TEXT NOT NULL -- JSON: {"free": 100, "pro": 50, "ultra": 10, "mega": 5}
);

-- Rate limit hits table (upgrade candidates)
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  id TEXT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  limit_type TEXT NOT NULL, -- 'daily' or 'monthly'
  current_usage INTEGER NOT NULL,
  tier TEXT DEFAULT 'free'
);

-- User activity table (for retention tracking)
CREATE TABLE IF NOT EXISTS user_activity (
  ip_address TEXT NOT NULL,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_requests INTEGER DEFAULT 1,
  tier TEXT DEFAULT 'free',
  PRIMARY KEY (ip_address)
);

-- Revenue tracking table
CREATE TABLE IF NOT EXISTS revenue_events (
  id TEXT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT NOT NULL, -- 'subscription_start', 'subscription_upgrade', 'subscription_cancel'
  ip_address TEXT NOT NULL,
  from_tier TEXT,
  to_tier TEXT,
  amount REAL NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_requests_endpoint ON requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_requests_ip ON requests(ip_address);
CREATE INDEX IF NOT EXISTS idx_requests_tier ON requests(tier);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_ip ON rate_limit_hits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_timestamp ON rate_limit_hits(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_seen ON user_activity(last_seen);
CREATE INDEX IF NOT EXISTS idx_revenue_events_timestamp ON revenue_events(timestamp);
