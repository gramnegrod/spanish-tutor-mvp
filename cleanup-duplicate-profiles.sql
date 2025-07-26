-- Cleanup duplicate profiles in the learner_profiles table
-- This keeps the most recently updated profile for each user/language combination

-- First, identify duplicates
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
-- Delete all but the most recent profile for each user/language combination
DELETE FROM public.learner_profiles lp
WHERE EXISTS (
  SELECT 1 
  FROM duplicates d
  WHERE d.user_id = lp.user_id 
    AND d.language = lp.language
    AND lp.updated_at < d.latest_update
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE public.learner_profiles 
ADD CONSTRAINT unique_user_language 
UNIQUE (user_id, language);