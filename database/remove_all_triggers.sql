-- COMPLETELY DISABLE DATABASE TRIGGERS
-- Run this in Supabase SQL Editor to prevent any trigger interference
-- This ensures only manual logic in the app controls wins and total_days

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_update_progress ON weekly_sessions;

-- Drop the function as well
DROP FUNCTION IF EXISTS update_progress();

-- Verify triggers are removed (this should return empty)
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_update_progress';