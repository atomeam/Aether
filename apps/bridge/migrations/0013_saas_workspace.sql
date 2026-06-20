-- Migration: SaaS Multi-tenant Workspace Schema
-- Adds workspace isolation and projects table for tenant-isolated SaaS endpoints

-- Add workspace_id to tasks table if not exists
ALTER TABLE tasks ADD COLUMN workspace_id TEXT;

-- Add project_id to tasks table if not exists
ALTER TABLE tasks ADD COLUMN project_id TEXT;

-- Add priority column to tasks if not exists
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'P2';

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  workspace_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);