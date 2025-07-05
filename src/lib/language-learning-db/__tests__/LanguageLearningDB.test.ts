/**
 * Language Learning Database - Core Tests
 * 
 * Tests the main functionality of the LanguageLearningDB module
 */

import { LanguageLearningDB } from '../LanguageLearningDB'
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter'
import type { ConversationData, User } from '../types'

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] || null
  }
})()

// @ts-ignore
global.localStorage = localStorageMock

describe('LanguageLearningDB', () => {
  let db: LanguageLearningDB
  const testUser: User = { id: 'test-user-123', email: 'test@example.com' }
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Create database with localStorage adapter
    db = LanguageLearningDB.createWithLocalStorage()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Database Creation', () => {
    it('should create database instance with localStorage', () => {
      expect(db).toBeInstanceOf(LanguageLearningDB)
      expect(db.conversations).toBeDefined()
      expect(db.progress).toBeDefined()
      expect(db.profiles).toBeDefined()
      expect(db.analytics).toBeDefined()
    })

    it('should check health successfully', async () => {
      const isHealthy = await db.health()
      expect(isHealthy).toBe(true)
    })
  })

  describe('Conversation Management', () => {
    const sampleConversation: ConversationData = {
      title: 'Test Taco Ordering',
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
    }

    it('should save a conversation', async () => {
      const conversation = await db.saveConversation(sampleConversation, testUser)
      
      expect(conversation).toBeDefined()
      expect(conversation.id).toBeDefined()
      expect(conversation.title).toBe(sampleConversation.title)
      expect(conversation.userId).toBe(testUser.id)
      expect(conversation.transcript).toHaveLength(2)
    })

    it('should retrieve saved conversations', async () => {
      // Save multiple conversations
      await db.saveConversation(sampleConversation, testUser)
      await db.saveConversation({
        ...sampleConversation,
        title: 'Second Conversation'
      }, testUser)

      // Retrieve conversations
      const conversations = await db.conversations.find({
        userId: testUser.id
      })

      expect(conversations).toHaveLength(2)
      expect(conversations[0].userId).toBe(testUser.id)
      expect(conversations[1].title).toBe('Second Conversation')
    })

    it('should get conversation statistics', async () => {
      // Save test conversations
      await db.saveConversation(sampleConversation, testUser)
      await db.saveConversation({
        ...sampleConversation,
        duration: 180,
        scenario: 'restaurant'
      }, testUser)

      const stats = await db.conversations.getStats(testUser.id, 'es')
      
      expect(stats.total).toBe(2)
      expect(stats.totalDuration).toBe(300) // 120 + 180
      expect(stats.averageDuration).toBe(150)
      expect(stats.scenarios['taco_vendor']).toBe(1)
      expect(stats.scenarios['restaurant']).toBe(1)
    })
  })

  describe('Progress Tracking', () => {
    it('should initialize user progress', async () => {
      const progress = await db.progress.initialize(testUser.id, 'es', 'beginner')
      
      expect(progress).toBeDefined()
      expect(progress.userId).toBe(testUser.id)
      expect(progress.language).toBe('es')
      expect(progress.overallLevel).toBe('beginner')
      expect(progress.totalMinutesPracticed).toBe(0)
      expect(progress.conversationsCompleted).toBe(0)
      expect(progress.vocabulary).toHaveLength(0)
      expect(progress.skills).toHaveLength(7) // All skill types
    })

    it('should track vocabulary', async () => {
      await db.progress.initialize(testUser.id, 'es')
      
      const words = ['hola', 'tacos', 'quiero', 'pastor']
      await db.progress.trackVocabulary(testUser.id, 'es', words, 'taco_vendor')
      
      const progress = await db.progress.get(testUser.id, 'es')
      expect(progress?.vocabulary).toHaveLength(4)
      expect(progress?.vocabulary[0].word).toBe('hola')
      expect(progress?.vocabulary[0].timesUsed).toBe(1)
      expect(progress?.vocabulary[0].context).toBe('taco_vendor')
    })

    it('should update practice time', async () => {
      await db.progress.initialize(testUser.id, 'es')
      
      await db.progress.addPracticeTime(testUser.id, 'es', 15)
      await db.progress.addPracticeTime(testUser.id, 'es', 20)
      
      const progress = await db.progress.get(testUser.id, 'es')
      expect(progress?.totalMinutesPracticed).toBe(35)
    })

    it('should update skill levels', async () => {
      await db.progress.initialize(testUser.id, 'es')
      
      await db.progress.updateSkill(testUser.id, 'es', 'pronunciation', 10)
      await db.progress.updateSkill(testUser.id, 'es', 'pronunciation', 5)
      
      const progress = await db.progress.get(testUser.id, 'es')
      const pronunciationSkill = progress?.skills.find(s => s.skill === 'pronunciation')
      
      expect(pronunciationSkill?.level).toBe(15)
      expect(pronunciationSkill?.trend).toBe('improving')
    })

    it('should get vocabulary statistics', async () => {
      await db.progress.initialize(testUser.id, 'es')
      
      // Track vocabulary with different mastery levels
      await db.progress.trackVocabulary(testUser.id, 'es', ['hola', 'gracias'], 'greetings')
      
      // Update vocabulary directly to test stats
      const progress = await db.progress.get(testUser.id, 'es')
      if (progress) {
        progress.vocabulary[0].masteryLevel = 'mastered'
        progress.vocabulary[1].masteryLevel = 'practicing'
        await db.progress.update(testUser.id, 'es', progress)
      }
      
      const stats = await db.progress.getVocabularyStats(testUser.id, 'es')
      
      expect(stats.total).toBe(2)
      expect(stats.mastered).toBe(1)
      expect(stats.practicing).toBe(1)
      expect(stats.learning).toBe(0)
    })
  })

  describe('Learner Profiles', () => {
    it('should create learner profile', async () => {
      const profile = await db.profiles.create(testUser.id, 'es', {
        level: 'intermediate',
        goals: ['travel', 'business'],
        preferences: {
          learningStyle: 'visual',
          pace: 'fast',
          supportLevel: 'minimal',
          culturalContext: true
        }
      })
      
      expect(profile).toBeDefined()
      expect(profile.userId).toBe(testUser.id)
      expect(profile.language).toBe('es')
      expect(profile.level).toBe('intermediate')
      expect(profile.goals).toContain('travel')
      expect(profile.preferences.learningStyle).toBe('visual')
    })

    it('should update preferences', async () => {
      await db.profiles.create(testUser.id, 'es')
      
      const updated = await db.profiles.updatePreferences(testUser.id, 'es', {
        pace: 'slow',
        culturalContext: false
      })
      
      expect(updated.preferences.pace).toBe('slow')
      expect(updated.preferences.culturalContext).toBe(false)
      expect(updated.preferences.learningStyle).toBe('mixed') // Unchanged
    })

    it('should track struggling areas and mastered concepts', async () => {
      await db.profiles.create(testUser.id, 'es')
      
      await db.profiles.addStrugglingArea(testUser.id, 'es', 'verb_conjugation')
      await db.profiles.addMasteredConcept(testUser.id, 'es', 'greetings')
      
      const profile = await db.profiles.get(testUser.id, 'es')
      expect(profile?.strugglingAreas).toContain('verb_conjugation')
      expect(profile?.masteredConcepts).toContain('greetings')
    })

    it('should advance user level', async () => {
      await db.profiles.create(testUser.id, 'es', { level: 'beginner' })
      
      const advanced = await db.profiles.advanceLevel(testUser.id, 'es')
      expect(advanced.level).toBe('intermediate')
      
      const advancedAgain = await db.profiles.advanceLevel(testUser.id, 'es')
      expect(advancedAgain.level).toBe('advanced')
    })

    it('should get learning recommendations', async () => {
      await db.profiles.create(testUser.id, 'es', {
        level: 'intermediate',
        strugglingAreas: ['pronunciation', 'past_tense']
      })
      
      const recommendations = await db.profiles.getRecommendations(testUser.id, 'es')
      
      expect(recommendations).toBeDefined()
      expect(recommendations.suggestedScenarios).toHaveLength(3)
      expect(recommendations.focusAreas).toContain('pronunciation')
      expect(recommendations.preferredDifficulty).toBe('medium')
      expect(recommendations.recommendedPracticeTime).toBe(15)
    })
  })

  describe('Analytics', () => {
    it('should save learning session', async () => {
      const session = await db.analytics.createSessionFromConversation(
        testUser.id,
        'conv-123',
        300, // 5 minutes
        'es',
        'taco_vendor',
        {
          averageConfidence: 0.75,
          wordsSpoken: 45,
          mistakeCount: 3
        }
      )
      
      expect(session).toBeDefined()
      expect(session.userId).toBe(testUser.id)
      expect(session.duration).toBe(300)
      expect(session.metricsCollected.averageConfidence).toBe(0.75)
    })

    it('should get user analytics', async () => {
      // Create test sessions
      await db.analytics.createSessionFromConversation(
        testUser.id, 'conv-1', 300, 'es', 'taco_vendor',
        { averageConfidence: 0.6, wordsSpoken: 30 }
      )
      await db.analytics.createSessionFromConversation(
        testUser.id, 'conv-2', 240, 'es', 'restaurant',
        { averageConfidence: 0.8, wordsSpoken: 40 }
      )
      
      const analytics = await db.analytics.getUserAnalytics(testUser.id, 'es', 'month')
      
      expect(analytics.totalSessions).toBe(2)
      expect(analytics.totalDuration).toBe(540)
      expect(analytics.averageSessionLength).toBe(270)
      expect(analytics.averageConfidence).toBeCloseTo(0.7, 1)
    })
  })

  describe('Integrated User Flow', () => {
    it('should handle complete user journey', async () => {
      // 1. Create profile
      await db.profiles.create(testUser.id, 'es', {
        level: 'beginner',
        goals: ['travel']
      })

      // 2. Initialize progress
      await db.progress.initialize(testUser.id, 'es', 'beginner')

      // 3. Save conversation
      const conversation = await db.saveConversation({
        title: 'First Practice',
        transcript: [
          { id: '1', speaker: 'assistant', text: 'Hola!', timestamp: new Date().toISOString() },
          { id: '2', speaker: 'user', text: 'Hola, quiero tacos', timestamp: new Date().toISOString() }
        ],
        duration: 120,
        language: 'es',
        scenario: 'taco_vendor'
      }, testUser)

      // 4. Track vocabulary from conversation
      await db.progress.trackVocabulary(testUser.id, 'es', ['hola', 'quiero', 'tacos'])

      // 5. Update progress
      await db.progress.addPracticeTime(testUser.id, 'es', 2)
      await db.progress.incrementConversations(testUser.id, 'es')

      // 6. Create analytics session
      await db.analytics.createSessionFromConversation(
        testUser.id,
        conversation.id,
        120,
        'es',
        'taco_vendor',
        { averageConfidence: 0.7, wordsSpoken: 3 }
      )

      // 7. Get user data
      const userData = await db.getUserData(testUser.id, 'es')
      
      expect(userData.profile).toBeDefined()
      expect(userData.profile?.level).toBe('beginner')
      expect(userData.progress).toBeDefined()
      expect(userData.progress?.conversationsCompleted).toBe(1)
      expect(userData.progress?.vocabulary).toHaveLength(3)
      expect(userData.recentConversations).toHaveLength(1)
      expect(userData.recentConversations[0].title).toBe('First Practice')
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      await expect(
        db.saveConversation({
          title: '', // Invalid - empty title
          transcript: [],
          duration: 120,
          language: 'es'
        }, testUser)
      ).rejects.toThrow('Title is required')
    })

    it('should handle missing progress record', async () => {
      await expect(
        db.progress.trackVocabulary('non-existent-user', 'es', ['word'])
      ).rejects.toThrow('Progress record not found')
    })

    it('should handle invalid skill updates', async () => {
      await db.progress.initialize(testUser.id, 'es')
      
      await expect(
        db.progress.update(testUser.id, 'es', {
          totalMinutesPracticed: -10 // Invalid negative value
        })
      ).rejects.toThrow('cannot be negative')
    })
  })
})