-- Add the missing language column to progress table
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_progress_user_language ON progress(user_id, language);

-- Show the result
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'progress' 
AND column_name = 'language';