-- Fix schema for progress tracking
-- Run this in Supabase SQL editor

-- First, check if we have a 'progress' table or 'user_progress' table
-- The code expects 'user_progress' but the migration created 'progress'

-- Option 1: Rename 'progress' to 'user_progress' if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'progress') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_progress') THEN
        ALTER TABLE progress RENAME TO user_progress;
    END IF;
END $$;

-- Option 2: If neither exists, create user_progress
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL DEFAULT 'es',
    total_minutes_practiced INTEGER DEFAULT 0,
    conversations_completed INTEGER DEFAULT 0,
    vocabulary_learned JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, language)
);

-- Add missing columns if the table exists but columns are missing
ALTER TABLE user_progress 
ADD COLUMN IF NOT EXISTS conversations_completed INTEGER DEFAULT 0;

-- Rename the column if it exists with a different name
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'conversationsCompleted'
    ) THEN
        ALTER TABLE user_progress 
        RENAME COLUMN "conversationsCompleted" TO conversations_completed;
    END IF;
END $$;

-- Add the total_minutes_practiced column if using different naming
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'totalMinutesPracticed'
    ) THEN
        ALTER TABLE user_progress 
        RENAME COLUMN "totalMinutesPracticed" TO total_minutes_practiced;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_language ON user_progress(user_id, language);

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_progress'
ORDER BY ordinal_position;