-- Agent actions log table for autonomous execution tracking
CREATE TABLE IF NOT EXISTS agent_actions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    details TEXT,
    execution_time_ms INTEGER
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_actions_timestamp ON agent_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_id ON agent_actions(agent_id);