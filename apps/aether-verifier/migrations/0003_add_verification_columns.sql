-- Migration: Add verification columns to runs table
-- This migration adds columns needed by aether-verifier worker
-- DO NOT APPLY until schema is reviewed and approved

ALTER TABLE runs ADD COLUMN evidence_passed INTEGER DEFAULT 0;
ALTER TABLE runs ADD COLUMN evidence_reasons TEXT;
ALTER TABLE runs ADD COLUMN verifier_model TEXT DEFAULT 'unknown';

-- Create index on evidence_passed for faster queries
CREATE INDEX IF NOT EXISTS idx_runs_evidence_passed ON runs(evidence_passed);
