/**
 * Enhanced Supabase Database Services
 * Comprehensive vocabulary and struggle tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  VocabularyEntry,
  VocabularyUsageLog,
  LearningDifficulty,
  LearningPattern,
  RemediationOpportunity,
  CreateVocabularyEntryData,
  LogVocabularyUsageData,
  CreateLearningDifficultyData,
  CreateLearningPatternData,
  CreateRemediationOpportunityData,
  EnhancedConversation,
  EnhancedProgress,
  VocabularyAnalysis,
  StruggleAnalysis,
  VocabularyStats,
  LearningVelocity
} from '@/types/enhanced-database'

// ============================================================================
// Vocabulary Entry Services
// ============================================================================

export const vocabularyEntryService = {
  async create(supabase: SupabaseClient, data: CreateVocabularyEntryData) {
    const { data: entry, error } = await supabase
      .from('vocabulary_entries')
      .insert({
        ...data,
        first_encountered_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return entry as VocabularyEntry
  },

  async getByUserId(supabase: SupabaseClient, userId: string, limit = 100) {
    const { data, error } = await supabase
      .from('vocabulary_entries')
      .select()
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as VocabularyEntry[]
  },

  async getByWord(supabase: SupabaseClient, userId: string, word: string) {
    const { data, error } = await supabase
      .from('vocabulary_entries')
      .select()
      .eq('user_id', userId)
      .eq('word', word)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as VocabularyEntry | null
  },

  async updateMastery(
    supabase: SupabaseClient, 
    entryId: string, 
    masteryLevel: string,
    confidenceScore?: number
  ) {
    const updateData: any = { mastery_level: masteryLevel }
    
    if (confidenceScore !== undefined) {
      updateData.confidence_score = confidenceScore
    }

    if (masteryLevel === 'used' || masteryLevel === 'mastered') {
      updateData.first_used_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('vocabulary_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single()

    if (error) throw error
    return data as VocabularyEntry
  },

  async getForReview(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('vocabulary_entries')
      .select()
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(20)

    if (error) throw error
    return data as VocabularyEntry[]
  },

  async getByScenario(supabase: SupabaseClient, userId: string, scenario: string) {
    const { data, error } = await supabase
      .from('vocabulary_entries')
      .select()
      .eq('user_id', userId)
      .eq('first_encountered_scenario', scenario)
      .order('mastery_level', { ascending: false })

    if (error) throw error
    return data as VocabularyEntry[]
  }
}

// ============================================================================
// Vocabulary Usage Log Services
// ============================================================================

export const vocabularyUsageService = {
  async log(supabase: SupabaseClient, data: LogVocabularyUsageData) {
    const { data: logEntry, error } = await supabase
      .from('vocabulary_usage_log')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return logEntry as VocabularyUsageLog
  },

  async getByConversation(supabase: SupabaseClient, conversationId: string) {
    const { data, error } = await supabase
      .from('vocabulary_usage_log')
      .select(`
        *,
        vocabulary_entries!inner(word, translation, mastery_level)
      `)
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return data
  },

  async getUserStats(supabase: SupabaseClient, userId: string, days = 30) {
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)

    const { data, error } = await supabase
      .from('vocabulary_usage_log')
      .select('usage_type, was_successful, scenario, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', sinceDate.toISOString())

    if (error) throw error
    return data
  }
}

// ============================================================================
// Learning Difficulty Services
// ============================================================================

export const learningDifficultyService = {
  async create(supabase: SupabaseClient, data: CreateLearningDifficultyData) {
    const { data: difficulty, error } = await supabase
      .from('learning_difficulties')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return difficulty as LearningDifficulty
  },

  async getByUserId(supabase: SupabaseClient, userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('learning_difficulties')
      .select()
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as LearningDifficulty[]
  },

  async getByType(
    supabase: SupabaseClient, 
    userId: string, 
    difficultyType: string,
    days = 30
  ) {
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)

    const { data, error } = await supabase
      .from('learning_difficulties')
      .select()
      .eq('user_id', userId)
      .eq('difficulty_type', difficultyType)
      .gte('timestamp', sinceDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data as LearningDifficulty[]
  },

  async getRecentByScenario(
    supabase: SupabaseClient,
    userId: string,
    scenario: string,
    hours = 24
  ) {
    const sinceDate = new Date()
    sinceDate.setHours(sinceDate.getHours() - hours)

    const { data, error } = await supabase
      .from('learning_difficulties')
      .select()
      .eq('user_id', userId)
      .eq('scenario', scenario)
      .gte('timestamp', sinceDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data as LearningDifficulty[]
  }
}

// ============================================================================
// Learning Pattern Services
// ============================================================================

export const learningPatternService = {
  async create(supabase: SupabaseClient, data: CreateLearningPatternData) {
    const { data: pattern, error } = await supabase
      .from('learning_patterns')
      .insert({
        ...data,
        first_detected_at: new Date().toISOString(),
        last_observed_at: new Date().toISOString(),
        total_occurrences: 1
      })
      .select()
      .single()

    if (error) throw error
    return pattern as LearningPattern
  },

  async getActivePatterns(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('learning_patterns')
      .select()
      .eq('user_id', userId)
      .in('pattern_status', ['active', 'improving'])
      .order('confidence_level', { ascending: false })

    if (error) throw error
    return data as LearningPattern[]
  },

  async updatePattern(
    supabase: SupabaseClient,
    patternId: string,
    updates: Partial<LearningPattern>
  ) {
    const { data, error } = await supabase
      .from('learning_patterns')
      .update({
        ...updates,
        last_observed_at: new Date().toISOString()
      })
      .eq('id', patternId)
      .select()
      .single()

    if (error) throw error
    return data as LearningPattern
  },

  async incrementOccurrence(supabase: SupabaseClient, patternId: string) {
    const { data, error } = await supabase.rpc('increment_pattern_occurrence', {
      pattern_id: patternId
    })

    if (error) throw error
    return data
  }
}

// ============================================================================
// Remediation Opportunity Services
// ============================================================================

export const remediationService = {
  async create(supabase: SupabaseClient, data: CreateRemediationOpportunityData) {
    const { data: opportunity, error } = await supabase
      .from('remediation_opportunities')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return opportunity as RemediationOpportunity
  },

  async getHighPriority(supabase: SupabaseClient, userId: string, limit = 5) {
    const { data, error } = await supabase
      .from('remediation_opportunities')
      .select()
      .eq('user_id', userId)
      .in('status', ['identified', 'addressing'])
      .order('priority_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as RemediationOpportunity[]
  },

  async getDueForReview(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('remediation_opportunities')
      .select()
      .eq('user_id', userId)
      .lte('next_review_due', new Date().toISOString())
      .order('priority_score', { ascending: false })

    if (error) throw error
    return data as RemediationOpportunity[]
  },

  async updateStatus(
    supabase: SupabaseClient,
    opportunityId: string,
    status: string,
    successRate?: number
  ) {
    const updateData: any = { status }
    if (successRate !== undefined) {
      updateData.success_rate = successRate
    }

    const { data, error } = await supabase
      .from('remediation_opportunities')
      .update(updateData)
      .eq('id', opportunityId)
      .select()
      .single()

    if (error) throw error
    return data as RemediationOpportunity
  }
}

// ============================================================================
// Enhanced Conversation Services
// ============================================================================

export const enhancedConversationService = {
  async create(supabase: SupabaseClient, data: {
    user_id: string
    title: string
    persona: string
    transcript: any[]
    duration: number
    vocabulary_analysis?: VocabularyAnalysis
    struggle_analysis?: StruggleAnalysis
  }) {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return conversation as EnhancedConversation
  },

  async updateAnalysis(
    supabase: SupabaseClient,
    conversationId: string,
    vocabularyAnalysis?: VocabularyAnalysis,
    struggleAnalysis?: StruggleAnalysis
  ) {
    const updateData: any = {}
    if (vocabularyAnalysis) updateData.vocabulary_analysis = vocabularyAnalysis
    if (struggleAnalysis) updateData.struggle_analysis = struggleAnalysis

    const { data, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select()
      .single()

    if (error) throw error
    return data as EnhancedConversation
  },

  async getWithAnalysis(supabase: SupabaseClient, conversationId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('id', conversationId)
      .single()

    if (error) throw error
    return data as EnhancedConversation
  }
}

// ============================================================================
// Enhanced Progress Services
// ============================================================================

export const enhancedProgressService = {
  async updateVocabularyStats(
    supabase: SupabaseClient,
    userId: string,
    vocabularyStats: VocabularyStats
  ) {
    const { data, error } = await supabase
      .from('progress')
      .update({ vocabulary_stats: vocabularyStats })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as EnhancedProgress
  },

  async updateLearningVelocity(
    supabase: SupabaseClient,
    userId: string,
    learningVelocity: LearningVelocity
  ) {
    const { data, error } = await supabase
      .from('progress')
      .update({ learning_velocity: learningVelocity })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as EnhancedProgress
  },

  async getEnhancedProgress(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('progress')
      .select()
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as EnhancedProgress | null
  }
}

// ============================================================================
// Helper Database Functions (to be created in Supabase)
// ============================================================================

export const databaseHelpers = {
  async createIncrementPatternOccurrenceFunction(supabase: SupabaseClient) {
    const { error } = await supabase.rpc('create_increment_pattern_function')
    if (error) throw error
  },

  async calculateVocabularyStats(
    supabase: SupabaseClient,
    userId: string
  ): Promise<VocabularyStats> {
    // This would be implemented as a stored procedure for efficiency
    // For now, we'll calculate it client-side
    const entries = await vocabularyEntryService.getByUserId(supabase, userId)
    
    const stats: VocabularyStats = {
      totalWordsEncountered: entries.length,
      totalWordsUsed: entries.filter(e => e.mastery_level === 'used' || e.mastery_level === 'mastered').length,
      totalWordsMastered: entries.filter(e => e.mastery_level === 'mastered').length,
      wordsIntroducedThisWeek: 0, // Calculate from created_at
      averageWordsPerConversation: 0, // Calculate from usage logs
      strongestCategory: 'general',
      weakestCategory: 'general',
      masteryByScenario: {}
    }

    return stats
  }
}

// ============================================================================
// Batch Operations for Performance
// ============================================================================

export const batchOperations = {
  async createMultipleVocabularyEntries(
    supabase: SupabaseClient,
    entries: CreateVocabularyEntryData[]
  ) {
    const { data, error } = await supabase
      .from('vocabulary_entries')
      .insert(entries.map(entry => ({
        ...entry,
        first_encountered_at: new Date().toISOString()
      })))
      .select()

    if (error) throw error
    return data as VocabularyEntry[]
  },

  async logMultipleUsages(
    supabase: SupabaseClient,
    usages: LogVocabularyUsageData[]
  ) {
    const { data, error } = await supabase
      .from('vocabulary_usage_log')
      .insert(usages)
      .select()

    if (error) throw error
    return data as VocabularyUsageLog[]
  },

  async createMultipleDifficulties(
    supabase: SupabaseClient,
    difficulties: CreateLearningDifficultyData[]
  ) {
    const { data, error } = await supabase
      .from('learning_difficulties')
      .insert(difficulties)
      .select()

    if (error) throw error
    return data as LearningDifficulty[]
  }
}