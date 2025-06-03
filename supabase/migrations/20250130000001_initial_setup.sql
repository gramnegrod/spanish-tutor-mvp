-- Initial setup for Spanish Tutor MVP
-- Tables: conversations, progress, user_adaptations

-- 1. Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Practice Conversation',
  persona TEXT DEFAULT 'TAQUERO',
  transcript JSONB NOT NULL DEFAULT '[]',
  duration INTEGER DEFAULT 0, -- in seconds
  analysis JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Progress table
CREATE TABLE progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  vocabulary JSONB DEFAULT '[]',
  pronunciation INTEGER DEFAULT 0,
  grammar INTEGER DEFAULT 0,
  fluency INTEGER DEFAULT 0,
  cultural_knowledge INTEGER DEFAULT 0,
  total_minutes_practiced INTEGER DEFAULT 0,
  conversations_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User adaptations table (for future advanced features)
CREATE TABLE user_adaptations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  speaking_pace_preference FLOAT DEFAULT 1.0,
  needs_visual_aids BOOLEAN DEFAULT false,
  common_errors JSONB DEFAULT '[]',
  mastered_concepts JSONB DEFAULT '[]',
  struggle_areas JSONB DEFAULT '[]',
  learning_goals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_adaptations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for progress
CREATE POLICY "Users can view their own progress" ON progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON progress
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_adaptations
CREATE POLICY "Users can view their own adaptations" ON user_adaptations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adaptations" ON user_adaptations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adaptations" ON user_adaptations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX conversations_user_id_idx ON conversations(user_id);
CREATE INDEX conversations_created_at_idx ON conversations(created_at);
CREATE INDEX progress_user_id_idx ON progress(user_id);
CREATE INDEX user_adaptations_user_id_idx ON user_adaptations(user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_adaptations_updated_at BEFORE UPDATE ON user_adaptations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();