-- Migration: Add Module System
-- Description: Creates tables and policies for tracking user progress through learning modules
-- Author: Spanish Tutor MVP
-- Date: 2025-07-15

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE MODULE PROGRESS TABLE
-- =====================================================
-- This table stores user progress for each learning module
-- Using JSONB for module_data allows flexible storage of module-specific data
CREATE TABLE IF NOT EXISTS public.module_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,
    module_data JSONB DEFAULT '{}'::jsonb, -- Flexible storage for module-specific data
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure each user can only have one progress record per module
    CONSTRAINT unique_user_module UNIQUE (user_id, module_id)
);

-- Add table comment
COMMENT ON TABLE public.module_progress IS 'Stores user progress through learning modules';
COMMENT ON COLUMN public.module_progress.module_data IS 'JSONB field for flexible module-specific data storage';

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
-- Composite index for efficient user+module lookups
CREATE INDEX IF NOT EXISTS idx_module_progress_user_module 
    ON public.module_progress(user_id, module_id);

-- Index for sorting by last accessed (useful for "continue where you left off" features)
CREATE INDEX IF NOT EXISTS idx_module_progress_last_accessed 
    ON public.module_progress(last_accessed DESC);

-- Index for module analytics (e.g., "how many users completed module X")
CREATE INDEX IF NOT EXISTS idx_module_progress_module_id 
    ON public.module_progress(module_id);

-- GIN index for JSONB queries on module_data
CREATE INDEX IF NOT EXISTS idx_module_progress_module_data 
    ON public.module_progress USING GIN (module_data);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS to ensure users can only access their own progress
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can INSERT their own progress records
CREATE POLICY "Users can insert own module progress" 
    ON public.module_progress 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can VIEW their own progress records
CREATE POLICY "Users can view own module progress" 
    ON public.module_progress 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Policy: Users can UPDATE their own progress records
CREATE POLICY "Users can update own module progress" 
    ON public.module_progress 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own progress records
CREATE POLICY "Users can delete own module progress" 
    ON public.module_progress 
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================
-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_module_progress_updated_at
    BEFORE UPDATE ON public.module_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. HELPER FUNCTIONS (Optional but useful)
-- =====================================================
-- Function to get or create module progress
CREATE OR REPLACE FUNCTION public.get_or_create_module_progress(
    p_user_id UUID,
    p_module_id TEXT,
    p_initial_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_progress_id UUID;
BEGIN
    -- Try to get existing progress
    SELECT id INTO v_progress_id
    FROM public.module_progress
    WHERE user_id = p_user_id AND module_id = p_module_id;
    
    -- If not found, create new progress record
    IF v_progress_id IS NULL THEN
        INSERT INTO public.module_progress (user_id, module_id, module_data)
        VALUES (p_user_id, p_module_id, p_initial_data)
        RETURNING id INTO v_progress_id;
    ELSE
        -- Update last_accessed for existing record
        UPDATE public.module_progress 
        SET last_accessed = NOW()
        WHERE id = v_progress_id;
    END IF;
    
    RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_module_progress TO authenticated;

-- =====================================================
-- ROLLBACK SECTION
-- =====================================================
-- To rollback this migration, run the following statements in order:

/*
-- Drop policies first (no dependencies)
DROP POLICY IF EXISTS "Users can delete own module progress" ON public.module_progress;
DROP POLICY IF EXISTS "Users can update own module progress" ON public.module_progress;
DROP POLICY IF EXISTS "Users can view own module progress" ON public.module_progress;
DROP POLICY IF EXISTS "Users can insert own module progress" ON public.module_progress;

-- Drop function permissions
REVOKE EXECUTE ON FUNCTION public.get_or_create_module_progress FROM authenticated;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.get_or_create_module_progress(UUID, TEXT, JSONB);

-- Drop triggers
DROP TRIGGER IF EXISTS update_module_progress_updated_at ON public.module_progress;

-- Drop trigger function (only if not used elsewhere)
-- DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_module_progress_module_data;
DROP INDEX IF EXISTS idx_module_progress_module_id;
DROP INDEX IF EXISTS idx_module_progress_last_accessed;
DROP INDEX IF EXISTS idx_module_progress_user_module;

-- Finally, drop the table
DROP TABLE IF EXISTS public.module_progress;
*/