-- Add variant column for A/B testing
ALTER TABLE user_navigation_logs ADD COLUMN variant TEXT;