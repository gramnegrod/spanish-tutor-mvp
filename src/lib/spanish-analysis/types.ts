/**
 * Spanish Vocabulary Analysis Types
 * Mexican Spanish focused learning analytics
 */

// ============================================================================
// Core Analysis Types
// ============================================================================

export type SpanishLevel = 'beginner' | 'intermediate' | 'advanced'
export type FormalityLevel = 'tú' | 'usted' | 'mixed'
export type RegionalVariety = 'mexican' | 'neutral' | 'spain' | 'other'
export type MasteryLevel = 'introduced' | 'recognized' | 'used' | 'mastered'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

// ============================================================================
// Vocabulary Analysis Results
// ============================================================================

export interface AnalyzedWord {
  word: string
  translation?: string
  context: string // sentence where it appeared
  category: VocabularyCategory
  masteryLevel: MasteryLevel
  confidence: number // 0.0 to 1.0
  isMexicanSpecific: boolean
  formalityLevel?: FormalityLevel
  timestamp: string
}

export interface AnalyzedPhrase {
  phrase: string
  translation?: string
  context: string
  category: VocabularyCategory
  culturalSignificance: 'high' | 'medium' | 'low'
  isMexicanExpression: boolean
  timestamp: string
}

export interface GrammarPattern {
  type: GrammarType
  example: string
  isCorrect: boolean
  suggestion?: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
}

export interface CulturalMarker {
  type: CulturalType
  expression: string
  context: string
  authenticity: 'authentic_mexican' | 'neutral_spanish' | 'non_native'
  explanation?: string
}

// ============================================================================
// Analysis Categories
// ============================================================================

export type VocabularyCategory = 
  | 'food_ordering'
  | 'greetings_courtesy'
  | 'numbers_money'
  | 'descriptions_opinions'
  | 'mexican_expressions'
  | 'time_location'
  | 'questions_requests'
  | 'reactions_emotions'
  | 'family_relationships'
  | 'general_conversation'

export type GrammarType =
  | 'verb_conjugation'
  | 'gender_agreement'
  | 'formality_choice'
  | 'question_formation'
  | 'past_tense'
  | 'subjunctive'
  | 'ser_vs_estar'
  | 'direct_object_pronouns'

export type CulturalType =
  | 'mexican_slang'
  | 'formality_marker'
  | 'food_culture'
  | 'social_interaction'
  | 'regional_expression'
  | 'generational_marker'

export type StruggleType =
  | 'vocabulary_gap'
  | 'grammar_error'
  | 'pronunciation_issue'
  | 'cultural_misunderstanding'
  | 'formality_confusion'
  | 'comprehension_difficulty'

// ============================================================================
// Comprehensive Analysis Result
// ============================================================================

export interface SpanishConversationAnalysis {
  // Vocabulary tracking
  wordsUsed: AnalyzedWord[]
  wordsHeard: AnalyzedWord[]
  phrasesUsed: AnalyzedPhrase[]
  
  // Grammar analysis
  grammarPatterns: GrammarPattern[]
  correctUsage: GrammarPattern[]
  errorPatterns: GrammarPattern[]
  
  // Cultural authenticity
  culturalMarkers: CulturalMarker[]
  mexicanExpressions: string[]
  formalityConsistency: FormalityLevel
  
  // Learning insights
  strugglesDetected: StrugglePattern[]
  masterySignals: MasterySignal[]
  recommendedFocus: LearningRecommendation[]
  
  // Session metrics
  sessionMetrics: SessionMetrics
}

export interface StrugglePattern {
  type: StruggleType
  examples: string[]
  frequency: number
  severity: 'minor' | 'moderate' | 'major'
  suggestions: string[]
}

export interface MasterySignal {
  type: 'vocabulary' | 'grammar' | 'cultural' | 'fluency'
  evidence: string[]
  strength: 'emerging' | 'developing' | 'strong'
  category: VocabularyCategory | GrammarType | CulturalType
}

export interface LearningRecommendation {
  priority: 'high' | 'medium' | 'low'
  focus: string
  reason: string
  suggestedActivities: string[]
  estimatedSessions: number
}

export interface SessionMetrics {
  totalSpanishWords: number
  uniqueSpanishWords: number
  mexicanExpressionsUsed: number
  grammarErrorRate: number
  vocabularyUsageRate: number
  culturalAuthenticity: number // 0.0 to 1.0
  overallConfidence: number // 0.0 to 1.0
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface SpanishAnalyzerConfig {
  level: SpanishLevel
  focusScenario: string // 'taco_vendor', 'market', 'hotel', etc.
  regionalFocus: RegionalVariety
  strictness: 'permissive' | 'balanced' | 'strict'
  trackCulturalMarkers: boolean
  enableGrammarAnalysis: boolean
  enableMasteryTracking: boolean
}

export interface ScenarioVocabulary {
  essential: string[] // Must know for scenario success
  contextual: string[] // Helpful but not required
  cultural: string[] // Mexican-specific expressions
  formal: string[] // Formal/polite versions
  informal: string[] // Casual/friendly versions
}

// ============================================================================
// Raw Analysis Input Types
// ============================================================================

export interface ConversationTurn {
  role: 'user' | 'assistant'
  text: string
  timestamp: string
  confidence?: number // from speech recognition
}

export interface AnalysisContext {
  scenario: string
  learnerLevel: SpanishLevel
  conversationHistory: ConversationTurn[]
  previousMastery: string[] // known vocabulary
  strugglingAreas: string[] // current challenges
}

// ============================================================================
// Enhanced Database Integration Types
// ============================================================================

export interface VocabularyAnalysisResult {
  // For vocabulary_analysis JSONB column
  wordsUserUsed: Array<{
    word: string
    userSentence: string
    timestamp: string
    confidence: ConfidenceLevel
    category: VocabularyCategory
    isMexicanSpecific: boolean
  }>
  
  wordsUserHeard: Array<{
    word: string
    aiSentence: string
    timestamp: string
    userUnderstood?: boolean
    category: VocabularyCategory
  }>
  
  scenarioVocabulary: {
    essential: string[]
    contextual: string[]
    mexican: string[]
  }
  
  masteryMetrics: {
    vocabularyUsageRate: number
    newWordsIntroduced: number
    mexicanExpressionsUsed: number
    grammarAccuracy: number
  }
}

export interface StruggleAnalysisResult {
  // For struggle_analysis JSONB column
  overallDifficultyLevel: 'easy' | 'moderate' | 'challenging' | 'difficult'
  
  strugglesDetected: Array<{
    type: StruggleType
    content: string
    timestamp: string
    indicators: string[]
    severity: 'minor' | 'moderate' | 'major'
  }>
  
  positiveIndicators: Array<{
    type: string
    content: string
    evidence: string
  }>
  
  recommendedFollowUp: string[]
  culturalNotes: string[]
}