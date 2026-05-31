-- Migration: backfill schema_migrations
-- Records all historically applied changes that were never tracked.
-- Does NOT re-apply any DDL — only inserts tracking rows.
--
-- Background:
--   schema_migrations contains exactly 1 row (seed-2025-05-22).
--   Two ALTER TABLEs on council-routing-db's events table were applied
--   outside migration tooling (event_type, session_id columns).
--   Migrations 0002-0006 were reconstructed from live aether-bridge-db
--   and merged in PR #25 (2026-05-28) — tables already existed, but
--   schema_migrations had no record of them.
--
-- After this migration, schema_migrations reflects reality:
--   1 seed + 2 historical ALTERs + 5 reconstructed migrations = 8 rows
--   (this file itself becomes row 9).

INSERT OR IGNORE INTO schema_migrations (name, applied_at) VALUES
  -- Untracked ALTERs on council-routing-db events table
  -- Exact dates unknown; predates any committed migration. Using seed date as lower bound.
  ('alter-events-add-event_type',      '2025-05-22T00:00:00Z'),
  ('alter-events-add-session_id',      '2025-05-22T00:00:00Z'),
  -- Reconstructed migrations for aether-bridge-db (PR #25, merged 2026-05-28)
  ('0002_events_council_logs',         '2026-05-28T14:04:00Z'),
  ('0003_slack_audit_events',          '2026-05-28T14:04:00Z'),
  ('0004_processed_slack_events',      '2026-05-28T14:04:00Z'),
  ('0005_artifacts',                   '2026-05-28T14:04:00Z'),
  ('0006_metrics_snapshots',           '2026-05-28T14:04:00Z');
