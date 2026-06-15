-- Create validation_failures table for MutationValidator middleware
-- Logs all failed payload validations with error details

CREATE TABLE IF NOT EXISTS validation_failures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  failed_payload TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for querying by error type
CREATE INDEX IF NOT EXISTS idx_validation_failures_error_type ON validation_failures(error_type);

-- Create index for querying by timestamp
CREATE INDEX IF NOT EXISTS idx_validation_failures_timestamp ON validation_failures(timestamp);

-- Create index for querying by source
CREATE INDEX IF NOT EXISTS idx_validation_failures_source ON validation_failures(source);