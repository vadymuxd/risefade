-- Migration: Add Programmes Support
-- This migration creates the programmes table and links all existing data to Programme 1

-- Step 1: Create programmes table
CREATE TABLE programmes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add programme_id to progress table
ALTER TABLE progress ADD COLUMN programme_id INTEGER;

-- Step 3: Add programme_id to weekly_sessions table
ALTER TABLE weekly_sessions ADD COLUMN programme_id INTEGER;

-- Step 4: Insert the default programmes
INSERT INTO programmes (id, name, description, is_active) VALUES 
  (1, 'Прес', 'Програма тренувань для преса', true),
  (2, 'Все тіло', 'Домашня програма на все тіло з гантелями', false);

-- Step 5: Update existing progress to link to programme 1
UPDATE progress SET programme_id = 1 WHERE id = 1;

-- Step 5b: Create progress record for programme 2
INSERT INTO progress (programme_id) VALUES (2);

-- Step 6: Update all existing weekly_sessions to link to programme 1
UPDATE weekly_sessions SET programme_id = 1;

-- Step 7: Add foreign key constraints
ALTER TABLE progress ADD CONSTRAINT fk_progress_programme 
  FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE;

ALTER TABLE weekly_sessions ADD CONSTRAINT fk_weekly_session_programme 
  FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE;

-- Step 8: Remove the single row constraint from progress table
ALTER TABLE progress DROP CONSTRAINT IF EXISTS single_row;

-- Step 9: Add unique constraint on programme_id for progress table
-- Each programme should have only one progress row
ALTER TABLE progress ADD CONSTRAINT unique_programme_progress UNIQUE (programme_id);

-- Step 10: Update progress id to be auto-incremental
ALTER TABLE progress ALTER COLUMN id DROP DEFAULT;
CREATE SEQUENCE IF NOT EXISTS progress_id_seq;
ALTER TABLE progress ALTER COLUMN id SET DEFAULT nextval('progress_id_seq');
SELECT setval('progress_id_seq', (SELECT MAX(id) FROM progress));

-- Step 11: Add index on programme_id for better query performance
CREATE INDEX idx_progress_programme ON progress(programme_id);
CREATE INDEX idx_weekly_sessions_programme ON weekly_sessions(programme_id);
CREATE INDEX idx_weekly_sessions_programme_date ON weekly_sessions(programme_id, week_start_date);

-- Step 12: Enable RLS and create policies for all tables
-- Enable RLS on all tables
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations" ON programmes;
DROP POLICY IF EXISTS "Allow all operations" ON progress;
DROP POLICY IF EXISTS "Allow all operations" ON weekly_sessions;
DROP POLICY IF EXISTS "Allow all operations" ON daily_sessions;

-- Create new policies that allow all operations (for single-user app)
CREATE POLICY "Allow all operations" ON programmes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON weekly_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON daily_sessions FOR ALL USING (true) WITH CHECK (true);

-- Step 13: Update the trigger function to work with programmes
DROP TRIGGER IF EXISTS trigger_update_progress ON weekly_sessions;
DROP FUNCTION IF EXISTS update_progress();

CREATE OR REPLACE FUNCTION update_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update wins/losses and total days for the specific programme
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    UPDATE progress 
    SET 
      wins = wins + 1,
      total_days_completed = total_days_completed + array_length(NEW.completed_days, 1),
      updated_at = NOW()
    WHERE programme_id = NEW.programme_id;
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    UPDATE progress 
    SET 
      wins = wins - 1,
      total_days_completed = total_days_completed - array_length(OLD.completed_days, 1),
      updated_at = NOW()
    WHERE programme_id = NEW.programme_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress
  AFTER UPDATE ON weekly_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_progress();

-- Step 14: Update unique constraint on week_start_date to include programme_id
-- Now we can have multiple programmes with the same week
ALTER TABLE weekly_sessions DROP CONSTRAINT IF EXISTS weekly_sessions_week_start_date_key;
ALTER TABLE weekly_sessions ADD CONSTRAINT unique_programme_week 
  UNIQUE (programme_id, week_start_date);
