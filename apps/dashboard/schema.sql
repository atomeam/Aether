-- Aether Dashboard D1 Schema
-- Infrastructure truth registry

-- Infrastructure state table
CREATE TABLE IF NOT EXISTS infrastructure_state (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  current_version_id TEXT,
  last_verified_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_state_type ON infrastructure_state(resource_type);
CREATE INDEX IF NOT EXISTS idx_state_status ON infrastructure_state(status);
CREATE INDEX IF NOT EXISTS idx_state_verified ON infrastructure_state(last_verified_at);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  event_id TEXT PRIMARY KEY,
  triggered_by TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_id TEXT,
  success INTEGER NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_id);