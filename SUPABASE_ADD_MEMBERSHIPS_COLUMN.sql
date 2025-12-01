-- Add memberships column to user_profiles table
-- Run this SQL in your Supabase SQL Editor

-- Add memberships column as text array (stores club slugs)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS memberships text[] DEFAULT '{}';

-- Update existing rows to have empty array if null
UPDATE user_profiles 
SET memberships = '{}' 
WHERE memberships IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.memberships IS 'Array of club slugs that the user is a member of';

