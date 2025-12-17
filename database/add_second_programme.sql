-- Add Second Programme: "Все тіло"
-- Run this AFTER migration_add_programmes.sql has been applied
-- This script is idempotent - safe to run multiple times

-- Insert the second programme if it doesn't exist
INSERT INTO programmes (id, name, description, is_active)
VALUES (2, 'Все тіло', 'Домашня програма на все тіло з гантелями', false)
ON CONFLICT (id) DO NOTHING;

-- Create progress record for programme 2 if it doesn't exist
INSERT INTO progress (programme_id, wins, losses, total_days_completed, current_streak, longest_streak)
VALUES (2, 0, 0, 0, 0, 0)
ON CONFLICT (programme_id) DO NOTHING;

-- Verify the programmes exist
SELECT id, name, is_active FROM programmes ORDER BY id;
