-- Add medication_taken column to daily_checkins table
-- This column tracks whether medication was taken: 'yes', 'no', or 'not tracked'

ALTER TABLE daily_checkins 
ADD COLUMN medication_taken TEXT DEFAULT 'not tracked';

-- Update existing records based on medication fields
-- If primary_concern_today is 'medication_adherence', assume they're tracking
UPDATE daily_checkins 
SET medication_taken = 'yes'
WHERE primary_concern_today = 'medication_adherence'
  AND medication_taken = 'not tracked';