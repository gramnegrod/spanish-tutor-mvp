-- Quick fix for progress table
-- Add all missing columns

ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es',
ADD COLUMN IF NOT EXISTS total_minutes_practiced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversations_completed INTEGER DEFAULT 0;

-- Show the updated structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'progress'
ORDER BY ordinal_position;