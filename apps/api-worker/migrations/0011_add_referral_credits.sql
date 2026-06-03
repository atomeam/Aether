-- Add referral_credits column to users table
ALTER TABLE users ADD COLUMN referral_credits INTEGER DEFAULT 0;