-- Add columns to agent_actions for profit engine functionality
-- These columns are needed for bootstrap p-value analysis
ALTER TABLE agent_actions ADD COLUMN revenue REAL DEFAULT 0;
ALTER TABLE agent_actions ADD COLUMN cost REAL DEFAULT 0;
ALTER TABLE agent_actions ADD COLUMN conversions INTEGER DEFAULT 0;
ALTER TABLE agent_actions ADD COLUMN strategy_id TEXT DEFAULT 'default';
