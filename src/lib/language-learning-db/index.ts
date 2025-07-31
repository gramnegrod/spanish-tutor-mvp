/**
 * Language Learning Database
 * 
 * A universal, framework-agnostic database abstraction for language learning applications.
 * Designed to be extracted as an NPM package.
 * 
 * @version 1.0.0
 * @author Your Organization
 * @license MIT
 */

// ============================================================================
// Main Exports
// ============================================================================

export { LanguageLearningDB } from './LanguageLearningDB'

// ============================================================================
// Service Exports
// ============================================================================

export { ConversationService } from './services/ConversationService'
export { ProgressService } from './services/ProgressService'
export { ProfileService } from './services/ProfileService'
export { AnalyticsService } from './services/AnalyticsService'
export { ModuleService } from './services/ModuleService'

// ============================================================================
// Adapter Exports
// ============================================================================

export { SupabaseAdapter } from './adapters/SupabaseAdapter'
export { LocalStorageAdapter } from './adapters/LocalStorageAdapter'
export { MemoryAdapter } from './adapters/MemoryAdapter'

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Core Types
  User,
  ConversationTranscript,
  
  // Conversation Types
  ConversationData,
  ConversationAnalysis,
  Conversation,
  ConversationQuery,
  
  // Progress Types
  VocabularyProgress,
  SkillProgress,
  UserProgress,
  ProgressQuery,
  
  // Profile Types
  LearnerProfile,
  
  // Analytics Types
  LearningSession,
  SessionMetrics,
  
  // Configuration Types
  DatabaseConfig,
  LanguageLearningDBConfig,
  StorageAdapter,
  
  // Error Types
  LanguageLearningDBError,
  ValidationError,
  StorageError,
  ConfigurationError
} from './types'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a language learning database instance with automatic adapter detection
 */
export function createLanguageLearningDB(config: {
  backend: 'supabase' | 'firebase' | 'localStorage' | 'memory'
  connection?: any
  options?: any
}): LanguageLearningDB {
  const { LanguageLearningDB } = require('./LanguageLearningDB')
  
  const dbConfig = {
    database: {
      adapter: config.backend,
      connection: config.connection,
      options: config.options
    },
    features: {
      enableAnalytics: config.backend !== 'localStorage',
      enableRealtimeSync: ['supabase', 'firebase'].includes(config.backend),
      enableOfflineMode: config.backend === 'localStorage'
    }
  }

  return new LanguageLearningDB(dbConfig)
}

/**
 * Quick setup for Supabase backend
 */
export function createSupabaseDB(supabaseUrl: string, supabaseKey: string): LanguageLearningDB {
  const { LanguageLearningDB } = require('./LanguageLearningDB')
  return LanguageLearningDB.createWithSupabase({
    url: supabaseUrl,
    apiKey: supabaseKey
  })
}

/**
 * Quick setup for localStorage (guest mode)
 */
export function createGuestDB(): LanguageLearningDB {
  const { LanguageLearningDB } = require('./LanguageLearningDB')
  return LanguageLearningDB.createWithLocalStorage()
}

/**
 * Quick setup for development/testing
 */
export function createMemoryDB(): LanguageLearningDB {
  const { LanguageLearningDB } = require('./LanguageLearningDB')
  return LanguageLearningDB.createInMemory()
}

// ============================================================================
// Version Information
// ============================================================================

export const VERSION = '1.0.0'
export const SUPPORTED_ADAPTERS = ['supabase', 'firebase', 'localStorage', 'memory'] as const
export const SUPPORTED_LANGUAGES = ['es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'] as const

// ============================================================================
// Migration Utilities (Future NPM Package Features)
// ============================================================================

/**
 * Migrate data between different storage backends
 * @experimental - Will be implemented in future versions
 */
export async function migrateData(
  from: LanguageLearningDB,
  to: LanguageLearningDB,
  options?: {
    userId?: string
    language?: string
    includeAnalytics?: boolean
  }
): Promise<{
  conversations: number
  profiles: number
  progress: number
  sessions: number
}> {
  console.warn('migrateData is not yet implemented')
  return { conversations: 0, profiles: 0, progress: 0, sessions: 0 }
}

/**
 * Backup data to JSON format
 * @experimental - Will be implemented in future versions
 */
export async function exportData(
  db: LanguageLearningDB,
  userId: string,
  language?: string
): Promise<{
  conversations: any[]
  progress: any
  profile: any
  sessions: any[]
}> {
  const userData = await db.getUserData(userId, language || 'es')
  const conversations = await db.conversations.getForUser(userId, { language })
  
  return {
    conversations,
    progress: userData.progress,
    profile: userData.profile,
    sessions: [] // Would need to implement session export
  }
}

/**
 * Import data from JSON format
 * @experimental - Will be implemented in future versions
 */
export async function importData(
  db: LanguageLearningDB,
  data: any,
  userId: string
): Promise<void> {
  console.warn('importData is not yet implemented')
}

// ============================================================================
// Development Utilities
// ============================================================================

/**
 * Create sample data for development/testing
 */
export async function createSampleData(db: LanguageLearningDB, userId: string = 'dev-user'): Promise<void> {
  // Create sample profile
  await db.profiles.create(userId, 'es', {
    level: 'beginner',
    goals: ['travel', 'conversation'],
    preferences: {
      learningStyle: 'mixed',
      pace: 'normal',
      supportLevel: 'moderate',
      culturalContext: true
    }
  })

  // Create sample conversation
  await db.saveConversation({
    title: 'Sample Taco Ordering',
    persona: 'Don Roberto',
    transcript: [
      {
        id: '1',
        speaker: 'assistant',
        text: '¡Hola! ¿Qué va a querer?',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        speaker: 'user',
        text: 'Hola, quiero dos tacos de pastor',
        timestamp: new Date().toISOString()
      }
    ],
    duration: 120,
    language: 'es',
    scenario: 'taco_vendor'
  }, { id: userId })

  // Initialize progress
  await db.progress.initialize(userId, 'es', 'beginner')
  
  console.log('Sample data created successfully')
}

// ============================================================================
// Default Export
// ============================================================================

// Import the main class for default export
import { LanguageLearningDB } from './LanguageLearningDB'

// Default export for common usage patterns
export default LanguageLearningDB