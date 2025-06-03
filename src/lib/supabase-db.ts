import { ConversationTranscript } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Types for our database tables
export interface Conversation {
  id: string
  user_id: string
  title: string
  persona: string
  transcript: ConversationTranscript[]
  duration: number
  analysis?: any
  created_at: string
  updated_at: string
}

export interface Progress {
  id: string
  user_id: string
  vocabulary: string[]
  pronunciation: number
  grammar: number
  fluency: number
  cultural_knowledge: number
  total_minutes_practiced: number
  conversations_completed: number
  created_at: string
  updated_at: string
}

export interface UserAdaptations {
  id: string
  user_id: string
  speaking_pace_preference: number
  needs_visual_aids: boolean
  common_errors: string[]
  mastered_concepts: string[]
  struggle_areas: string[]
  learning_goals: string[]
  created_at: string
  updated_at: string
}

// Conversation operations
export const conversationService = {
  async create(supabase: SupabaseClient, data: {
    user_id: string
    title: string
    persona: string
    transcript: ConversationTranscript[]
    duration: number
  }) {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return conversation as Conversation
  },

  async getByUserId(supabase: SupabaseClient, userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Conversation[]
  },

  async getById(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Conversation
  },

  async updateAnalysis(supabase: SupabaseClient, id: string, analysis: any) {
    const { data, error } = await supabase
      .from('conversations')
      .update({ analysis })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Conversation
  },

  async delete(supabase: SupabaseClient, id: string) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Progress operations
export const progressService = {
  async getByUserId(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('progress')
      .select()
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
    return data as Progress | null
  },

  async upsert(supabase: SupabaseClient, data: {
    user_id: string
    vocabulary?: string[]
    pronunciation?: number
    grammar?: number
    fluency?: number
    cultural_knowledge?: number
    total_minutes_practiced?: number
    conversations_completed?: number
  }) {
    const { data: progress, error } = await supabase
      .from('progress')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return progress as Progress
  },

  async incrementStats(supabase: SupabaseClient, userId: string, updates: {
    minutes_practiced?: number
    conversations_completed?: number
    pronunciation_improvement?: number
    grammar_improvement?: number
    fluency_improvement?: number
    cultural_improvement?: number
  }) {
    // Get current progress
    const current = await this.getByUserId(supabase, userId)
    
    const updatedData = {
      user_id: userId,
      total_minutes_practiced: (current?.total_minutes_practiced || 0) + (updates.minutes_practiced || 0),
      conversations_completed: (current?.conversations_completed || 0) + (updates.conversations_completed || 0),
      pronunciation: Math.min(100, (current?.pronunciation || 0) + (updates.pronunciation_improvement || 0)),
      grammar: Math.min(100, (current?.grammar || 0) + (updates.grammar_improvement || 0)),
      fluency: Math.min(100, (current?.fluency || 0) + (updates.fluency_improvement || 0)),
      cultural_knowledge: Math.min(100, (current?.cultural_knowledge || 0) + (updates.cultural_improvement || 0)),
    }

    return this.upsert(supabase, updatedData)
  },

  async addVocabulary(supabase: SupabaseClient, userId: string, words: string[]) {
    const current = await this.getByUserId(supabase, userId)
    const existingVocab = current?.vocabulary || []
    const newVocab = [...new Set([...existingVocab, ...words])]

    return this.upsert(supabase, {
      user_id: userId,
      vocabulary: newVocab
    })
  }
}

// User adaptations operations
export const adaptationsService = {
  async getByUserId(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('user_adaptations')
      .select()
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as UserAdaptations | null
  },

  async upsert(supabase: SupabaseClient, data: {
    user_id: string
    speaking_pace_preference?: number
    needs_visual_aids?: boolean
    common_errors?: string[]
    mastered_concepts?: string[]
    struggle_areas?: string[]
    learning_goals?: string[]
  }) {
    const { data: adaptations, error } = await supabase
      .from('user_adaptations')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return adaptations as UserAdaptations
  },

  async addError(supabase: SupabaseClient, userId: string, error: string) {
    const current = await this.getByUserId(supabase, userId)
    const errors = [...(current?.common_errors || []), error]
    
    return this.upsert(supabase, {
      user_id: userId,
      common_errors: errors
    })
  },

  async addMasteredConcept(supabase: SupabaseClient, userId: string, concept: string) {
    const current = await this.getByUserId(supabase, userId)
    const concepts = [...new Set([...(current?.mastered_concepts || []), concept])]
    
    return this.upsert(supabase, {
      user_id: userId,
      mastered_concepts: concepts
    })
  }
}

// Helper functions
export const dbHelpers = {
  async getCurrentUser(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async requireAuth(supabase: SupabaseClient) {
    const user = await this.getCurrentUser(supabase)
    if (!user) throw new Error('Authentication required')
    return user
  }
}