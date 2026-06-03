-- Slow queries tracking table for S3 Database Inspector
CREATE TABLE IF NOT EXISTS slow_queries (
    id TEXT PRIMARY KEY,
    query_text TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    user_id TEXT NOT NULL,
    table_name TEXT,
    query_type TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_slow_queries_timestamp ON slow_queries(timestamp);
CREATE INDEX IF NOT EXISTS idx_slow_queries_user_id ON slow_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_slow_queries_duration ON slow_queries(duration_ms);