-- Migration: tasks table for D1-backed Tasks Hub
-- Task state management with audit trail integration

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  ai_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_ai_id ON tasks(ai_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at);
