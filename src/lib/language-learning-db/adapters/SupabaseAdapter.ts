/**
 * Supabase Storage Adapter
 * 
 * Implements StorageAdapter interface for Supabase backend
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
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

export class SupabaseAdapter implements StorageAdapter {
  private supabase: SupabaseClient

  constructor(connection?: { url: string; apiKey: string }) {
    if (!connection) {
      // Use environment variables if no connection provided
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !apiKey) {
        throw new StorageError(
          'Supabase connection details not provided',
          'constructor'
        )
      }
      
      this.supabase = createClient(url, apiKey)
    } else {
      this.supabase = createClient(connection.url, connection.apiKey)
    }
  }

  // ============================================================================
  // Conversation Operations
  // ============================================================================

  async saveConversation(data: ConversationData, userId: string): Promise<Conversation> {
    try {
      const conversationData = {
        user_id: userId,
        title: data.title,
        persona: data.persona,
        transcript: data.transcript,
        duration: data.duration,
        language: data.language,
        scenario: data.scenario,
        analysis: data.analysis || null,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: result, error } = await this.supabase
        .from('conversations')
        .insert(conversationData)
        .select()
        .single()

      if (error) {
        throw new StorageError(
          `Failed to save conversation: ${error.message}`,
          'saveConversation',
          { error, data }
        )
      }

      return this.transformConversation(result)
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error saving conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveConversation',
        { error, data }
      )
    }
  }

  async getConversations(query: ConversationQuery): Promise<Conversation[]> {
    try {
      let supabaseQuery = this.supabase
        .from('conversations')
        .select('*')

      // Apply filters
      if (query.userId) {
        supabaseQuery = supabaseQuery.eq('user_id', query.userId)
      }
      if (query.language) {
        supabaseQuery = supabaseQuery.eq('language', query.language)
      }
      if (query.scenario) {
        supabaseQuery = supabaseQuery.eq('scenario', query.scenario)
      }
      if (query.dateRange) {
        supabaseQuery = supabaseQuery
          .gte('created_at', query.dateRange.start)
          .lte('created_at', query.dateRange.end)
      }

      // Apply sorting
      if (query.sortBy) {
        const order = query.sortOrder || 'desc'
        supabaseQuery = supabaseQuery.order(query.sortBy, { ascending: order === 'asc' })
      }

      // Apply pagination
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit)
      }
      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, (query.offset + (query.limit || 10)) - 1)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        throw new StorageError(
          `Failed to get conversations: ${error.message}`,
          'getConversations',
          { error, query }
        )
      }

      return (data || []).map(this.transformConversation)
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error getting conversations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getConversations',
        { error, query }
      )
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new StorageError(
          `Failed to get conversation: ${error.message}`,
          'getConversation',
          { error, id }
        )
      }

      return data ? this.transformConversation(data) : null
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error getting conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getConversation',
        { error, id }
      )
    }
  }

  async updateConversation(id: string, updates: Partial<ConversationData>): Promise<Conversation> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('conversations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new StorageError(
          `Failed to update conversation: ${error.message}`,
          'updateConversation',
          { error, id, updates }
        )
      }

      return this.transformConversation(data)
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error updating conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateConversation',
        { error, id, updates }
      )
    }
  }

  async deleteConversation(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('conversations')
        .delete()
        .eq('id', id)

      if (error) {
        throw new StorageError(
          `Failed to delete conversation: ${error.message}`,
          'deleteConversation',
          { error, id }
        )
      }

      return true
    } catch (error) {
      if (error instanceof StorageError) throw error
      console.error('Unexpected error deleting conversation:', error)
      return false
    }
  }

  // ============================================================================
  // Progress Operations
  // ============================================================================

  async getProgress(userId: string, language: string): Promise<UserProgress | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new StorageError(
          `Failed to get progress: ${error.message}`,
          'getProgress',
          { error, userId, language }
        )
      }

      return data ? this.transformProgress(data) : null
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error getting progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getProgress',
        { error, userId, language }
      )
    }
  }

  async updateProgress(userId: string, language: string, updates: Partial<UserProgress>): Promise<UserProgress> {
    try {
      const updateData = {
        user_id: userId,
        language,
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('user_progress')
        .upsert(updateData)
        .select()
        .single()

      if (error) {
        throw new StorageError(
          `Failed to update progress: ${error.message}`,
          'updateProgress',
          { error, userId, language, updates }
        )
      }

      return this.transformProgress(data)
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error updating progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'updateProgress',
        { error, userId, language, updates }
      )
    }
  }

  async trackVocabulary(userId: string, language: string, words: VocabularyProgress[]): Promise<void> {
    try {
      // Update vocabulary in progress record
      const progress = await this.getProgress(userId, language)
      if (!progress) {
        throw new StorageError(
          'Progress record not found for vocabulary tracking',
          'trackVocabulary',
          { userId, language }
        )
      }

      // Merge new vocabulary with existing
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
        `Unexpected error tracking vocabulary: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const { data, error } = await this.supabase
        .from('learner_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new StorageError(
          `Failed to get profile: ${error.message}`,
          'getProfile',
          { error, userId, language }
        )
      }

      return data ? this.transformProfile(data) : null
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error getting profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'getProfile',
        { error, userId, language }
      )
    }
  }

  async saveProfile(profile: LearnerProfile): Promise<LearnerProfile> {
    try {
      const profileData = {
        user_id: profile.userId,
        language: profile.language,
        level: profile.level,
        goals: profile.goals,
        preferences: profile.preferences,
        struggling_areas: profile.strugglingAreas,
        mastered_concepts: profile.masteredConcepts,
        common_errors: profile.commonErrors,
        adaptations: profile.adaptations,
        created_at: profile.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('learner_profiles')
        .upsert(profileData)
        .select()
        .single()

      if (error) {
        throw new StorageError(
          `Failed to save profile: ${error.message}`,
          'saveProfile',
          { error, profile }
        )
      }

      return this.transformProfile(data)
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error saving profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveProfile',
        { error, profile }
      )
    }
  }

  async updateProfile(userId: string, language: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile> {
    try {
      // Transform camelCase to snake_case for database
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      // Map camelCase properties to snake_case
      if (updates.strugglingAreas !== undefined) updateData.struggling_areas = updates.strugglingAreas
      if (updates.masteredConcepts !== undefined) updateData.mastered_concepts = updates.masteredConcepts
      if (updates.commonErrors !== undefined) updateData.common_errors = updates.commonErrors
      if (updates.level !== undefined) updateData.level = updates.level
      if (updates.goals !== undefined) updateData.goals = updates.goals
      if (updates.preferences !== undefined) updateData.preferences = updates.preferences
      if (updates.adaptations !== undefined) updateData.adaptations = updates.adaptations

      const { data, error } = await this.supabase
        .from('learner_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .eq('language', language)
        .select()
        .single()

      if (error) {
        throw new StorageError(
          `Failed to update profile: ${error.message}`,
          'updateProfile',
          { error, userId, language, updates }
        )
      }

      return this.transformProfile(data)
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error updating profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const sessionData = {
        id: session.id,
        user_id: session.userId,
        conversation_id: session.conversationId,
        type: session.type,
        duration: session.duration,
        language: session.language,
        scenario: session.scenario,
        metrics_collected: session.metricsCollected,
        started_at: session.startedAt,
        completed_at: session.completedAt
      }

      const { data, error } = await this.supabase
        .from('learning_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) {
        throw new StorageError(
          `Failed to save session: ${error.message}`,
          'saveSession',
          { error, session }
        )
      }

      return this.transformSession(data)
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error saving session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'saveSession',
        { error, session }
      )
    }
  }

  async getSessionMetrics(query: ProgressQuery): Promise<SessionMetrics[]> {
    try {
      let supabaseQuery = this.supabase
        .from('learning_sessions')
        .select('metrics_collected')
        .eq('user_id', query.userId)

      if (query.language) {
        supabaseQuery = supabaseQuery.eq('language', query.language)
      }

      if (query.timeframe) {
        const timeframeMap = {
          week: 7,
          month: 30,
          quarter: 90,
          year: 365,
          all: 9999
        }
        const days = timeframeMap[query.timeframe]
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        supabaseQuery = supabaseQuery.gte('completed_at', startDate)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        throw new StorageError(
          `Failed to get session metrics: ${error.message}`,
          'getSessionMetrics',
          { error, query }
        )
      }

      return (data || []).map(row => row.metrics_collected)
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError(
        `Unexpected error getting session metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const { data, error } = await this.supabase
        .from('conversations')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Supabase health check failed:', error)
      return false
    }
  }

  async migrate(version?: string): Promise<void> {
    console.log(`Supabase migrations are managed externally. Version: ${version || 'latest'}`)
  }

  // ============================================================================
  // Transform Methods (Database → Domain Objects)
  // ============================================================================

  private transformConversation(data: any): Conversation {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      persona: data.persona,
      transcript: data.transcript,
      duration: data.duration,
      language: data.language,
      scenario: data.scenario,
      metadata: data.metadata,
      analysis: data.analysis,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private transformProgress(data: any): UserProgress {
    return {
      userId: data.user_id,
      language: data.language,
      overallLevel: data.overall_level,
      totalMinutesPracticed: data.total_minutes_practiced,
      conversationsCompleted: data.conversations_completed,
      vocabulary: data.vocabulary || [],
      skills: data.skills || [],
      streak: data.streak,
      lastActive: data.last_active,
      achievements: data.achievements || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private transformProfile(data: any): LearnerProfile {
    return {
      userId: data.user_id,
      language: data.language,
      level: data.level,
      goals: data.goals || [],
      preferences: data.preferences,
      strugglingAreas: data.struggling_areas || [],
      masteredConcepts: data.mastered_concepts || [],
      commonErrors: data.common_errors || [],
      adaptations: data.adaptations || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private transformSession(data: any): LearningSession {
    return {
      id: data.id,
      userId: data.user_id,
      conversationId: data.conversation_id,
      type: data.type,
      duration: data.duration,
      language: data.language,
      scenario: data.scenario,
      metricsCollected: data.metrics_collected,
      startedAt: data.started_at,
      completedAt: data.completed_at
    }
  }
}