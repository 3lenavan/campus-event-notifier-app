-- Supabase RLS Policies for Events Table
-- Run these SQL commands in your Supabase SQL Editor
-- 
-- IMPORTANT: Since this app uses Firebase Auth (not Supabase Auth),
-- the standard auth.uid() won't work. We need to use one of these approaches:

-- ============================================
-- OPTION 1: Allow inserts for anyone (for testing/development)
-- ============================================
-- Enable RLS on events table (if not already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anyone to create events" ON events;
DROP POLICY IF EXISTS "Allow users to read approved events" ON events;
DROP POLICY IF EXISTS "Allow users to read all events" ON events;

-- Policy: Allow anyone to insert events (for development/testing)
-- WARNING: This is not secure for production!
CREATE POLICY "Allow anyone to create events"
ON events
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Allow anyone to read approved events
CREATE POLICY "Allow users to read approved events"
ON events
FOR SELECT
TO public
USING (status = 'approved');

-- Policy: Allow anyone to read all events (for development)
-- Remove this in production and use the approved-only policy above
CREATE POLICY "Allow users to read all events"
ON events
FOR SELECT
TO public
USING (true);

-- ============================================
-- OPTION 2: Use Service Role Key (for production)
-- ============================================
-- If you want to use RLS with Firebase Auth, you'll need to:
-- 1. Create a serverless function/API route that uses the service role key
-- 2. Or use Supabase Edge Functions to handle writes
-- 3. Or configure Supabase to accept Firebase JWT tokens
--
-- For now, Option 1 allows the app to work, but you should implement
-- proper authentication in production.

-- ============================================
-- OPTION 3: Disable RLS (NOT RECOMMENDED)
-- ============================================
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;
-- Only use this for initial testing, never in production!

