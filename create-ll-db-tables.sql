-- Language Learning Database Tables
-- Run this in your Supabase SQL Editor

-- 1. Learner Profiles Table
CREATE TABLE IF NOT EXISTS public.learner_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    language TEXT NOT NULL DEFAULT 'es',
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferences JSONB DEFAULT '{
        "learningStyle": "mixed",
        "pace": "normal", 
        "supportLevel": "moderate",
        "culturalContext": true
    }'::JSONB,
    struggling_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
    mastered_concepts TEXT[] DEFAULT ARRAY[]::TEXT[],
    common_errors TEXT[] DEFAULT ARRAY[]::TEXT[],
    adaptations JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, language)
);

-- 2. Conversations Table  
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    persona TEXT,
    transcript JSONB NOT NULL DEFAULT '[]'::JSONB,
    duration INTEGER DEFAULT 0,
    language TEXT DEFAULT 'es',
    scenario TEXT,
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Progress Table
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    language TEXT NOT NULL DEFAULT 'es',
    overall_level TEXT CHECK (overall_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    total_minutes_practiced INTEGER DEFAULT 0,
    conversations_completed INTEGER DEFAULT 0,
    vocabulary JSONB DEFAULT '[]'::JSONB,
    skills JSONB DEFAULT '[]'::JSONB,
    streak INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    achievements TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, language)
);

-- 4. Create RLS (Row Level Security) Policies
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access their own data
CREATE POLICY "Users can view own profiles" ON public.learner_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profiles" ON public.learner_profiles  
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profiles" ON public.learner_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own progress" ON public.user_progress  
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress" ON public.user_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON public.user_progress
    FOR UPDATE USING (user_id = auth.uid());

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_language ON public.learner_profiles(user_id, language);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_language ON public.user_progress(user_id, language);