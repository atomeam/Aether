-- Migration: Admin Audit Log Table
-- Purpose: Record all privileged admin actuator endpoint calls for security audit trail
-- Evidence-gated compliance for admin operations

CREATE TABLE IF NOT EXISTS admin_audit_log (
  request_id TEXT NOT NULL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  auth_status TEXT NOT NULL CHECK(auth_status IN ('SUCCESS', 'FAILURE')),
  auth_failure_reason TEXT,
  client_ip TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  external_run_id TEXT,  -- GitHub workflow run ID or other external system ID
  external_run_url TEXT, -- Resolvable URL to external system run
  request_body TEXT,
  response_status INTEGER,
  response_body TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_endpoint ON admin_audit_log(endpoint);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_timestamp ON admin_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_auth_status ON admin_audit_log(auth_status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_external_run_id ON admin_audit_log(external_run_id);