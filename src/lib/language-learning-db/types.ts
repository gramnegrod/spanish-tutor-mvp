/**
 * Language Learning Database - Universal Types
 * 
 * Framework-agnostic types for language learning applications.
 * Designed to be extracted as an NPM package.
 */

// ============================================================================
// Core Types
// ============================================================================

export interface User {
  id: string
  email?: string
  [key: string]: any // Allow additional user properties
}

export interface ConversationTranscript {
  id: string
  speaker: 'user' | 'assistant' | 'system'
  text: string
  timestamp: Date | string
  metadata?: Record<string, any>
}

// ============================================================================
// Conversation Management
// ============================================================================

export interface ConversationData {
  title: string
  persona?: string // AI character name (e.g., "Don Roberto")
  transcript: ConversationTranscript[]
  duration: number // seconds
  language: string // ISO code (e.g., 'es', 'fr', 'de')
  scenario?: string // learning scenario (e.g., 'taco_vendor', 'hotel_checkin')
  analysis?: ConversationAnalysis // Spanish analysis data
  metadata?: Record<string, any>
}

export interface ConversationAnalysis {
  vocabularyUsed: string[]
  grammarPatterns: string[]
  culturalMarkers: string[]
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  engagement: number // 0-1 score
  comprehension: number // 0-1 score
  fluency: number // 0-1 score
  [key: string]: any // Allow custom analysis fields
}

export interface Conversation extends ConversationData {
  id: string
  userId: string
  analysis?: ConversationAnalysis
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// Progress Tracking
// ============================================================================

export interface VocabularyProgress {
  word: string
  language: string
  timesEncountered: number
  timesUsed: number
  masteryLevel: 'learning' | 'practicing' | 'mastered'
  lastEncountered: Date | string
  context?: string // scenario where learned
}

export interface SkillProgress {
  skill: 'listening' | 'speaking' | 'reading' | 'writing' | 'grammar' | 'vocabulary' | 'pronunciation'
  level: number // 0-100
  trend: 'improving' | 'stable' | 'declining'
  lastUpdated: Date | string
}

export interface UserProgress {
  userId: string
  language: string
  overallLevel: 'beginner' | 'intermediate' | 'advanced'
  totalMinutesPracticed: number
  conversationsCompleted: number
  vocabulary: VocabularyProgress[]
  skills: SkillProgress[]
  streak: number // consecutive days
  lastActive: Date | string
  achievements: string[]
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// Learner Profiles & Adaptation
// ============================================================================

export interface LearnerProfile {
  userId: string
  language: string
  level: 'beginner' | 'intermediate' | 'advanced'
  goals: string[] // e.g., ['travel', 'business', 'academic']
  preferences: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
    pace: 'slow' | 'normal' | 'fast'
    supportLevel: 'minimal' | 'moderate' | 'heavy'
    culturalContext: boolean // include cultural learning
  }
  strugglingAreas: string[]
  masteredConcepts: string[]
  commonErrors: string[]
  adaptations: Record<string, any>
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// Analytics & Metrics
// ============================================================================

export interface LearningSession {
  id: string
  userId: string
  conversationId?: string
  type: 'conversation' | 'exercise' | 'review' | 'assessment'
  duration: number // seconds
  language: string
  scenario?: string
  metricsCollected: SessionMetrics
  startedAt: Date | string
  completedAt: Date | string
}

export interface SessionMetrics {
  wordsSpoken: number
  averageConfidence: number
  mistakeCount: number
  helpRequests: number
  completionRate: number
  engagementScore: number
  [key: string]: any // Allow custom metrics
}

// ============================================================================
// Query & Filter Types
// ============================================================================

export interface ConversationQuery {
  userId?: string
  language?: string
  scenario?: string
  dateRange?: {
    start: Date | string
    end: Date | string
  }
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'duration' | 'analysis.engagement'
  sortOrder?: 'asc' | 'desc'
}

export interface ProgressQuery {
  userId: string
  language?: string
  timeframe?: 'week' | 'month' | 'quarter' | 'year' | 'all'
  skills?: SkillProgress['skill'][]
}

// ============================================================================
// Storage Adapter Interface
// ============================================================================

export interface StorageAdapter {
  // Conversation operations
  saveConversation(data: ConversationData, userId: string): Promise<Conversation>
  getConversations(query: ConversationQuery): Promise<Conversation[]>
  getConversation(id: string): Promise<Conversation | null>
  updateConversation(id: string, updates: Partial<ConversationData>): Promise<Conversation>
  deleteConversation(id: string): Promise<boolean>

  // Progress operations
  getProgress(userId: string, language: string): Promise<UserProgress | null>
  updateProgress(userId: string, language: string, updates: Partial<UserProgress>): Promise<UserProgress>
  trackVocabulary(userId: string, language: string, words: VocabularyProgress[]): Promise<void>

  // Profile operations
  getProfile(userId: string, language: string): Promise<LearnerProfile | null>
  saveProfile(profile: LearnerProfile): Promise<LearnerProfile>
  updateProfile(userId: string, language: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile>

  // Analytics operations
  saveSession(session: LearningSession): Promise<LearningSession>
  getSessionMetrics(query: ProgressQuery): Promise<SessionMetrics[]>

  // Utility operations
  health(): Promise<boolean>
  migrate?(version: string): Promise<void>
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface DatabaseConfig {
  adapter: 'supabase' | 'firebase' | 'prisma' | 'localStorage' | 'memory'
  connection?: {
    url?: string
    apiKey?: string
    projectId?: string
    [key: string]: any
  }
  options?: {
    enableCaching?: boolean
    cacheSize?: number
    enableCompression?: boolean
    enableEncryption?: boolean
    migrationMode?: 'auto' | 'manual'
  }
}

export interface LanguageLearningDBConfig {
  database: DatabaseConfig
  features?: {
    enableAnalytics?: boolean
    enableRealtimeSync?: boolean
    enableOfflineMode?: boolean
    enableBackup?: boolean
  }
  validation?: {
    strictMode?: boolean
    enableSchemaValidation?: boolean
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class LanguageLearningDBError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'LanguageLearningDBError'
  }
}

export class ValidationError extends LanguageLearningDBError {
  constructor(message: string, field: string, value: any) {
    super(message, 'VALIDATION_ERROR', { field, value })
  }
}

export class StorageError extends LanguageLearningDBError {
  constructor(message: string, operation: string, details?: any) {
    super(message, 'STORAGE_ERROR', { operation, ...details })
  }
}

export class ConfigurationError extends LanguageLearningDBError {
  constructor(message: string, config?: any) {
    super(message, 'CONFIGURATION_ERROR', { config })
  }
}