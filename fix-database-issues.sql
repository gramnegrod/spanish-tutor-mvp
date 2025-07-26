-- Fix 1: Add missing language column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';

-- Fix 2: Update RLS policies to allow users to create their own profiles
-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.learner_profiles;

-- Create new insert policy that properly allows profile creation
CREATE POLICY "Users can insert own profiles" ON public.learner_profiles
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Also ensure the update policy exists
DROP POLICY IF EXISTS "Users can update own profiles" ON public.learner_profiles;
CREATE POLICY "Users can update own profiles" ON public.learner_profiles
    FOR UPDATE 
    USING (user_id = auth.uid());

-- Fix 3: Clean up duplicate profiles and add unique constraint
-- First, identify and remove duplicates (keeping the most recent)
WITH duplicates AS (
  SELECT 
    user_id,
    language,
    COUNT(*) as profile_count,
    MAX(updated_at) as latest_update
  FROM public.learner_profiles
  GROUP BY user_id, language
  HAVING COUNT(*) > 1
)
DELETE FROM public.learner_profiles lp
WHERE EXISTS (
  SELECT 1 
  FROM duplicates d
  WHERE d.user_id = lp.user_id 
    AND d.language = lp.language
    AND lp.updated_at < d.latest_update
);

-- Add unique constraint to prevent future duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_language'
    ) THEN
        ALTER TABLE public.learner_profiles 
        ADD CONSTRAINT unique_user_language 
        UNIQUE (user_id, language);
    END IF;
END $$;

-- Fix 4: Ensure conversations table has proper RLS policies
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('learner_profiles', 'conversations')
ORDER BY table_name, ordinal_position;