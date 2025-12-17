-- Risefade Exercise App Database Schema - Multi-Programme Version
-- Run this in your Supabase SQL Editor

-- Programmes table - contains all workout programmes
CREATE TABLE programmes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global progress summary per programme
CREATE TABLE progress (
  id SERIAL PRIMARY KEY,
  programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_days_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_programme_progress UNIQUE (programme_id)
);

-- Weekly sessions table
CREATE TABLE weekly_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  week_start_date DATE DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_days TEXT[] DEFAULT '{}', -- Array of completed day IDs like ['day1', 'day2']
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_programme_week UNIQUE (programme_id, week_start_date)
);

-- Daily sessions table for detailed tracking
CREATE TABLE daily_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_session_id UUID REFERENCES weekly_sessions(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL, -- 'day1', 'day2', 'day3'
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exercises_completed TEXT[] DEFAULT '{}', -- Array of exercise IDs
  total_exercises INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_progress_programme ON progress(programme_id);
CREATE INDEX idx_weekly_sessions_programme ON weekly_sessions(programme_id);
CREATE INDEX idx_weekly_sessions_date ON weekly_sessions(week_start_date);
CREATE INDEX idx_weekly_sessions_programme_date ON weekly_sessions(programme_id, week_start_date);
CREATE INDEX idx_daily_sessions_day_key ON daily_sessions(day_key);
CREATE INDEX idx_daily_sessions_weekly_id ON daily_sessions(weekly_session_id);

-- Function to update progress when weekly session is completed
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

-- Trigger to update progress
CREATE TRIGGER trigger_update_progress
  AFTER UPDATE ON weekly_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_progress();

-- Insert default programme "Прес"
INSERT INTO programmes (id, name, description) VALUES (1, 'Прес', 'Програма тренувань для преса');

-- Insert initial progress record for Programme 1
INSERT INTO progress (programme_id) VALUES (1);

-- Enable Row Level Security
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust for your auth needs)
-- Using USING (true) for SELECT and WITH CHECK (true) for INSERT/UPDATE/DELETE
CREATE POLICY "Allow all operations" ON programmes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON weekly_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON daily_sessions FOR ALL USING (true) WITH CHECK (true);
