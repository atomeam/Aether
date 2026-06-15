-- Migration: Add ai_id and description columns to existing tasks table
-- Adapting existing tasks schema for Tasks Hub compatibility

ALTER TABLE tasks ADD COLUMN ai_id TEXT;
ALTER TABLE tasks ADD COLUMN description TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_ai_id ON tasks(ai_id);
