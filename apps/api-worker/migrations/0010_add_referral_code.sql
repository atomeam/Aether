-- Add referral_code column to users table
ALTER TABLE users ADD COLUMN referral_code TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);