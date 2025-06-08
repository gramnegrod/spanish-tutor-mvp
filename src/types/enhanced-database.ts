/**
 * Enhanced Database Types for Comprehensive Vocabulary & Struggle Tracking
 * Spanish Tutor MVP - Foundational Schema
 */

import { ConversationTranscript } from './index'

// ============================================================================
// Enhanced Existing Types
// ============================================================================

export interface EnhancedConversation {
  id: string
  user_id: string
  title: string
  persona: string
  transcript: ConversationTranscript[]
  duration: number
  analysis?: any
  vocabulary_analysis: VocabularyAnalysis
  struggle_analysis: StruggleAnalysis
  created_at: string
  updated_at: string
}

export interface EnhancedProgress {
  id: string
  user_id: string
  vocabulary: string[]
  pronunciation: number
  grammar: number
  fluency: number
  cultural_knowledge: number
  total_minutes_practiced: number
  conversations_completed: number
  vocabulary_stats: VocabularyStats
  learning_velocity: LearningVelocity
  created_at: string
  updated_at: string
}

// ============================================================================
// Vocabulary Tracking Types
// ============================================================================

export type MasteryLevel = 'introduced' | 'recognized' | 'used' | 'mastered'
export type UsageType = 'heard' | 'used' | 'struggled' | 'avoided' | 'mastered'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface VocabularyEntry {
  id: string
  user_id: string
  word: string
  translation?: string
  
  // Learning lifecycle
  first_encountered_at: string
  first_used_at?: string
  mastery_level: MasteryLevel
  confidence_score: number // 0.0 to 1.0
  
  // Context tracking
  first_encountered_scenario?: string
  first_encountered_conversation_id?: string
  first_usage_context?: string
  
  // Spaced repetition
  last_reviewed_at?: string
  next_review_at?: string
  review_interval_days: number
  times_reviewed: number
  times_used_successfully: number
  times_struggled_with: number
  
  // Struggle details
  struggle_details: VocabularyStruggleDetails
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface VocabularyUsageLog {
  id: string
  user_id: string
  vocabulary_entry_id: string
  conversation_id?: string
  
  // Usage details
  usage_type: UsageType
  user_sentence?: string
  ai_sentence?: string
  scenario: string
  
  // Performance
  was_successful: boolean
  hesitation_detected: boolean
  required_help: boolean
  confidence_level?: ConfidenceLevel
  
  // Context
  timestamp: string
  created_at: string
}

// ============================================================================
// Struggle Tracking Types
// ============================================================================

export type DifficultyType = 
  | 'vocabulary' 
  | 'grammar' 
  | 'pronunciation' 
  | 'comprehension' 
  | 'fluency' 
  | 'cultural' 
  | 'conversation_flow'
  | 'confidence'

export type Severity = 'minor' | 'moderate' | 'major' | 'blocking'
export type ResolutionMethod = 'ai_explanation' | 'repetition' | 'code_switching' | 'skipped' | 'time_helped'

export interface LearningDifficulty {
  id: string
  user_id: string
  conversation_id?: string
  
  // Classification
  difficulty_type: DifficultyType
  difficulty_subtype?: string
  severity: Severity
  
  // Context
  scenario: string
  specific_content?: string
  user_attempt?: string
  correct_form?: string
  ai_response?: string
  
  // Struggle indicators
  hesitation_duration_ms?: number
  required_ai_help: boolean
  user_gave_up: boolean
  repeated_same_error: boolean
  avoided_structure: boolean
  
  // Learning context
  is_new_concept: boolean
  previous_attempts: number
  days_since_last_struggle?: number
  user_confidence_self_rating?: number // 1-5
  
  // Resolution
  was_resolved_in_session: boolean
  resolution_method?: ResolutionMethod
  minutes_to_resolution?: number
  
  // Metadata
  detected_automatically: boolean
  timestamp: string
  created_at: string
}

export type PatternType = 
  | 'recurring_grammar_error'
  | 'vocabulary_avoidance' 
  | 'pronunciation_weakness'
  | 'comprehension_gap'
  | 'fluency_block'
  | 'cultural_confusion'
  | 'confidence_issue'

export type SeverityTrend = 'improving' | 'stable' | 'worsening'
export type PatternStatus = 'active' | 'improving' | 'resolved' | 'persistent' | 'monitoring'

export interface LearningPattern {
  id: string
  user_id: string
  
  // Pattern identification
  pattern_type: PatternType
  pattern_description: string
  confidence_level: number // 0.0 to 1.0
  
  // Pattern details
  affected_content: Record<string, any>
  scenarios_affected: string[]
  frequency_per_conversation: number
  severity_trend?: SeverityTrend
  
  // Evidence
  supporting_difficulties: string[] // UUIDs
  first_detected_at: string
  last_observed_at: string
  total_occurrences: number
  
  // Intervention tracking
  interventions_attempted: any[]
  most_effective_intervention?: string
  intervention_success_rate?: number
  
  // Status
  pattern_status: PatternStatus
  
  // Metadata
  created_at: string
  updated_at: string
}

export type SkillCategory = 'vocabulary' | 'grammar' | 'pronunciation' | 'comprehension' | 'fluency' | 'cultural'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type ReviewFrequency = 'daily' | 'every_2_days' | 'every_3_days' | 'weekly' | 'biweekly'
export type RemediationStatus = 'identified' | 'addressing' | 'improving' | 'resolved' | 'monitoring'

export interface RemediationOpportunity {
  id: string
  user_id: string
  
  // What needs work
  target_skill: string
  skill_category: SkillCategory
  difficulty_level: DifficultyLevel
  priority_score: number // 0.0 to 1.0
  
  // Evidence
  related_patterns: string[] // UUIDs
  related_difficulties: string[] // UUIDs
  performance_trend?: 'declining' | 'stable' | 'improving_slowly'
  
  // Recommendations
  suggested_activities: Record<string, any>
  optimal_scenarios: string[]
  estimated_sessions_needed?: number
  
  // Scheduling
  recommended_review_frequency?: ReviewFrequency
  next_review_due?: string
  last_addressed_at?: string
  
  // Progress
  intervention_attempts: number
  success_rate: number
  status: RemediationStatus
  
  // Metadata
  created_at: string
  updated_at: string
}

// ============================================================================
// Analysis Types (JSONB Column Structures)
// ============================================================================

export interface VocabularyAnalysis {
  wordsUserUsed: Array<{
    word: string
    userSentence: string
    timestamp: string
    confidence: 'low' | 'medium' | 'high'
  }>
  wordsUserHeard: Array<{
    word: string
    aiSentence: string
    timestamp: string
    userUnderstood?: boolean
  }>
  scenarioVocabulary: {
    essential: string[]
    contextual: string[]
  }
  masteryMetrics: {
    vocabularyUsageRate: number // 0.0 to 1.0
    newWordsIntroduced: number
    wordsReinforcedFromPrevious: number
  }
}

export interface StruggleAnalysis {
  overallDifficultyLevel: 'easy' | 'moderate' | 'challenging' | 'difficult'
  strugglesDetected: Array<{
    type: DifficultyType
    content: string
    timestamp: string
    indicators: string[]
    severity: Severity
  }>
  positiveIndicators: Array<{
    type: string
    content: string
    evidence: string
  }>
  recommendedFollowUp: string[]
}

export interface VocabularyStruggleDetails {
  commonErrors: Array<{
    incorrectUsage: string
    correctUsage: string
    errorType: string
    frequency: number
    lastOccurrence: string
  }>
  pronunciationIssues: Array<{
    problematicSound: string
    severity: Severity
    improvementTrend: SeverityTrend
  }>
  contextualStruggles: Array<{
    scenario: string
    issue: string
    description: string
  }>
  avoidanceBehavior: {
    avoidsInComplexSentences: boolean
    substitutesWithEnglish: boolean
    skipsWhenUncertain: boolean
  }
}

export interface VocabularyStats {
  totalWordsEncountered: number
  totalWordsUsed: number
  totalWordsMastered: number
  wordsIntroducedThisWeek: number
  averageWordsPerConversation: number
  strongestCategory: string
  weakestCategory: string
  masteryByScenario: Record<string, number>
}

export interface LearningVelocity {
  wordsLearnedPerWeek: number[]
  averageTimeToMastery: number // days
  retentionRate: number // 0.0 to 1.0
  optimalReviewInterval: number // days
  learningAcceleration: number // rate of improvement
}

// ============================================================================
// Service Interface Types
// ============================================================================

export interface VocabularyAnalysisResult {
  wordsUsed: string[]
  wordsHeard: string[]
  newWords: string[]
  struggledWords: string[]
  masteredWords: string[]
}

export interface StruggleDetectionResult {
  difficulties: Omit<LearningDifficulty, 'id' | 'user_id' | 'created_at'>[]
  patterns: string[] // pattern types detected
  severity: Severity
  recommendedActions: string[]
}

export interface VocabularyReviewData {
  wordsToReview: VocabularyEntry[]
  strugglingWords: VocabularyEntry[]
  masteredWords: VocabularyEntry[]
  newWordsFromConversation: string[]
  recommendedPractice: RemediationOpportunity[]
}

// ============================================================================
// Database Service Types
// ============================================================================

export interface CreateVocabularyEntryData {
  user_id: string
  word: string
  translation?: string
  first_encountered_scenario?: string
  first_encountered_conversation_id?: string
  first_usage_context?: string
}

export interface LogVocabularyUsageData {
  user_id: string
  vocabulary_entry_id: string
  conversation_id?: string
  usage_type: UsageType
  user_sentence?: string
  ai_sentence?: string
  scenario: string
  was_successful: boolean
  hesitation_detected?: boolean
  required_help?: boolean
  confidence_level?: ConfidenceLevel
  timestamp: string
}

export interface CreateLearningDifficultyData {
  user_id: string
  conversation_id?: string
  difficulty_type: DifficultyType
  difficulty_subtype?: string
  severity: Severity
  scenario: string
  specific_content?: string
  user_attempt?: string
  correct_form?: string
  timestamp: string
}

export interface CreateLearningPatternData {
  user_id: string
  pattern_type: PatternType
  pattern_description: string
  affected_content: Record<string, any>
  scenarios_affected: string[]
  supporting_difficulties: string[]
}

export interface CreateRemediationOpportunityData {
  user_id: string
  target_skill: string
  skill_category: SkillCategory
  difficulty_level: DifficultyLevel
  priority_score: number
  related_patterns?: string[]
  related_difficulties?: string[]
  suggested_activities: Record<string, any>
  optimal_scenarios: string[]
  estimated_sessions_needed?: number
}