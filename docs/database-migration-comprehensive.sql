-- Comprehensive Database Schema Migration
-- Spanish Tutor MVP - Foundational Vocabulary & Struggle Tracking
-- Safe additive migration - no breaking changes to existing code

-- ============================================================================
-- PHASE 1: Enhance Existing Tables (Additive Only)
-- ============================================================================

-- Add vocabulary and struggle analysis to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS vocabulary_analysis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS struggle_analysis JSONB DEFAULT '{}';

-- Add vocabulary stats and learning velocity to progress
ALTER TABLE progress
ADD COLUMN IF NOT EXISTS vocabulary_stats JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_velocity JSONB DEFAULT '{}';

-- Comment existing tables for clarity
COMMENT ON TABLE conversations IS 'User conversation sessions with AI tutors. Enhanced with vocabulary and struggle analysis.';
COMMENT ON TABLE progress IS 'User learning progress tracking. Enhanced with detailed vocabulary statistics and learning velocity metrics.';
COMMENT ON TABLE user_adaptations IS 'User personalization preferences and learning adaptations.';

-- ============================================================================
-- PHASE 2: Create New Vocabulary Tracking Tables
-- ============================================================================

-- Core vocabulary learning lifecycle tracking
CREATE TABLE IF NOT EXISTS vocabulary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT,
  
  -- Learning lifecycle
  first_encountered_at TIMESTAMPTZ NOT NULL,
  first_used_at TIMESTAMPTZ,
  mastery_level TEXT DEFAULT 'introduced' CHECK (mastery_level IN ('introduced', 'recognized', 'used', 'mastered')),
  confidence_score REAL DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  
  -- Context tracking
  first_encountered_scenario TEXT,  -- 'pharmacy', 'restaurant', etc.
  first_encountered_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  first_usage_context TEXT,  -- actual sentence where first used
  
  -- Spaced repetition system
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_interval_days INTEGER DEFAULT 1 CHECK (review_interval_days > 0),
  times_reviewed INTEGER DEFAULT 0 CHECK (times_reviewed >= 0),
  times_used_successfully INTEGER DEFAULT 0 CHECK (times_used_successfully >= 0),
  times_struggled_with INTEGER DEFAULT 0 CHECK (times_struggled_with >= 0),
  
  -- Struggle details (JSONB for flexibility)
  struggle_details JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id, word),
  CHECK (first_used_at IS NULL OR first_used_at >= first_encountered_at)
);

-- Detailed log of every vocabulary interaction
CREATE TABLE IF NOT EXISTS vocabulary_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_entry_id UUID REFERENCES vocabulary_entries(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Usage details
  usage_type TEXT NOT NULL CHECK (usage_type IN ('heard', 'used', 'struggled', 'avoided', 'mastered')),
  user_sentence TEXT,  -- what user actually said
  ai_sentence TEXT,    -- what AI said (if user heard it)
  scenario TEXT NOT NULL,  -- 'pharmacy', 'restaurant', etc.
  
  -- Performance metrics
  was_successful BOOLEAN DEFAULT true,
  hesitation_detected BOOLEAN DEFAULT false,
  required_help BOOLEAN DEFAULT false,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Context
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes for performance
  CHECK (user_sentence IS NOT NULL OR ai_sentence IS NOT NULL)
);

-- ============================================================================
-- PHASE 3: Create Struggle Tracking Tables
-- ============================================================================

-- Detailed tracking of learning difficulties
CREATE TABLE IF NOT EXISTS learning_difficulties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Difficulty classification
  difficulty_type TEXT NOT NULL CHECK (difficulty_type IN (
    'vocabulary', 'grammar', 'pronunciation', 'comprehension', 
    'fluency', 'cultural', 'conversation_flow', 'confidence'
  )),
  difficulty_subtype TEXT,  -- 'past_tense', 'formal_address', 'rolled_r', 'question_formation'
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'blocking')),
  
  -- Context details
  scenario TEXT NOT NULL,  -- 'pharmacy', 'restaurant'
  specific_content TEXT,   -- exact word/phrase/sentence that caused trouble
  user_attempt TEXT,      -- what user actually said/tried
  correct_form TEXT,      -- what should have been said
  ai_response TEXT,       -- how AI responded to the error
  
  -- Struggle indicators
  hesitation_duration_ms INTEGER CHECK (hesitation_duration_ms >= 0),
  required_ai_help BOOLEAN DEFAULT false,
  user_gave_up BOOLEAN DEFAULT false,
  repeated_same_error BOOLEAN DEFAULT false,
  avoided_structure BOOLEAN DEFAULT false,  -- didn't attempt at all
  
  -- Learning context
  is_new_concept BOOLEAN DEFAULT false,     -- first time encountering this
  previous_attempts INTEGER DEFAULT 0 CHECK (previous_attempts >= 0),
  days_since_last_struggle INTEGER CHECK (days_since_last_struggle >= 0),
  user_confidence_self_rating INTEGER CHECK (user_confidence_self_rating BETWEEN 1 AND 5),
  
  -- Resolution tracking
  was_resolved_in_session BOOLEAN DEFAULT false,
  resolution_method TEXT CHECK (resolution_method IN (
    'ai_explanation', 'repetition', 'code_switching', 'skipped', 'time_helped'
  )),
  minutes_to_resolution INTEGER CHECK (minutes_to_resolution >= 0),
  
  -- Metadata
  detected_automatically BOOLEAN DEFAULT true,  -- vs manually flagged
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pattern recognition for recurring struggles
CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pattern identification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'recurring_grammar_error', 'vocabulary_avoidance', 'pronunciation_weakness',
    'comprehension_gap', 'fluency_block', 'cultural_confusion', 'confidence_issue'
  )),
  pattern_description TEXT NOT NULL,    -- 'avoids past tense', 'struggles with rr sound'
  confidence_level REAL DEFAULT 0.0 CHECK (confidence_level >= 0.0 AND confidence_level <= 1.0),
  
  -- Pattern details
  affected_content JSONB DEFAULT '{}',              -- specific words/structures involved
  scenarios_affected TEXT[] DEFAULT '{}',           -- which scenarios show this pattern
  frequency_per_conversation REAL DEFAULT 0.0,     -- how often this appears
  severity_trend TEXT CHECK (severity_trend IN ('improving', 'stable', 'worsening')),
  
  -- Evidence tracking
  supporting_difficulties UUID[] DEFAULT '{}',      -- references to learning_difficulties
  first_detected_at TIMESTAMPTZ NOT NULL,
  last_observed_at TIMESTAMPTZ NOT NULL,
  total_occurrences INTEGER DEFAULT 0 CHECK (total_occurrences >= 0),
  
  -- Intervention tracking
  interventions_attempted JSONB DEFAULT '[]',  -- what we've tried to fix this
  most_effective_intervention TEXT,
  intervention_success_rate REAL CHECK (intervention_success_rate >= 0.0 AND intervention_success_rate <= 1.0),
  
  -- Status
  pattern_status TEXT DEFAULT 'active' CHECK (pattern_status IN (
    'active', 'improving', 'resolved', 'persistent', 'monitoring'
  )),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CHECK (last_observed_at >= first_detected_at)
);

-- Smart remediation planning
CREATE TABLE IF NOT EXISTS remediation_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What needs work
  target_skill TEXT NOT NULL,           -- 'past_tense_formation', 'pharmacy_vocabulary'
  skill_category TEXT NOT NULL CHECK (skill_category IN (
    'vocabulary', 'grammar', 'pronunciation', 'comprehension', 'fluency', 'cultural'
  )),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  priority_score REAL NOT NULL CHECK (priority_score >= 0.0 AND priority_score <= 1.0),
  
  -- Supporting evidence
  related_patterns UUID[] DEFAULT '{}',              -- references to learning_patterns
  related_difficulties UUID[] DEFAULT '{}',          -- recent struggles
  performance_trend TEXT CHECK (performance_trend IN ('declining', 'stable', 'improving_slowly')),
  
  -- Recommended interventions
  suggested_activities JSONB DEFAULT '{}',           -- specific practice recommendations
  optimal_scenarios TEXT[] DEFAULT '{}',             -- which scenarios to use for practice
  estimated_sessions_needed INTEGER CHECK (estimated_sessions_needed > 0),
  
  -- Scheduling
  recommended_review_frequency TEXT CHECK (recommended_review_frequency IN (
    'daily', 'every_2_days', 'every_3_days', 'weekly', 'biweekly'
  )),
  next_review_due TIMESTAMPTZ,
  last_addressed_at TIMESTAMPTZ,
  
  -- Progress tracking
  intervention_attempts INTEGER DEFAULT 0 CHECK (intervention_attempts >= 0),
  success_rate REAL DEFAULT 0.0 CHECK (success_rate >= 0.0 AND success_rate <= 1.0),
  status TEXT DEFAULT 'identified' CHECK (status IN (
    'identified', 'addressing', 'improving', 'resolved', 'monitoring'
  )),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PHASE 4: Create Indexes for Performance
-- ============================================================================

-- Vocabulary entries indexes
CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_user_mastery 
ON vocabulary_entries(user_id, mastery_level);

CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_next_review 
ON vocabulary_entries(user_id, next_review_at) 
WHERE next_review_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_scenario 
ON vocabulary_entries(user_id, first_encountered_scenario);

-- Vocabulary usage log indexes
CREATE INDEX IF NOT EXISTS idx_vocabulary_usage_log_user_time 
ON vocabulary_usage_log(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vocabulary_usage_log_conversation 
ON vocabulary_usage_log(conversation_id);

CREATE INDEX IF NOT EXISTS idx_vocabulary_usage_log_entry 
ON vocabulary_usage_log(vocabulary_entry_id, timestamp DESC);

-- Learning difficulties indexes
CREATE INDEX IF NOT EXISTS idx_learning_difficulties_user_time 
ON learning_difficulties(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_learning_difficulties_type_severity 
ON learning_difficulties(user_id, difficulty_type, severity);

CREATE INDEX IF NOT EXISTS idx_learning_difficulties_scenario 
ON learning_difficulties(user_id, scenario, timestamp DESC);

-- Learning patterns indexes
CREATE INDEX IF NOT EXISTS idx_learning_patterns_user_status 
ON learning_patterns(user_id, pattern_status);

CREATE INDEX IF NOT EXISTS idx_learning_patterns_type 
ON learning_patterns(user_id, pattern_type);

-- Remediation opportunities indexes
CREATE INDEX IF NOT EXISTS idx_remediation_opportunities_user_priority 
ON remediation_opportunities(user_id, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_remediation_opportunities_next_review 
ON remediation_opportunities(user_id, next_review_due) 
WHERE next_review_due IS NOT NULL;

-- ============================================================================
-- PHASE 5: Row Level Security Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE vocabulary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_difficulties ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_opportunities ENABLE ROW LEVEL SECURITY;

-- Vocabulary entries policies
CREATE POLICY "Users can manage their own vocabulary entries" ON vocabulary_entries
FOR ALL USING (auth.uid() = user_id);

-- Vocabulary usage log policies
CREATE POLICY "Users can manage their own vocabulary usage logs" ON vocabulary_usage_log
FOR ALL USING (auth.uid() = user_id);

-- Learning difficulties policies
CREATE POLICY "Users can manage their own learning difficulties" ON learning_difficulties
FOR ALL USING (auth.uid() = user_id);

-- Learning patterns policies
CREATE POLICY "Users can manage their own learning patterns" ON learning_patterns
FOR ALL USING (auth.uid() = user_id);

-- Remediation opportunities policies
CREATE POLICY "Users can manage their own remediation opportunities" ON remediation_opportunities
FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PHASE 6: Helpful Functions
-- ============================================================================

-- Function to update vocabulary entry updated_at timestamp
CREATE OR REPLACE FUNCTION update_vocabulary_entry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vocabulary entries
DROP TRIGGER IF EXISTS trigger_vocabulary_entries_updated_at ON vocabulary_entries;
CREATE TRIGGER trigger_vocabulary_entries_updated_at
  BEFORE UPDATE ON vocabulary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_vocabulary_entry_updated_at();

-- Function to update learning patterns updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for learning patterns
DROP TRIGGER IF EXISTS trigger_learning_patterns_updated_at ON learning_patterns;
CREATE TRIGGER trigger_learning_patterns_updated_at
  BEFORE UPDATE ON learning_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_patterns_updated_at();

-- Function to update remediation opportunities updated_at timestamp
CREATE OR REPLACE FUNCTION update_remediation_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for remediation opportunities
DROP TRIGGER IF EXISTS trigger_remediation_opportunities_updated_at ON remediation_opportunities;
CREATE TRIGGER trigger_remediation_opportunities_updated_at
  BEFORE UPDATE ON remediation_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_remediation_opportunities_updated_at();

-- ============================================================================
-- PHASE 7: Comments for Documentation
-- ============================================================================

-- Table comments
COMMENT ON TABLE vocabulary_entries IS 'Tracks individual vocabulary words through learning lifecycle from introduction to mastery';
COMMENT ON TABLE vocabulary_usage_log IS 'Detailed log of every vocabulary interaction during conversations';
COMMENT ON TABLE learning_difficulties IS 'Captures specific learning struggles and difficulties encountered by users';
COMMENT ON TABLE learning_patterns IS 'Identifies recurring patterns in user learning struggles and strengths';
COMMENT ON TABLE remediation_opportunities IS 'Tracks areas that need targeted practice and improvement';

-- Column comments for key fields
COMMENT ON COLUMN vocabulary_entries.mastery_level IS 'Learning progression: introduced → recognized → used → mastered';
COMMENT ON COLUMN vocabulary_entries.confidence_score IS 'User confidence with this word (0.0 to 1.0)';
COMMENT ON COLUMN vocabulary_entries.struggle_details IS 'JSONB storing detailed struggle information for this word';

COMMENT ON COLUMN learning_difficulties.severity IS 'Impact level: minor → moderate → major → blocking';
COMMENT ON COLUMN learning_difficulties.detected_automatically IS 'Whether struggle was detected by AI vs manually flagged';

COMMENT ON COLUMN learning_patterns.confidence_level IS 'How confident we are this is a real pattern (0.0 to 1.0)';
COMMENT ON COLUMN learning_patterns.pattern_status IS 'Current state: active → improving → resolved';

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- Verify tables were created
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'conversations', 'progress', 'user_adaptations',
    'vocabulary_entries', 'vocabulary_usage_log', 
    'learning_difficulties', 'learning_patterns', 
    'remediation_opportunities'
  )
ORDER BY table_name;