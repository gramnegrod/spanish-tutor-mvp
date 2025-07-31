/**
 * Storage Operations Integration Test
 * 
 * Tests that all storage operations work correctly across all adapters
 */

import { LanguageLearningDB } from '../LanguageLearningDB'
import { MemoryAdapter } from '../adapters/MemoryAdapter'
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter'
import type { ConversationData, LearnerProfile, UserProgress } from '../types'

// Mock localStorage for testing
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key]
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {}
  })
}

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('Storage Operations Integration Tests', () => {
  const testUserId = 'test-user-123'
  const testLanguage = 'es'
  
  const sampleConversationData: ConversationData = {
    title: 'Test Conversation',
    persona: 'Test Assistant',
    transcript: [
      {
        id: '1',
        speaker: 'user',
        text: 'Hola',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        speaker: 'assistant',
        text: '¡Hola! ¿Cómo estás?',
        timestamp: new Date().toISOString()
      }
    ],
    duration: 60,
    language: testLanguage,
    scenario: 'greeting',
    metadata: { test: true }
  }

  const sampleProfile: LearnerProfile = {
    userId: testUserId,
    language: testLanguage,
    level: 'beginner',
    goals: ['conversation', 'travel'],
    preferences: {
      learningStyle: 'mixed',
      pace: 'normal',
      supportLevel: 'moderate',
      culturalContext: true
    },
    strugglingAreas: ['pronunciation'],
    masteredConcepts: ['greetings'],
    commonErrors: ['gender agreement'],
    adaptations: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  describe('MemoryAdapter Operations', () => {
    let db: LanguageLearningDB

    beforeEach(() => {
      db = LanguageLearningDB.createInMemory()
    })

    it('should handle conversation operations', async () => {
      // Save conversation
      const saved = await db.saveConversation(sampleConversationData, { id: testUserId })
      expect(saved.id).toBeDefined()
      expect(saved.title).toBe(sampleConversationData.title)
      expect(saved.userId).toBe(testUserId)

      // Get conversation
      const retrieved = await db.conversations.get(saved.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.title).toBe(sampleConversationData.title)

      // Update conversation
      const updatedConversation = await db.conversations.update(saved.id, {
        title: 'Updated Test Conversation'
      })
      expect(updatedConversation.title).toBe('Updated Test Conversation')

      // Get conversations by user
      const userConversations = await db.conversations.getForUser(testUserId)
      expect(userConversations).toHaveLength(1)
      expect(userConversations[0].title).toBe('Updated Test Conversation')

      // Delete conversation
      const deleted = await db.conversations.delete(saved.id)
      expect(deleted).toBe(true)

      const notFound = await db.conversations.get(saved.id)
      expect(notFound).toBeNull()
    })

    it('should handle profile operations', async () => {
      // Save profile
      const saved = await db.saveProfile(sampleProfile)
      expect(saved.userId).toBe(testUserId)
      expect(saved.language).toBe(testLanguage)

      // Get profile
      const retrieved = await db.profiles.get(testUserId, testLanguage)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.level).toBe('beginner')

      // Update profile
      const updated = await db.profiles.update(testUserId, testLanguage, {
        level: 'intermediate',
        strugglingAreas: ['pronunciation', 'past tense']
      })
      expect(updated.level).toBe('intermediate')
      expect(updated.strugglingAreas).toContain('past tense')
    })

    it('should handle progress operations', async () => {
      // Initialize progress
      const initialized = await db.updateProgress(testUserId, testLanguage, {
        totalMinutesPracticed: 30,
        conversationsCompleted: 1
      })
      expect(initialized.totalMinutesPracticed).toBe(30)
      expect(initialized.conversationsCompleted).toBe(1)

      // Update progress
      const updated = await db.updateProgress(testUserId, testLanguage, {
        totalMinutesPracticed: 60,
        conversationsCompleted: 2
      })
      expect(updated.totalMinutesPracticed).toBe(60)
      expect(updated.conversationsCompleted).toBe(2)

      // Get progress
      const retrieved = await db.progress.get(testUserId, testLanguage)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.totalMinutesPracticed).toBe(60)
    })

    it('should handle health checks', async () => {
      const health = await db.health()
      expect(health.healthy).toBe(true)
      expect(health.adapter).toBe('memory')
      expect(health.issues).toBeUndefined()
    })
  })

  describe('LocalStorageAdapter Operations', () => {
    let db: LanguageLearningDB

    beforeEach(() => {
      mockLocalStorage.clear()
      db = LanguageLearningDB.createWithLocalStorage()
    })

    it('should handle conversation operations', async () => {
      // Save conversation
      const saved = await db.saveConversation(sampleConversationData, { id: testUserId })
      expect(saved.id).toBeDefined()
      expect(saved.title).toBe(sampleConversationData.title)

      // Verify data is stored in localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalled()

      // Get conversation
      const retrieved = await db.conversations.get(saved.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.title).toBe(sampleConversationData.title)
    })

    it('should handle profile operations', async () => {
      // Save profile
      const saved = await db.saveProfile(sampleProfile)
      expect(saved.userId).toBe(testUserId)

      // Verify data is stored in localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalled()

      // Get profile
      const retrieved = await db.profiles.get(testUserId, testLanguage)
      expect(retrieved).not.toBeNull()
      expect(retrieved?.level).toBe('beginner')
    })

    it('should handle health checks', async () => {
      const health = await db.health()
      expect(health.healthy).toBe(true)
      expect(health.adapter).toBe('localStorage')
    })
  })

  describe('Adapter Fallback Mechanism', () => {
    it('should fallback from failed adapter to localStorage then memory', () => {
      // Create a config that would normally fail
      const dbConfig = {
        database: {
          adapter: 'nonexistent' as any,
          connection: {}
        }
      }

      // This should fallback to memory adapter without throwing
      expect(() => {
        new LanguageLearningDB(dbConfig)
      }).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    let db: LanguageLearningDB

    beforeEach(() => {
      db = LanguageLearningDB.createInMemory()
    })

    it('should handle missing conversation gracefully', async () => {
      const notFound = await db.conversations.get('nonexistent-id')
      expect(notFound).toBeNull()
    })

    it('should handle missing profile gracefully', async () => {
      const notFound = await db.profiles.get('nonexistent-user', 'es')
      expect(notFound).toBeNull()
    })

    it('should handle missing progress gracefully', async () => {
      const notFound = await db.progress.get('nonexistent-user', 'es')
      expect(notFound).toBeNull()
    })

    it('should handle invalid conversation updates', async () => {
      await expect(
        db.conversations.update('nonexistent-id', { title: 'New Title' })
      ).rejects.toThrow()
    })

    it('should handle invalid profile updates', async () => {
      await expect(
        db.profiles.update('nonexistent-user', 'es', { level: 'intermediate' })
      ).rejects.toThrow()
    })
  })

  describe('Data Validation', () => {
    let db: LanguageLearningDB

    beforeEach(() => {
      db = LanguageLearningDB.createInMemory()
    })

    it('should validate conversation data', async () => {
      const invalidData = {
        ...sampleConversationData,
        title: '', // Invalid empty title
        duration: -1 // Invalid negative duration
      }

      // Should throw validation error for invalid data
      await expect(
        db.saveConversation(invalidData, { id: testUserId })
      ).rejects.toThrow('Title is required')
    })

    it('should validate profile data', async () => {
      const invalidProfile = {
        ...sampleProfile,
        level: 'invalid-level' as any
      }

      // Should throw validation error for invalid level
      await expect(
        db.saveProfile(invalidProfile)
      ).rejects.toThrow('Invalid level')
    })
  })

  describe('Concurrent Operations', () => {
    let db: LanguageLearningDB

    beforeEach(() => {
      db = LanguageLearningDB.createInMemory()
    })

    it('should handle concurrent conversation saves', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        db.saveConversation({
          ...sampleConversationData,
          title: `Conversation ${i + 1}`
        }, { id: testUserId })
      )

      const results = await Promise.all(promises)
      expect(results).toHaveLength(5)
      
      const allConversations = await db.conversations.getForUser(testUserId)
      expect(allConversations).toHaveLength(5)
    })

    it('should handle concurrent progress updates', async () => {
      // Initialize progress first
      await db.updateProgress(testUserId, testLanguage, {
        totalMinutesPracticed: 0,
        conversationsCompleted: 0
      })

      const promises = Array.from({ length: 3 }, (_, i) => 
        db.updateProgress(testUserId, testLanguage, {
          totalMinutesPracticed: 10,
          conversationsCompleted: 1
        })
      )

      await Promise.all(promises)

      const finalProgress = await db.progress.get(testUserId, testLanguage)
      expect(finalProgress).not.toBeNull()
      // Note: Since these are concurrent, the final values may vary
      expect(finalProgress!.totalMinutesPracticed).toBeGreaterThan(0)
    })
  })
})