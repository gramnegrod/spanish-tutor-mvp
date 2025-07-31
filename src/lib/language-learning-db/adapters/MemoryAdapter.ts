/**
 * Memory Storage Adapter
 * 
 * Implements StorageAdapter interface for in-memory storage (testing/development)
 * Data is stored in memory and will be lost when the process restarts.
 */

import type {
  StorageAdapter,
  ConversationData,
  Conversation,
  ConversationQuery,
  UserProgress,
  LearnerProfile,
  LearningSession,
  SessionMetrics,
  ProgressQuery,
  VocabularyProgress
} from '../types'

import { StorageError } from '../types'

export class MemoryAdapter implements StorageAdapter {
  private data: {
    conversations: Map<string, Conversation>
    progress: Map<string, UserProgress>
    profiles: Map<string, LearnerProfile>
    sessions: Map<string, LearningSession>
  }
  private counter: number

  constructor(connection?: any) {
    this.data = {
      conversations: new Map(),
      progress: new Map(),
      profiles: new Map(),
      sessions: new Map()
    }
    this.counter = 1
  }

  // ============================================================================
  // Storage Utilities
  // ============================================================================

  private generateId(): string {
    return `memory_${Date.now()}_${this.counter++}`
  }

  private makeProgressKey(userId: string, language: string): string {
    return `${userId}:${language}`
  }

  private makeProfileKey(userId: string, language: string): string {
    return `${userId}:${language}`
  }

  // ============================================================================
  // Conversation Operations
  // ============================================================================

  async saveConversation(data: ConversationData, userId: string): Promise<Conversation> {
    try {
      const conversation: Conversation = {
        id: this.generateId(),
        userId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.data.conversations.set(conversation.id, conversation)
      
      return conversation
    } catch (error) {
      throw new StorageError(
        `Failed to save conversation to memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveConversation',
        { error, data, userId }
      )
    }
  }

  async getConversations(query: ConversationQuery): Promise<Conversation[]> {
    try {
      let conversations = Array.from(this.data.conversations.values())

      // Apply filters
      if (query.userId) {
        conversations = conversations.filter(c => c.userId === query.userId)
      }
      if (query.language) {
        conversations = conversations.filter(c => c.language === query.language)
      }
      if (query.scenario) {
        conversations = conversations.filter(c => c.scenario === query.scenario)
      }
      if (query.dateRange) {
        const start = new Date(query.dateRange.start).getTime()
        const end = new Date(query.dateRange.end).getTime()
        conversations = conversations.filter(c => {
          const createdAt = new Date(c.createdAt).getTime()
          return createdAt >= start && createdAt <= end
        })
      }

      // Apply sorting
      if (query.sortBy) {
        conversations.sort((a, b) => {
          const aVal = this.getNestedValue(a, query.sortBy!)
          const bVal = this.getNestedValue(b, query.sortBy!)
          
          if (query.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }

      // Apply pagination
      const offset = query.offset || 0
      const limit = query.limit || conversations.length
      
      return conversations.slice(offset, offset + limit)
    } catch (error) {
      throw new StorageError(
        `Failed to get conversations from memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getConversations',
        { error, query }
      )
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      return this.data.conversations.get(id) || null
    } catch (error) {
      throw new StorageError(
        `Failed to get conversation from memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getConversation',
        { error, id }
      )
    }
  }

  async updateConversation(id: string, updates: Partial<ConversationData>): Promise<Conversation> {
    try {
      const existing = this.data.conversations.get(id)
      
      if (!existing) {
        throw new StorageError(
          'Conversation not found',
          'updateConversation',
          { id }
        )
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      this.data.conversations.set(id, updated)
      return updated
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Failed to update conversation in memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateConversation',
        { error, id, updates }
      )
    }
  }

  async deleteConversation(id: string): Promise<boolean> {
    try {
      return this.data.conversations.delete(id)
    } catch (error) {
      console.error('Failed to delete conversation from memory:', error)
      return false
    }
  }

  // ============================================================================
  // Progress Operations
  // ============================================================================

  async getProgress(userId: string, language: string): Promise<UserProgress | null> {
    try {
      const key = this.makeProgressKey(userId, language)
      return this.data.progress.get(key) || null
    } catch (error) {
      throw new StorageError(
        `Failed to get progress from memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getProgress',
        { error, userId, language }
      )
    }
  }

  async updateProgress(userId: string, language: string, updates: Partial<UserProgress>): Promise<UserProgress> {
    try {
      const key = this.makeProgressKey(userId, language)
      const existing = this.data.progress.get(key)
      
      let progress: UserProgress
      
      if (existing) {
        // Update existing record
        progress = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      } else {
        // Create new progress record
        progress = {
          userId,
          language,
          overallLevel: 'beginner',
          totalMinutesPracticed: 0,
          conversationsCompleted: 0,
          vocabulary: [],
          skills: [],
          streak: 0,
          lastActive: new Date().toISOString(),
          achievements: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...updates
        }
      }

      this.data.progress.set(key, progress)
      return progress
    } catch (error) {
      throw new StorageError(
        `Failed to update progress in memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateProgress',
        { error, userId, language, updates }
      )
    }
  }

  async trackVocabulary(userId: string, language: string, words: VocabularyProgress[]): Promise<void> {
    try {
      const progress = await this.getProgress(userId, language)
      if (!progress) {
        throw new StorageError(
          'Progress record not found for vocabulary tracking',
          'trackVocabulary',
          { userId, language }
        )
      }

      // Merge vocabulary
      const existingVocab = progress.vocabulary || []
      const vocabularyMap = new Map(existingVocab.map(v => [v.word, v]))

      words.forEach(word => {
        vocabularyMap.set(word.word, word)
      })

      const updatedVocabulary = Array.from(vocabularyMap.values())

      await this.updateProgress(userId, language, {
        vocabulary: updatedVocabulary
      })
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Failed to track vocabulary in memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'trackVocabulary',
        { error, userId, language, words }
      )
    }
  }

  // ============================================================================
  // Profile Operations
  // ============================================================================

  async getProfile(userId: string, language: string): Promise<LearnerProfile | null> {
    try {
      const key = this.makeProfileKey(userId, language)
      return this.data.profiles.get(key) || null
    } catch (error) {
      throw new StorageError(
        `Failed to get profile from memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getProfile',
        { error, userId, language }
      )
    }
  }

  async saveProfile(profile: LearnerProfile): Promise<LearnerProfile> {
    try {
      const key = this.makeProfileKey(profile.userId, profile.language)
      
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
        createdAt: profile.createdAt || new Date().toISOString()
      }

      this.data.profiles.set(key, updatedProfile)
      return updatedProfile
    } catch (error) {
      throw new StorageError(
        `Failed to save profile to memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveProfile',
        { error, profile }
      )
    }
  }

  async updateProfile(userId: string, language: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile> {
    try {
      const key = this.makeProfileKey(userId, language)
      const existing = this.data.profiles.get(key)
      
      if (!existing) {
        throw new StorageError(
          'Profile not found',
          'updateProfile',
          { userId, language }
        )
      }

      const updatedProfile = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      this.data.profiles.set(key, updatedProfile)
      
      return updatedProfile
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Failed to update profile in memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateProfile',
        { error, userId, language, updates }
      )
    }
  }

  // ============================================================================
  // Analytics Operations
  // ============================================================================

  async saveSession(session: LearningSession): Promise<LearningSession> {
    try {
      this.data.sessions.set(session.id, session)
      return session
    } catch (error) {
      throw new StorageError(
        `Failed to save session to memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveSession',
        { error, session }
      )
    }
  }

  async getSessionMetrics(query: ProgressQuery): Promise<SessionMetrics[]> {
    try {
      let sessions = Array.from(this.data.sessions.values())
      
      // Filter by user
      sessions = sessions.filter(s => s.userId === query.userId)
      
      // Filter by language
      if (query.language) {
        sessions = sessions.filter(s => s.language === query.language)
      }

      // Filter by timeframe
      if (query.timeframe && query.timeframe !== 'all') {
        const timeframeMap = {
          week: 7,
          month: 30,
          quarter: 90,
          year: 365
        }
        const days = timeframeMap[query.timeframe]
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        
        sessions = sessions.filter(s => new Date(s.completedAt) > startDate)
      }

      return sessions.map(s => s.metricsCollected)
    } catch (error) {
      throw new StorageError(
        `Failed to get session metrics from memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getSessionMetrics',
        { error, query }
      )
    }
  }

  // ============================================================================
  // Utility Operations
  // ============================================================================

  async health(): Promise<boolean> {
    try {
      // Memory is always healthy if the adapter exists
      return true
    } catch (error) {
      console.error('Memory adapter health check failed:', error)
      return false
    }
  }

  async migrate(version?: string): Promise<void> {
    console.log(`Memory adapter does not support migrations. Version: ${version || 'latest'}`)
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Clear all data (useful for development/testing)
   */
  async clearAll(): Promise<void> {
    this.data.conversations.clear()
    this.data.progress.clear()
    this.data.profiles.clear()
    this.data.sessions.clear()
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    totalItems: number
    conversations: number
    progressRecords: number
    profiles: number
    sessions: number
  } {
    return {
      totalItems: this.data.conversations.size + this.data.progress.size + this.data.profiles.size + this.data.sessions.size,
      conversations: this.data.conversations.size,
      progressRecords: this.data.progress.size,
      profiles: this.data.profiles.size,
      sessions: this.data.sessions.size
    }
  }

  /**
   * Export all data (useful for debugging/testing)
   */
  exportData(): any {
    return {
      conversations: Array.from(this.data.conversations.entries()),
      progress: Array.from(this.data.progress.entries()),
      profiles: Array.from(this.data.profiles.entries()),
      sessions: Array.from(this.data.sessions.entries())
    }
  }

  /**
   * Import data (useful for testing with predefined data)
   */
  importData(data: any): void {
    if (data.conversations) {
      this.data.conversations = new Map(data.conversations)
    }
    if (data.progress) {
      this.data.progress = new Map(data.progress)
    }
    if (data.profiles) {
      this.data.profiles = new Map(data.profiles)
    }
    if (data.sessions) {
      this.data.sessions = new Map(data.sessions)
    }
  }
}