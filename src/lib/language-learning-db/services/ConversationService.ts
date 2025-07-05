/**
 * Conversation Service
 * 
 * Handles all conversation-related database operations
 */

import type {
  StorageAdapter,
  ConversationData,
  Conversation,
  ConversationQuery,
  ConversationAnalysis
} from '../types'

import { ValidationError } from '../types'

export class ConversationService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Save a new conversation
   */
  async save(data: ConversationData, userId: string): Promise<Conversation> {
    this.validateConversationData(data)
    return this.adapter.saveConversation(data, userId)
  }

  /**
   * Find conversations with query
   */
  async find(query: ConversationQuery): Promise<Conversation[]> {
    return this.adapter.getConversations(query)
  }

  /**
   * Get a specific conversation by ID
   */
  async get(id: string): Promise<Conversation | null> {
    return this.adapter.getConversation(id)
  }

  /**
   * Update conversation data
   */
  async update(id: string, updates: Partial<ConversationData>): Promise<Conversation> {
    if (updates.transcript) {
      this.validateTranscript(updates.transcript)
    }
    return this.adapter.updateConversation(id, updates)
  }

  /**
   * Delete a conversation
   */
  async delete(id: string): Promise<boolean> {
    return this.adapter.deleteConversation(id)
  }

  /**
   * Add analysis to existing conversation
   */
  async addAnalysis(id: string, analysis: ConversationAnalysis): Promise<Conversation> {
    return this.update(id, { analysis } as any)
  }

  /**
   * Get conversations for a specific user
   */
  async getForUser(
    userId: string, 
    options: {
      language?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<Conversation[]> {
    return this.find({
      userId,
      language: options.language,
      limit: options.limit || 20,
      offset: options.offset || 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  /**
   * Get recent conversations
   */
  async getRecent(userId: string, language: string, limit = 5): Promise<Conversation[]> {
    return this.find({
      userId,
      language,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  /**
   * Get conversations by scenario
   */
  async getByScenario(
    userId: string, 
    scenario: string, 
    language?: string
  ): Promise<Conversation[]> {
    return this.find({
      userId,
      scenario,
      language,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  /**
   * Get conversation statistics
   */
  async getStats(userId: string, language?: string): Promise<{
    total: number
    totalDuration: number
    averageDuration: number
    scenarios: Record<string, number>
    lastWeek: number
  }> {
    const conversations = await this.find({
      userId,
      language,
      limit: 1000 // Get all for stats
    })

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      total: conversations.length,
      totalDuration: conversations.reduce((sum, c) => sum + c.duration, 0),
      averageDuration: 0,
      scenarios: {} as Record<string, number>,
      lastWeek: conversations.filter(c => 
        new Date(c.createdAt) > weekAgo
      ).length
    }

    stats.averageDuration = stats.total > 0 ? stats.totalDuration / stats.total : 0

    // Count scenarios
    conversations.forEach(c => {
      if (c.scenario) {
        stats.scenarios[c.scenario] = (stats.scenarios[c.scenario] || 0) + 1
      }
    })

    return stats
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  private validateConversationData(data: ConversationData): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new ValidationError('Title is required', 'title', data.title)
    }

    if (!data.transcript || data.transcript.length === 0) {
      throw new ValidationError('Transcript cannot be empty', 'transcript', data.transcript)
    }

    if (typeof data.duration !== 'number' || data.duration < 0) {
      throw new ValidationError('Duration must be a positive number', 'duration', data.duration)
    }

    if (!data.language || data.language.trim().length === 0) {
      throw new ValidationError('Language is required', 'language', data.language)
    }

    this.validateTranscript(data.transcript)
  }

  private validateTranscript(transcript: any[]): void {
    transcript.forEach((entry, index) => {
      if (!entry.speaker || !['user', 'assistant', 'system'].includes(entry.speaker)) {
        throw new ValidationError(
          `Invalid speaker at index ${index}`, 
          'transcript.speaker', 
          entry.speaker
        )
      }

      if (!entry.text || typeof entry.text !== 'string') {
        throw new ValidationError(
          `Invalid text at index ${index}`, 
          'transcript.text', 
          entry.text
        )
      }

      if (!entry.timestamp) {
        throw new ValidationError(
          `Missing timestamp at index ${index}`, 
          'transcript.timestamp', 
          entry.timestamp
        )
      }
    })
  }
}