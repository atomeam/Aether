-- Add geographic telemetry columns for edge-shifting
ALTER TABLE user_navigation_logs ADD COLUMN country TEXT;
ALTER TABLE user_navigation_logs ADD COLUMN colo TEXT;