-- Risefade Exercise App Database Schema
-- Simple single-user version
-- Run this in your Supabase SQL Editor

-- Global progress summary (single row for your progress)
CREATE TABLE progress (
  id INTEGER PRIMARY KEY DEFAULT 1,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_days_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Weekly sessions table
CREATE TABLE weekly_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE DEFAULT CURRENT_DATE UNIQUE,
  is_completed BOOLEAN DEFAULT false,
  completed_days TEXT[] DEFAULT '{}', -- Array of completed day IDs like ['day1', 'day2']
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily sessions table for detailed tracking
CREATE TABLE daily_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_session_id UUID REFERENCES weekly_sessions(id),
  day_key TEXT NOT NULL, -- 'day1', 'day2', 'day3'
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exercises_completed TEXT[] DEFAULT '{}', -- Array of exercise IDs
  total_exercises INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_weekly_sessions_date ON weekly_sessions(week_start_date);
CREATE INDEX idx_daily_sessions_day_key ON daily_sessions(day_key);
CREATE INDEX idx_daily_sessions_weekly_id ON daily_sessions(weekly_session_id);

-- Function to update progress when weekly session is completed
CREATE OR REPLACE FUNCTION update_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update wins/losses and total days
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    UPDATE progress 
    SET 
      wins = wins + 1,
      total_days_completed = total_days_completed + array_length(NEW.completed_days, 1),
      updated_at = NOW()
    WHERE id = 1;
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    UPDATE progress 
    SET 
      wins = wins - 1,
      total_days_completed = total_days_completed - array_length(OLD.completed_days, 1),
      updated_at = NOW()
    WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress
CREATE TRIGGER trigger_update_progress
  AFTER UPDATE ON weekly_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_progress();

-- Insert initial progress record
INSERT INTO progress (id) VALUES (1);

-- Create policies for public access
CREATE POLICY "Allow all operations" ON progress FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON weekly_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON daily_sessions FOR ALL USING (true);