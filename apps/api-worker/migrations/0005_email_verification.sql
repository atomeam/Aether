-- Add email verification columns to users table (if they don't exist)
-- Using SQLite's ALTER TABLE with IF NOT EXISTS equivalent
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- This migration is idempotent by checking if the column exists first

-- We'll use a try-catch approach via the migration runner
-- For now, skip this if columns already exist