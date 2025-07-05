/**
 * Profile Service
 * 
 * Handles learner profile management and adaptations
 */

import type {
  StorageAdapter,
  LearnerProfile
} from '../types'

import { ValidationError } from '../types'

export class ProfileService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Get learner profile
   */
  async get(userId: string, language: string): Promise<LearnerProfile | null> {
    return this.adapter.getProfile(userId, language)
  }

  /**
   * Save learner profile
   */
  async save(profile: LearnerProfile): Promise<LearnerProfile> {
    this.validateProfile(profile)
    return this.adapter.saveProfile(profile)
  }

  /**
   * Update learner profile
   */
  async update(
    userId: string, 
    language: string, 
    updates: Partial<LearnerProfile>
  ): Promise<LearnerProfile> {
    if (updates.preferences) {
      this.validatePreferences(updates.preferences)
    }
    
    return this.adapter.updateProfile(userId, language, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  /**
   * Create initial profile for new user
   */
  async create(
    userId: string,
    language: string,
    initialData: Partial<LearnerProfile> = {}
  ): Promise<LearnerProfile> {
    const defaultProfile: LearnerProfile = {
      userId,
      language,
      level: 'beginner',
      goals: [],
      preferences: {
        learningStyle: 'mixed',
        pace: 'normal',
        supportLevel: 'moderate',
        culturalContext: true
      },
      strugglingAreas: [],
      masteredConcepts: [],
      commonErrors: [],
      adaptations: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...initialData
    }

    return this.save(defaultProfile)
  }

  /**
   * Add struggling area
   */
  async addStrugglingArea(
    userId: string,
    language: string,
    area: string
  ): Promise<LearnerProfile> {
    const profile = await this.get(userId, language)
    if (!profile) {
      throw new ValidationError('Profile not found', 'userId', userId)
    }

    const strugglingAreas = [...new Set([...profile.strugglingAreas, area])]
    return this.update(userId, language, { strugglingAreas })
  }

  /**
   * Remove struggling area (when mastered)
   */
  async removeStrugglingArea(
    userId: string,
    language: string,
    area: string
  ): Promise<LearnerProfile> {
    const profile = await this.get(userId, language)
    if (!profile) {
      throw new ValidationError('Profile not found', 'userId', userId)
    }

    const strugglingAreas = profile.strugglingAreas.filter(a => a !== area)
    const masteredConcepts = [...new Set([...profile.masteredConcepts, area])]
    
    return this.update(userId, language, { strugglingAreas, masteredConcepts })
  }

  /**
   * Add mastered concept
   */
  async addMasteredConcept(
    userId: string,
    language: string,
    concept: string
  ): Promise<LearnerProfile> {
    const profile = await this.get(userId, language)
    if (!profile) {
      throw new ValidationError('Profile not found', 'userId', userId)
    }

    const masteredConcepts = [...new Set([...profile.masteredConcepts, concept])]
    return this.update(userId, language, { masteredConcepts })
  }

  /**
   * Track common error
   */
  async trackError(
    userId: string,
    language: string,
    error: string
  ): Promise<LearnerProfile> {
    const profile = await this.get(userId, language)
    if (!profile) {
      throw new ValidationError('Profile not found', 'userId', userId)
    }

    // Add to common errors, keeping most recent 50
    const commonErrors = [error, ...profile.commonErrors.filter(e => e !== error)].slice(0, 50)
    return this.update(userId, language, { commonErrors })
  }

  /**
   * Update preferences
   */
  async updatePreferences(
    userId: string,
    language: string,
    preferences: Partial<LearnerProfile['preferences']>
  ): Promise<LearnerProfile> {
    const profile = await this.get(userId, language)
    if (!profile) {
      throw new ValidationError('Profile not found', 'userId', userId)
    }

    const updatedPreferences = { ...profile.preferences, ...preferences }
    this.validatePreferences(updatedPreferences)
    
    return this.update(userId, language, { preferences: updatedPreferences })
  }

  /**
   * Update adaptations
   */
  async updateAdaptations(
    userId: string,
    language: string,
    adaptations: Record<string, any>
  ): Promise<LearnerProfile> {
    const profile = await this.get(userId, language)
    if (!profile) {
      throw new ValidationError('Profile not found', 'userId', userId)
    }

    const updatedAdaptations = { ...profile.adaptations, ...adaptations }
    return this.update(userId, language, { adaptations: updatedAdaptations })
  }

  /**
   * Advance user level
   */
  async advanceLevel(userId: string, language: string): Promise<LearnerProfile> {
    const profile = await this.get(userId, language)
    if (!profile) {
      throw new ValidationError('Profile not found', 'userId', userId)
    }

    let newLevel: LearnerProfile['level']
    switch (profile.level) {
      case 'beginner':
        newLevel = 'intermediate'
        break
      case 'intermediate':
        newLevel = 'advanced'
        break
      case 'advanced':
        newLevel = 'advanced' // Stay at advanced
        break
      default:
        newLevel = profile.level
    }

    return this.update(userId, language, { level: newLevel })
  }

  /**
   * Get learning recommendations based on profile
   */
  async getRecommendations(userId: string, language: string): Promise<{
    suggestedScenarios: string[]
    focusAreas: string[]
    preferredDifficulty: 'easy' | 'medium' | 'hard'
    recommendedPracticeTime: number
  }> {
    const profile = await this.get(userId, language)
    if (!profile) {
      return {
        suggestedScenarios: ['basic_conversation'],
        focusAreas: ['vocabulary', 'pronunciation'],
        preferredDifficulty: 'easy',
        recommendedPracticeTime: 15
      }
    }

    // Generate recommendations based on profile
    const focusAreas = profile.strugglingAreas.length > 0 
      ? profile.strugglingAreas.slice(0, 3)
      : ['vocabulary', 'grammar', 'pronunciation']

    const preferredDifficulty = profile.level === 'beginner' ? 'easy' :
                               profile.level === 'intermediate' ? 'medium' : 'hard'

    const recommendedPracticeTime = profile.preferences.pace === 'slow' ? 10 :
                                   profile.preferences.pace === 'normal' ? 15 : 20

    const suggestedScenarios = this.getScenariosForLevel(profile.level)

    return {
      suggestedScenarios,
      focusAreas,
      preferredDifficulty,
      recommendedPracticeTime
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getScenariosForLevel(level: LearnerProfile['level']): string[] {
    const scenarios = {
      beginner: ['greetings', 'basic_shopping', 'restaurant_ordering'],
      intermediate: ['travel_planning', 'business_meeting', 'cultural_discussion'],
      advanced: ['debate', 'technical_discussion', 'literature_analysis']
    }
    return scenarios[level] || scenarios.beginner
  }

  private validateProfile(profile: LearnerProfile): void {
    if (!profile.userId || profile.userId.trim().length === 0) {
      throw new ValidationError('User ID is required', 'userId', profile.userId)
    }

    if (!profile.language || profile.language.trim().length === 0) {
      throw new ValidationError('Language is required', 'language', profile.language)
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(profile.level)) {
      throw new ValidationError('Invalid level', 'level', profile.level)
    }

    if (profile.preferences) {
      this.validatePreferences(profile.preferences)
    }
  }

  private validatePreferences(preferences: LearnerProfile['preferences']): void {
    if (!['visual', 'auditory', 'kinesthetic', 'mixed'].includes(preferences.learningStyle)) {
      throw new ValidationError('Invalid learning style', 'learningStyle', preferences.learningStyle)
    }

    if (!['slow', 'normal', 'fast'].includes(preferences.pace)) {
      throw new ValidationError('Invalid pace', 'pace', preferences.pace)
    }

    if (!['minimal', 'moderate', 'heavy'].includes(preferences.supportLevel)) {
      throw new ValidationError('Invalid support level', 'supportLevel', preferences.supportLevel)
    }

    if (typeof preferences.culturalContext !== 'boolean') {
      throw new ValidationError('Cultural context must be boolean', 'culturalContext', preferences.culturalContext)
    }
  }
}