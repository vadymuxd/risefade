-- Testing SQL Queries for Multi-Programme Implementation
-- Run these in Supabase SQL Editor to test and verify your setup

-- ============================================
-- SECTION 1: Verify Migration
-- ============================================

-- Check that programmes table exists and has default programme
SELECT * FROM programmes;
-- Expected: Row with id=1, name='Прес'

-- Check that progress has programme_id column
SELECT id, programme_id, wins, losses, total_days_completed FROM progress;
-- Expected: At least one row with programme_id=1

-- Check that weekly_sessions has programme_id column
SELECT id, programme_id, week_start_date, is_completed, completed_days FROM weekly_sessions;
-- Expected: All existing sessions should have programme_id=1

-- ============================================
-- SECTION 2: Create Test Programmes
-- ============================================

-- Create second programme
INSERT INTO programmes (name, description) 
VALUES ('Ноги', 'Програма тренувань для ніг')
RETURNING *;

-- Create third programme
INSERT INTO programmes (name, description) 
VALUES ('Руки', 'Програма тренувань для рук')
RETURNING *;

-- Create initial progress for new programmes
INSERT INTO progress (programme_id) VALUES (2), (3);

-- Verify all programmes
SELECT * FROM programmes ORDER BY id;

-- ============================================
-- SECTION 3: Test Data Isolation
-- ============================================

-- Add test weekly session for Programme 1
INSERT INTO weekly_sessions (programme_id, week_start_date, completed_days, is_completed)
VALUES (1, CURRENT_DATE, ARRAY['day1', 'day2'], false);

-- Add test weekly session for Programme 2 (same week!)
INSERT INTO weekly_sessions (programme_id, week_start_date, completed_days, is_completed)
VALUES (2, CURRENT_DATE, ARRAY['day1'], false);

-- Verify both programmes can have same week
SELECT programme_id, week_start_date, completed_days, is_completed 
FROM weekly_sessions 
WHERE week_start_date = CURRENT_DATE
ORDER BY programme_id;
-- Expected: Two rows, one for each programme

-- ============================================
-- SECTION 4: Test Progress Tracking
-- ============================================

-- Update programme 1 session to completed (should trigger progress update)
UPDATE weekly_sessions 
SET is_completed = true, 
    completed_days = ARRAY['day1', 'day2', 'day3'],
    completed_at = NOW()
WHERE programme_id = 1 
  AND week_start_date = CURRENT_DATE;

-- Check that progress was updated for programme 1
SELECT programme_id, wins, total_days_completed 
FROM progress 
WHERE programme_id = 1;
-- Expected: wins=1, total_days_completed=3 (or increased by 3)

-- Check that progress for programme 2 was NOT affected
SELECT programme_id, wins, total_days_completed 
FROM progress 
WHERE programme_id = 2;
-- Expected: wins=0, total_days_completed=0 (unchanged)

-- ============================================
-- SECTION 5: Test Unique Constraints
-- ============================================

-- This should FAIL (duplicate programme_id in progress)
INSERT INTO progress (programme_id) VALUES (1);
-- Expected: Error - violates unique constraint

-- This should FAIL (duplicate programme_id + week_start_date)
INSERT INTO weekly_sessions (programme_id, week_start_date) 
VALUES (1, CURRENT_DATE);
-- Expected: Error - violates unique constraint

-- This should SUCCEED (different programme, same week)
INSERT INTO weekly_sessions (programme_id, week_start_date) 
VALUES (3, CURRENT_DATE);
-- Expected: Success

-- ============================================
-- SECTION 6: Query Performance Tests
-- ============================================

-- Get current week for specific programme (uses composite index)
EXPLAIN ANALYZE
SELECT * FROM weekly_sessions
WHERE programme_id = 1
  AND week_start_date = CURRENT_DATE;
-- Should show index usage: idx_weekly_sessions_programme_date

-- Get progress for programme (uses index)
EXPLAIN ANALYZE
SELECT * FROM progress
WHERE programme_id = 1;
-- Should show index usage: idx_progress_programme

-- ============================================
-- SECTION 7: Test Cascade Deletes
-- ============================================

-- Create a test programme to delete
INSERT INTO programmes (name) VALUES ('Test Delete') RETURNING id;
-- Note the returned ID (let's say it's 4)

-- Create progress for it
INSERT INTO progress (programme_id) VALUES (4);

-- Create weekly session for it
INSERT INTO weekly_sessions (programme_id, week_start_date) 
VALUES (4, CURRENT_DATE);

-- Verify data exists
SELECT * FROM programmes WHERE name = 'Test Delete';
SELECT * FROM progress WHERE programme_id = 4;
SELECT * FROM weekly_sessions WHERE programme_id = 4;

-- Delete the programme (should cascade)
DELETE FROM programmes WHERE name = 'Test Delete';

-- Verify cascade worked (should return no rows)
SELECT * FROM progress WHERE programme_id = 4;
SELECT * FROM weekly_sessions WHERE programme_id = 4;

-- ============================================
-- SECTION 8: Programme Statistics Queries
-- ============================================

-- Get complete stats for programme 1
SELECT 
  p.id,
  p.name,
  pr.wins,
  pr.losses,
  pr.total_days_completed,
  pr.current_streak,
  pr.longest_streak,
  COUNT(ws.id) as total_weeks,
  COUNT(ws.id) FILTER (WHERE ws.is_completed = true) as completed_weeks,
  ROUND(
    COUNT(ws.id) FILTER (WHERE ws.is_completed = true)::numeric / 
    NULLIF(COUNT(ws.id), 0) * 100, 
    2
  ) as completion_rate
FROM programmes p
LEFT JOIN progress pr ON pr.programme_id = p.id
LEFT JOIN weekly_sessions ws ON ws.programme_id = p.id
WHERE p.id = 1
GROUP BY p.id, p.name, pr.wins, pr.losses, pr.total_days_completed, 
         pr.current_streak, pr.longest_streak;

-- Compare all programmes
SELECT 
  p.id,
  p.name,
  pr.wins,
  pr.losses,
  pr.total_days_completed,
  COUNT(ws.id) as total_weeks,
  COUNT(ws.id) FILTER (WHERE ws.is_completed = true) as completed_weeks
FROM programmes p
LEFT JOIN progress pr ON pr.programme_id = p.id
LEFT JOIN weekly_sessions ws ON ws.programme_id = p.id
WHERE p.is_active = true
GROUP BY p.id, p.name, pr.wins, pr.losses, pr.total_days_completed
ORDER BY p.id;

-- ============================================
-- SECTION 9: Data Cleanup
-- ============================================

-- Remove test data (keep Programme 1 only)
-- WARNING: This will delete all data for programmes 2+

-- Delete weekly sessions for programmes 2+
DELETE FROM weekly_sessions WHERE programme_id > 1;

-- Delete progress for programmes 2+
DELETE FROM progress WHERE programme_id > 1;

-- Delete programmes 2+
DELETE FROM programmes WHERE id > 1;

-- Verify only Programme 1 remains
SELECT * FROM programmes;

-- ============================================
-- SECTION 10: Reset Everything (if needed)
-- ============================================

-- DANGER: This deletes ALL data across all programmes
-- Use only if you want to start completely fresh

-- Uncomment to use:
/*
DELETE FROM daily_sessions;
DELETE FROM weekly_sessions;
DELETE FROM progress WHERE programme_id != 1;
UPDATE progress SET 
  wins = 0, 
  losses = 0, 
  total_days_completed = 0, 
  current_streak = 0, 
  longest_streak = 0
WHERE programme_id = 1;
DELETE FROM programmes WHERE id != 1;
*/

-- ============================================
-- SECTION 11: Useful Monitoring Queries
-- ============================================

-- See all active programmes with current week status
SELECT 
  p.id,
  p.name,
  ws.week_start_date,
  ws.completed_days,
  ws.is_completed as week_completed,
  array_length(ws.completed_days, 1) as days_done
FROM programmes p
LEFT JOIN weekly_sessions ws ON ws.programme_id = p.id 
  AND ws.week_start_date = CURRENT_DATE
WHERE p.is_active = true
ORDER BY p.id;

-- See progress for all programmes
SELECT 
  p.name,
  pr.wins,
  pr.losses,
  pr.total_days_completed,
  pr.current_streak
FROM programmes p
JOIN progress pr ON pr.programme_id = p.id
ORDER BY p.id;

-- Find programmes with no activity
SELECT p.*
FROM programmes p
LEFT JOIN weekly_sessions ws ON ws.programme_id = p.id
WHERE ws.id IS NULL
  AND p.is_active = true;

-- Find most active programme
SELECT 
  p.name,
  COUNT(ws.id) as total_sessions,
  SUM(array_length(ws.completed_days, 1)) as total_days_logged
FROM programmes p
JOIN weekly_sessions ws ON ws.programme_id = p.id
GROUP BY p.id, p.name
ORDER BY total_days_logged DESC
LIMIT 1;

-- ============================================
-- SECTION 12: Trigger Testing
-- ============================================

-- Test that trigger updates correct programme
-- Get current wins for programme 1
SELECT wins FROM progress WHERE programme_id = 1;

-- Insert and complete a week
INSERT INTO weekly_sessions (programme_id, week_start_date, completed_days, is_completed)
VALUES (1, '2025-01-01', ARRAY['day1', 'day2', 'day3'], true);

-- Check wins increased
SELECT wins FROM progress WHERE programme_id = 1;
-- Should be +1 from before

-- Test that other programmes weren't affected
SELECT programme_id, wins FROM progress WHERE programme_id != 1;
-- Should be unchanged

-- Clean up test data
DELETE FROM weekly_sessions WHERE week_start_date = '2025-01-01';

-- ============================================
-- Quick Reference: Common Queries
-- ============================================

-- Get all active programmes
SELECT * FROM programmes WHERE is_active = true;

-- Get progress for programme X
SELECT * FROM progress WHERE programme_id = 1;

-- Get current week for programme X
SELECT * FROM weekly_sessions 
WHERE programme_id = 1 
  AND week_start_date = CURRENT_DATE;

-- Get all weeks for programme X
SELECT * FROM weekly_sessions 
WHERE programme_id = 1 
ORDER BY week_start_date DESC;

-- Count completed weeks for programme X
SELECT COUNT(*) FROM weekly_sessions 
WHERE programme_id = 1 
  AND is_completed = true;
