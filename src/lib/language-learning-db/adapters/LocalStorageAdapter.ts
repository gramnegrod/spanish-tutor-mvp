/**
 * LocalStorage Adapter
 * 
 * Implements StorageAdapter interface for browser localStorage (guest mode)
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

const STORAGE_KEYS = {
  conversations: 'language-learning-db:conversations',
  progress: 'language-learning-db:progress',
  profiles: 'language-learning-db:profiles',
  sessions: 'language-learning-db:sessions'
}

export class LocalStorageAdapter implements StorageAdapter {
  private isClient: boolean

  constructor(connection?: any) {
    this.isClient = typeof window !== 'undefined'
    
    if (!this.isClient) {
      console.warn('LocalStorageAdapter: Running in server environment, operations will be no-ops')
    }
  }

  // ============================================================================
  // Storage Utilities
  // ============================================================================

  private getStorageData<T>(key: string): T[] {
    if (!this.isClient) return []
    
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Failed to read from localStorage key ${key}:`, error)
      return []
    }
  }

  private setStorageData<T>(key: string, data: T[]): void {
    if (!this.isClient) return
    
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to write to localStorage key ${key}:`, error)
      throw new StorageError(
        `Failed to save data to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'setStorageData',
        { key, error }
      )
    }
  }

  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ============================================================================
  // Conversation Operations
  // ============================================================================

  async saveConversation(data: ConversationData, userId: string): Promise<Conversation> {
    try {
      const conversations = this.getStorageData<Conversation>(STORAGE_KEYS.conversations)
      
      const conversation: Conversation = {
        id: this.generateId(),
        userId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      conversations.push(conversation)
      this.setStorageData(STORAGE_KEYS.conversations, conversations)
      
      return conversation
    } catch (error) {
      throw new StorageError(
        `Failed to save conversation to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveConversation',
        { error, data, userId }
      )
    }
  }

  async getConversations(query: ConversationQuery): Promise<Conversation[]> {
    try {
      let conversations = this.getStorageData<Conversation>(STORAGE_KEYS.conversations)

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
        `Failed to get conversations from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getConversations',
        { error, query }
      )
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const conversations = this.getStorageData<Conversation>(STORAGE_KEYS.conversations)
      return conversations.find(c => c.id === id) || null
    } catch (error) {
      throw new StorageError(
        `Failed to get conversation from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getConversation',
        { error, id }
      )
    }
  }

  async updateConversation(id: string, updates: Partial<ConversationData>): Promise<Conversation> {
    try {
      const conversations = this.getStorageData<Conversation>(STORAGE_KEYS.conversations)
      const index = conversations.findIndex(c => c.id === id)
      
      if (index === -1) {
        throw new StorageError(
          'Conversation not found',
          'updateConversation',
          { id }
        )
      }

      conversations[index] = {
        ...conversations[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      this.setStorageData(STORAGE_KEYS.conversations, conversations)
      return conversations[index]
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Failed to update conversation in localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateConversation',
        { error, id, updates }
      )
    }
  }

  async deleteConversation(id: string): Promise<boolean> {
    try {
      const conversations = this.getStorageData<Conversation>(STORAGE_KEYS.conversations)
      const filtered = conversations.filter(c => c.id !== id)
      
      if (filtered.length === conversations.length) {
        return false // Not found
      }

      this.setStorageData(STORAGE_KEYS.conversations, filtered)
      return true
    } catch (error) {
      console.error('Failed to delete conversation from localStorage:', error)
      return false
    }
  }

  // ============================================================================
  // Progress Operations
  // ============================================================================

  async getProgress(userId: string, language: string): Promise<UserProgress | null> {
    try {
      const progressRecords = this.getStorageData<UserProgress>(STORAGE_KEYS.progress)
      return progressRecords.find(p => p.userId === userId && p.language === language) || null
    } catch (error) {
      throw new StorageError(
        `Failed to get progress from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getProgress',
        { error, userId, language }
      )
    }
  }

  async updateProgress(userId: string, language: string, updates: Partial<UserProgress>): Promise<UserProgress> {
    try {
      const progressRecords = this.getStorageData<UserProgress>(STORAGE_KEYS.progress)
      const index = progressRecords.findIndex(p => p.userId === userId && p.language === language)
      
      let progress: UserProgress
      
      if (index === -1) {
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
        progressRecords.push(progress)
      } else {
        // Update existing record
        progress = {
          ...progressRecords[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        progressRecords[index] = progress
      }

      this.setStorageData(STORAGE_KEYS.progress, progressRecords)
      return progress
    } catch (error) {
      throw new StorageError(
        `Failed to update progress in localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        `Failed to track vocabulary in localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const profiles = this.getStorageData<LearnerProfile>(STORAGE_KEYS.profiles)
      return profiles.find(p => p.userId === userId && p.language === language) || null
    } catch (error) {
      throw new StorageError(
        `Failed to get profile from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getProfile',
        { error, userId, language }
      )
    }
  }

  async saveProfile(profile: LearnerProfile): Promise<LearnerProfile> {
    try {
      const profiles = this.getStorageData<LearnerProfile>(STORAGE_KEYS.profiles)
      const index = profiles.findIndex(p => p.userId === profile.userId && p.language === profile.language)
      
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
        createdAt: profile.createdAt || new Date().toISOString()
      }

      if (index === -1) {
        profiles.push(updatedProfile)
      } else {
        profiles[index] = updatedProfile
      }

      this.setStorageData(STORAGE_KEYS.profiles, profiles)
      return updatedProfile
    } catch (error) {
      throw new StorageError(
        `Failed to save profile to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveProfile',
        { error, profile }
      )
    }
  }

  async updateProfile(userId: string, language: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile> {
    try {
      const profiles = this.getStorageData<LearnerProfile>(STORAGE_KEYS.profiles)
      const index = profiles.findIndex(p => p.userId === userId && p.language === language)
      
      if (index === -1) {
        throw new StorageError(
          'Profile not found',
          'updateProfile',
          { userId, language }
        )
      }

      const updatedProfile = {
        ...profiles[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      profiles[index] = updatedProfile
      this.setStorageData(STORAGE_KEYS.profiles, profiles)
      
      return updatedProfile
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Failed to update profile in localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const sessions = this.getStorageData<LearningSession>(STORAGE_KEYS.sessions)
      sessions.push(session)
      this.setStorageData(STORAGE_KEYS.sessions, sessions)
      return session
    } catch (error) {
      throw new StorageError(
        `Failed to save session to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveSession',
        { error, session }
      )
    }
  }

  async getSessionMetrics(query: ProgressQuery): Promise<SessionMetrics[]> {
    try {
      let sessions = this.getStorageData<LearningSession>(STORAGE_KEYS.sessions)
      
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
        `Failed to get session metrics from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      if (!this.isClient) return false
      
      // Test localStorage access
      const testKey = 'language-learning-db:health-check'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      console.error('LocalStorage health check failed:', error)
      return false
    }
  }

  async migrate(version?: string): Promise<void> {
    console.log(`LocalStorage adapter does not support migrations. Version: ${version || 'latest'}`)
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
    if (!this.isClient) return
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
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
    if (!this.isClient) {
      return { totalItems: 0, conversations: 0, progressRecords: 0, profiles: 0, sessions: 0 }
    }

    return {
      totalItems: Object.keys(localStorage).filter(key => key.startsWith('language-learning-db:')).length,
      conversations: this.getStorageData<Conversation>(STORAGE_KEYS.conversations).length,
      progressRecords: this.getStorageData<UserProgress>(STORAGE_KEYS.progress).length,
      profiles: this.getStorageData<LearnerProfile>(STORAGE_KEYS.profiles).length,
      sessions: this.getStorageData<LearningSession>(STORAGE_KEYS.sessions).length
    }
  }
}