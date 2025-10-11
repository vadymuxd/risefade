-- DISABLE the problematic trigger completely
-- Run this in Supabase SQL Editor to fix the double-counting issue

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS trigger_update_progress ON weekly_sessions;

-- Drop the function as well
DROP FUNCTION IF EXISTS update_progress();

-- Optional: Create a simpler trigger that ONLY handles wins, no total_days
-- (You can run this if you want automated wins, or leave it commented out)
/*
CREATE OR REPLACE FUNCTION update_wins_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update wins when weekly session is completed
  -- total_days_completed is handled manually in the app
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    UPDATE progress 
    SET 
      wins = wins + 1,
      updated_at = NOW()
    WHERE id = 1;
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    UPDATE progress 
    SET 
      wins = wins - 1,
      updated_at = NOW()
    WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger (uncomment if you want this)
CREATE TRIGGER trigger_update_wins_only
  AFTER UPDATE ON weekly_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_wins_only();
*/