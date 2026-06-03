-- System anomalies table for S2 Auto-Patcher
CREATE TABLE IF NOT EXISTS system_anomalies (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    error_type TEXT NOT NULL,
    stack_trace TEXT,
    request_payload TEXT,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL,
    patch_id TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_system_anomalies_timestamp ON system_anomalies(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_anomalies_status ON system_anomalies(status);