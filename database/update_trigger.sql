-- Updated trigger function - only handles wins increment, not total_days
-- Run this in Supabase SQL Editor to update the existing trigger

CREATE OR REPLACE FUNCTION update_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update wins when weekly session is completed/uncompleted
  -- total_days_completed is now handled manually for each day
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