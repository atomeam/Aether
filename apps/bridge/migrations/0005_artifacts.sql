-- Migration: artifacts table
-- Stores artifact references with correlation tracking
-- RECONSTRUCTED from live aether-bridge-db on 2026-05-28
-- Original applied via CF API (no migration file existed)

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  correlation_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  url TEXT NOT NULL,
  meta_json TEXT,
  created_at TEXT NOT NULL
);
