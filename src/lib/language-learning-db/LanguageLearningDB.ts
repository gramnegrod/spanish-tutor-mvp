/**
 * Language Learning Database - Core Class
 * 
 * Main database abstraction for language learning applications.
 * Framework and database agnostic.
 */

import type {
  LanguageLearningDBConfig,
  StorageAdapter,
  User,
  ConversationData,
  Conversation,
  ConversationQuery,
  UserProgress,
  LearnerProfile,
  LearningSession,
  SessionMetrics,
  ProgressQuery,
  VocabularyProgress
} from './types'

import { ConfigurationError, LanguageLearningDBError } from './types'

import { ConversationService } from './services/ConversationService'
import { ProgressService } from './services/ProgressService'
import { ProfileService } from './services/ProfileService'
import { AnalyticsService } from './services/AnalyticsService'

export class LanguageLearningDB {
  private adapter: StorageAdapter
  private config: LanguageLearningDBConfig

  // Service instances
  public readonly conversations: ConversationService
  public readonly progress: ProgressService
  public readonly profiles: ProfileService
  public readonly analytics: AnalyticsService

  constructor(config: LanguageLearningDBConfig, adapter?: StorageAdapter) {
    this.config = config
    
    // Initialize adapter
    if (adapter) {
      this.adapter = adapter
    } else {
      this.adapter = this.createAdapter(config.database.adapter)
    }

    // Initialize services
    this.conversations = new ConversationService(this.adapter)
    this.progress = new ProgressService(this.adapter)
    this.profiles = new ProfileService(this.adapter)
    this.analytics = new AnalyticsService(this.adapter)
  }

  /**
   * Factory method to create storage adapter based on configuration
   */
  private createAdapter(adapterType: string): StorageAdapter {
    switch (adapterType) {
      case 'supabase':
        const { SupabaseAdapter } = require('./adapters/SupabaseAdapter')
        return new SupabaseAdapter(this.config.database.connection)
        
      case 'localStorage':
        const { LocalStorageAdapter } = require('./adapters/LocalStorageAdapter')
        return new LocalStorageAdapter(this.config.database.connection)
        
      case 'firebase':
        throw new ConfigurationError('FirebaseAdapter not yet implemented. Use Supabase or LocalStorage.')
        
      case 'memory':
        throw new ConfigurationError('MemoryAdapter not yet implemented. Use Supabase or LocalStorage.')
        
      default:
        throw new ConfigurationError(`Unsupported adapter type: ${adapterType}`)
    }
  }

  /**
   * Get the underlying storage adapter
   */
  getAdapter(): StorageAdapter {
    return this.adapter
  }

  /**
   * Get current configuration
   */
  getConfig(): LanguageLearningDBConfig {
    return { ...this.config }
  }

  /**
   * Check database health
   */
  async health(): Promise<boolean> {
    try {
      return await this.adapter.health()
    } catch (error) {
      console.error('[LanguageLearningDB] Health check failed:', error)
      return false
    }
  }

  /**
   * Run database migrations (if supported by adapter)
   */
  async migrate(version?: string): Promise<void> {
    if (this.adapter.migrate) {
      await this.adapter.migrate(version || 'latest')
    } else {
      console.warn('[LanguageLearningDB] Migrations not supported by current adapter')
    }
  }

  /**
   * Close database connections and cleanup
   */
  async close(): Promise<void> {
    // Cleanup logic if needed
    console.log('[LanguageLearningDB] Database connections closed')
  }

  // ============================================================================
  // Convenience Methods (Shortcuts to Services)
  // ============================================================================

  /**
   * Quick conversation save - most common operation
   */
  async saveConversation(data: ConversationData, user?: User): Promise<Conversation> {
    const userId = user?.id || 'guest'
    return this.conversations.save(data, userId)
  }

  /**
   * Quick progress update - common operation
   */
  async updateProgress(
    userId: string, 
    language: string, 
    updates: Partial<UserProgress>
  ): Promise<UserProgress> {
    return this.progress.update(userId, language, updates)
  }

  /**
   * Quick profile save - common operation
   */
  async saveProfile(profile: LearnerProfile): Promise<LearnerProfile> {
    return this.profiles.save(profile)
  }

  /**
   * Get user's complete learning data
   */
  async getUserData(userId: string, language: string): Promise<{
    profile: LearnerProfile | null
    progress: UserProgress | null
    recentConversations: Conversation[]
  }> {
    const [profile, progress, conversations] = await Promise.all([
      this.profiles.get(userId, language),
      this.progress.get(userId, language),
      this.conversations.find({ 
        userId, 
        language, 
        limit: 10, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      })
    ])

    return { profile, progress, recentConversations: conversations }
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Create instance with Supabase backend
   */
  static createWithSupabase(connection: {
    url: string
    apiKey: string
  }): LanguageLearningDB {
    return new LanguageLearningDB({
      database: {
        adapter: 'supabase',
        connection
      },
      features: {
        enableAnalytics: true,
        enableRealtimeSync: true
      }
    })
  }

  /**
   * Create instance with localStorage (guest mode)
   */
  static createWithLocalStorage(): LanguageLearningDB {
    return new LanguageLearningDB({
      database: {
        adapter: 'localStorage'
      },
      features: {
        enableAnalytics: false,
        enableOfflineMode: true
      }
    })
  }

  /**
   * Create instance with Firebase backend
   */
  static createWithFirebase(connection: {
    projectId: string
    apiKey: string
  }): LanguageLearningDB {
    throw new Error('Firebase adapter not yet implemented. Use createWithSupabase() or createWithLocalStorage()')
  }

  /**
   * Create in-memory instance (testing/development)
   */
  static createInMemory(): LanguageLearningDB {
    throw new Error('Memory adapter not yet implemented. Use createWithLocalStorage() for testing')
  }
}

// ============================================================================
// Default Export & Named Exports
// ============================================================================

export default LanguageLearningDB

// Re-export types for convenience
export type {
  LanguageLearningDBConfig,
  ConversationData,
  Conversation,
  UserProgress,
  LearnerProfile,
  User
} from './types'