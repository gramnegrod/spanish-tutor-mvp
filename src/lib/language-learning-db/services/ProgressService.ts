/**
 * Progress Service
 * 
 * Handles user progress tracking and vocabulary management
 */

import type {
  StorageAdapter,
  UserProgress,
  VocabularyProgress,
  SkillProgress,
  ProgressQuery
} from '../types'

import { ValidationError } from '../types'

export class ProgressService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Get user progress for a language
   */
  async get(userId: string, language: string): Promise<UserProgress | null> {
    return this.adapter.getProgress(userId, language)
  }

  /**
   * Update user progress
   */
  async update(
    userId: string, 
    language: string, 
    updates: Partial<UserProgress>
  ): Promise<UserProgress> {
    this.validateProgressUpdates(updates)
    return this.adapter.updateProgress(userId, language, updates)
  }

  /**
   * Initialize progress for new user/language combination
   */
  async initialize(userId: string, language: string, level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): Promise<UserProgress> {
    const initialProgress: Partial<UserProgress> = {
      userId,
      language,
      overallLevel: level,
      totalMinutesPracticed: 0,
      conversationsCompleted: 0,
      vocabulary: [],
      skills: this.createInitialSkills(),
      streak: 0,
      achievements: [],
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return this.adapter.updateProgress(userId, language, initialProgress)
  }

  /**
   * Track vocabulary usage
   */
  async trackVocabulary(
    userId: string, 
    language: string, 
    words: string[], 
    context?: string
  ): Promise<void> {
    const currentProgress = await this.get(userId, language)
    if (!currentProgress) {
      await this.initialize(userId, language)
      return this.trackVocabulary(userId, language, words, context)
    }

    const vocabularyUpdates: VocabularyProgress[] = words.map(word => {
      const existing = currentProgress.vocabulary.find(v => v.word === word)
      
      if (existing) {
        return {
          ...existing,
          timesUsed: existing.timesUsed + 1,
          lastEncountered: new Date().toISOString(),
          context: context || existing.context
        }
      } else {
        return {
          word,
          language,
          timesEncountered: 1,
          timesUsed: 1,
          masteryLevel: 'learning' as const,
          lastEncountered: new Date().toISOString(),
          context
        }
      }
    })

    await this.adapter.trackVocabulary(userId, language, vocabularyUpdates)
  }

  /**
   * Update skill progress
   */
  async updateSkill(
    userId: string,
    language: string,
    skill: SkillProgress['skill'],
    improvement: number
  ): Promise<UserProgress> {
    const currentProgress = await this.get(userId, language)
    if (!currentProgress) {
      await this.initialize(userId, language)
      return this.updateSkill(userId, language, skill, improvement)
    }

    const updatedSkills = currentProgress.skills.map(s => {
      if (s.skill === skill) {
        const newLevel = Math.max(0, Math.min(100, s.level + improvement))
        const trend = improvement > 0 ? 'improving' : 
                      improvement < 0 ? 'declining' : 'stable'
        
        return {
          ...s,
          level: newLevel,
          trend: trend as SkillProgress['trend'],
          lastUpdated: new Date().toISOString()
        }
      }
      return s
    })

    return this.update(userId, language, {
      skills: updatedSkills,
      lastActive: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  /**
   * Add practice time
   */
  async addPracticeTime(
    userId: string,
    language: string,
    minutes: number
  ): Promise<UserProgress> {
    const currentProgress = await this.get(userId, language)
    if (!currentProgress) {
      await this.initialize(userId, language)
      return this.addPracticeTime(userId, language, minutes)
    }

    return this.update(userId, language, {
      totalMinutesPracticed: currentProgress.totalMinutesPracticed + minutes,
      lastActive: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  /**
   * Increment conversation count
   */
  async incrementConversations(userId: string, language: string): Promise<UserProgress> {
    const currentProgress = await this.get(userId, language)
    if (!currentProgress) {
      await this.initialize(userId, language)
      return this.incrementConversations(userId, language)
    }

    return this.update(userId, language, {
      conversationsCompleted: currentProgress.conversationsCompleted + 1,
      lastActive: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  /**
   * Update streak
   */
  async updateStreak(userId: string, language: string): Promise<UserProgress> {
    const currentProgress = await this.get(userId, language)
    if (!currentProgress) {
      await this.initialize(userId, language)
      return this.updateStreak(userId, language)
    }

    const now = new Date()
    const lastActive = new Date(currentProgress.lastActive)
    const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

    let newStreak = currentProgress.streak
    if (daysDiff === 1) {
      // Consecutive day
      newStreak += 1
    } else if (daysDiff > 1) {
      // Streak broken
      newStreak = 1
    }
    // If daysDiff === 0, keep same streak (same day activity)

    return this.update(userId, language, {
      streak: newStreak,
      lastActive: now.toISOString(),
      updatedAt: now.toISOString()
    })
  }

  /**
   * Get vocabulary mastery stats
   */
  async getVocabularyStats(userId: string, language: string): Promise<{
    total: number
    learning: number
    practicing: number
    mastered: number
    recentlyLearned: VocabularyProgress[]
  }> {
    const progress = await this.get(userId, language)
    if (!progress) {
      return {
        total: 0,
        learning: 0,
        practicing: 0,
        mastered: 0,
        recentlyLearned: []
      }
    }

    const vocab = progress.vocabulary
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    return {
      total: vocab.length,
      learning: vocab.filter(v => v.masteryLevel === 'learning').length,
      practicing: vocab.filter(v => v.masteryLevel === 'practicing').length,
      mastered: vocab.filter(v => v.masteryLevel === 'mastered').length,
      recentlyLearned: vocab
        .filter(v => new Date(v.lastEncountered) > weekAgo)
        .sort((a, b) => new Date(b.lastEncountered).getTime() - new Date(a.lastEncountered).getTime())
        .slice(0, 20)
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createInitialSkills(): SkillProgress[] {
    const skills: SkillProgress['skill'][] = [
      'listening', 'speaking', 'reading', 'writing', 
      'grammar', 'vocabulary', 'pronunciation'
    ]

    return skills.map(skill => ({
      skill,
      level: 0,
      trend: 'stable' as const,
      lastUpdated: new Date().toISOString()
    }))
  }

  private validateProgressUpdates(updates: Partial<UserProgress>): void {
    if (updates.totalMinutesPracticed !== undefined && updates.totalMinutesPracticed < 0) {
      throw new ValidationError(
        'Total minutes practiced cannot be negative',
        'totalMinutesPracticed',
        updates.totalMinutesPracticed
      )
    }

    if (updates.conversationsCompleted !== undefined && updates.conversationsCompleted < 0) {
      throw new ValidationError(
        'Conversations completed cannot be negative',
        'conversationsCompleted',
        updates.conversationsCompleted
      )
    }

    if (updates.streak !== undefined && updates.streak < 0) {
      throw new ValidationError(
        'Streak cannot be negative',
        'streak',
        updates.streak
      )
    }
  }
}