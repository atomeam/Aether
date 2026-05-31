-- Migration: metrics_snapshots table
-- Stores metrics snapshots with actor and source tracking
-- RECONSTRUCTED from live aether-bridge-db on 2026-05-28
-- Original applied via CF API (no migration file existed)

CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  source TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  observed_at TEXT,
  created_at TEXT NOT NULL
);
