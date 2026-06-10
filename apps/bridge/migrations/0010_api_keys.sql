-- Migration: api_keys table for secure API key lifecycle management
-- Implements default-deny architecture with one-way hashing and edge caching

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT 'read',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT,
  last_used_at TEXT
);

-- Indexes for performance and lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_owner_id ON api_keys(owner_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Index for active key lookups during authorization
CREATE INDEX IF NOT EXISTS idx_api_keys_active_status ON api_keys(status) WHERE status = 'active';

-- Audit trail for key lifecycle events
CREATE TABLE IF NOT EXISTS api_key_audit_log (
  id TEXT PRIMARY KEY,
  key_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (key_id) REFERENCES api_keys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_key_audit_log_key_id ON api_key_audit_log(key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_log_created_at ON api_key_audit_log(created_at);
