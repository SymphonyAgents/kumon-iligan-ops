-- Add approval status column to users table
-- Values: 'active' (default for existing users), 'pending', 'rejected'
ALTER TABLE users ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active' NOT NULL;
