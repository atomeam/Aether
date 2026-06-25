-- D1 Schema for Distributed Tracing and Audit Trail
-- This schema provides strong consistency and SQL queries for trace data

-- Traces table
CREATE TABLE IF NOT EXISTS traces (
  id TEXT PRIMARY KEY,
  operation_name TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  duration INTEGER,
  status TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Spans table
CREATE TABLE IF NOT EXISTS spans (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  parent_span_id TEXT,
  operation_name TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  duration INTEGER,
  status TEXT NOT NULL,
  metadata TEXT,
  error_message TEXT,
  error_stack TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (trace_id) REFERENCES traces(id) ON DELETE CASCADE
);

-- Audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes TEXT,
  timestamp INTEGER NOT NULL,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_traces_operation ON traces(operation_name);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);
CREATE INDEX IF NOT EXISTS idx_traces_start_time ON traces(start_time);
CREATE INDEX IF NOT EXISTS idx_spans_trace_id ON spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_spans_parent_span_id ON spans(parent_span_id);
CREATE INDEX IF NOT EXISTS idx_spans_operation ON spans(operation_name);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_trail(actor);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_trail(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_trail(timestamp);
