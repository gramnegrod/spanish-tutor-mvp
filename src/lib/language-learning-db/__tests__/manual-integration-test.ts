/**
 * Integration Test for Language Learning Database
 * 
 * This file demonstrates real-world usage in a Next.js application
 * 
 * NOTE: This is not a Jest test file. It's a manual integration test runner.
 * To run: node -r ts-node/register src/lib/language-learning-db/__tests__/test-integration.ts
 */

// @ts-nocheck - Skip TypeScript checking for this manual test file

import { LanguageLearningDB } from '../index'
import type { User } from '../types'

// Mock environment variables if needed
if (typeof process !== 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.com'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key'
}

/**
 * Test the Language Learning DB in different scenarios
 */
export async function runIntegrationTests() {
  console.log('🧪 Running Language Learning DB Integration Tests...\n')

  // Test 1: Guest Mode with LocalStorage
  console.log('📝 Test 1: Guest Mode Operations')
  await testGuestMode()

  // Test 2: Authenticated Mode (mock)
  console.log('\n📝 Test 2: Authenticated Mode Operations')
  await testAuthenticatedMode()

  // Test 3: Real Application Scenario
  console.log('\n📝 Test 3: Real Application Scenario')
  await testRealScenario()

  console.log('\n✅ All integration tests completed!')
}

/**
 * Test guest mode functionality
 */
async function testGuestMode() {
  const db = LanguageLearningDB.createWithLocalStorage()
  const guestUser: User = { id: 'guest-123' }

  try {
    // Save a conversation
    const conversation = await db.saveConversation({
      title: 'Guest Practice - Taco Ordering',
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
      scenario: 'taco_vendor',
      metadata: {
        practiceType: 'guest',
        device: 'web'
      }
    }, guestUser)

    console.log('✓ Saved guest conversation:', conversation.id)

    // Initialize and update progress
    await db.progress.initialize(guestUser.id, 'es')
    await db.progress.trackVocabulary(guestUser.id, 'es', ['hola', 'quiero', 'tacos', 'pastor'])
    await db.progress.addPracticeTime(guestUser.id, 'es', 2)

    const progress = await db.progress.get(guestUser.id, 'es')
    console.log('✓ Guest progress tracked:', {
      vocabulary: progress?.vocabulary.length,
      minutes: progress?.totalMinutesPracticed
    })

    // Get storage stats (LocalStorage specific)
    const adapter = db.getAdapter() as any
    if (adapter.getStorageStats) {
      const stats = adapter.getStorageStats()
      console.log('✓ Storage stats:', stats)
    }

  } catch (error) {
    console.error('✗ Guest mode test failed:', error)
  }
}

/**
 * Test authenticated mode functionality
 */
async function testAuthenticatedMode() {
  // Note: In real app, would use actual Supabase connection
  // For testing, we'll use localStorage to simulate
  const db = LanguageLearningDB.createWithLocalStorage()
  const authUser: User = { id: 'auth-user-456', email: 'user@example.com' }

  try {
    // Create user profile
    const profile = await db.profiles.create(authUser.id, 'es', {
      level: 'intermediate',
      goals: ['travel', 'business'],
      preferences: {
        learningStyle: 'auditory',
        pace: 'normal',
        supportLevel: 'moderate',
        culturalContext: true
      }
    })
    console.log('✓ Created user profile:', profile.level)

    // Save multiple conversations
    for (let i = 0; i < 3; i++) {
      await db.saveConversation({
        title: `Practice Session ${i + 1}`,
        transcript: [
          {
            id: '1',
            speaker: 'assistant',
            text: '¡Buenos días!',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            speaker: 'user',
            text: 'Buenos días, ¿cómo está?',
            timestamp: new Date().toISOString()
          }
        ],
        duration: 180 + (i * 60),
        language: 'es',
        scenario: i % 2 === 0 ? 'greetings' : 'restaurant'
      }, authUser)
    }

    // Get conversation stats
    const stats = await db.conversations.getStats(authUser.id, 'es')
    console.log('✓ Conversation stats:', stats)

    // Track skill progress
    await db.progress.initialize(authUser.id, 'es', 'intermediate')
    await db.progress.updateSkill(authUser.id, 'es', 'pronunciation', 15)
    await db.progress.updateSkill(authUser.id, 'es', 'vocabulary', 20)
    
    // Create analytics session
    const session = await db.analytics.createSessionFromConversation(
      authUser.id,
      'conv-123',
      300,
      'es',
      'restaurant',
      {
        averageConfidence: 0.85,
        wordsSpoken: 75,
        mistakeCount: 2,
        helpRequests: 1
      }
    )
    console.log('✓ Analytics session created:', session.id)

    // Get comprehensive user data
    const userData = await db.getUserData(authUser.id, 'es')
    console.log('✓ User data retrieved:', {
      hasProfile: !!userData.profile,
      hasProgress: !!userData.progress,
      conversationCount: userData.recentConversations.length
    })

  } catch (error) {
    console.error('✗ Authenticated mode test failed:', error)
  }
}

/**
 * Test real application scenario
 */
async function testRealScenario() {
  const db = LanguageLearningDB.createWithLocalStorage()
  const user: User = { id: 'real-user-789', email: 'learner@example.com' }

  try {
    console.log('🎯 Simulating real Spanish learning session...')

    // 1. User starts app - create/load profile
    let profile = await db.profiles.get(user.id, 'es')
    if (!profile) {
      profile = await db.profiles.create(user.id, 'es', {
        level: 'beginner',
        goals: ['travel'],
        preferences: {
          learningStyle: 'mixed',
          pace: 'normal',
          supportLevel: 'heavy',
          culturalContext: true
        }
      })
      console.log('✓ New user profile created')
    }

    // 2. Start conversation with taco vendor
    const startTime = Date.now()
    const conversationTranscript = [
      { id: '1', speaker: 'assistant' as const, text: '¡Hola güero! ¿Qué va a querer?', timestamp: new Date().toISOString() },
      { id: '2', speaker: 'user' as const, text: 'Hola... uh... quiero tacos', timestamp: new Date().toISOString() },
      { id: '3', speaker: 'assistant' as const, text: '¡Órale! ¿De qué los quiere? Tengo pastor, carnitas, suadero...', timestamp: new Date().toISOString() },
      { id: '4', speaker: 'user' as const, text: 'Dos tacos de pastor, por favor', timestamp: new Date().toISOString() },
      { id: '5', speaker: 'assistant' as const, text: '¿Con todo?', timestamp: new Date().toISOString() },
      { id: '6', speaker: 'user' as const, text: 'Sí, con todo', timestamp: new Date().toISOString() },
      { id: '7', speaker: 'assistant' as const, text: 'Son 40 pesos, joven', timestamp: new Date().toISOString() },
      { id: '8', speaker: 'user' as const, text: 'Gracias', timestamp: new Date().toISOString() }
    ]

    // 3. Save conversation
    const conversation = await db.saveConversation({
      title: 'Taco Ordering Practice',
      persona: 'Don Roberto',
      transcript: conversationTranscript,
      duration: Math.floor((Date.now() - startTime) / 1000),
      language: 'es',
      scenario: 'taco_vendor',
      analysis: {
        vocabularyUsed: ['hola', 'quiero', 'tacos', 'pastor', 'por favor', 'con todo', 'gracias'],
        comprehension: 0.75,
        fluency: 0.6
      }
    }, user)
    console.log('✓ Conversation saved')

    // 4. Track vocabulary learned
    const vocabularyLearned = ['hola', 'güero', 'quiero', 'tacos', 'pastor', 'carnitas', 
                               'suadero', 'con todo', 'pesos', 'joven', 'gracias', 'por favor']
    await db.progress.trackVocabulary(user.id, 'es', vocabularyLearned, 'taco_vendor')
    console.log('✓ Vocabulary tracked:', vocabularyLearned.length, 'words')

    // 5. Update progress
    await db.progress.addPracticeTime(user.id, 'es', 5)
    await db.progress.incrementConversations(user.id, 'es')
    await db.progress.updateSkill(user.id, 'es', 'listening', 8)
    await db.progress.updateSkill(user.id, 'es', 'speaking', 6)

    // 6. Track areas of difficulty
    await db.profiles.addStrugglingArea(user.id, 'es', 'verb_conjugation')
    await db.profiles.trackError(user.id, 'es', 'forgot_article_el_la')

    // 7. Get vocabulary stats
    const vocabStats = await db.progress.getVocabularyStats(user.id, 'es')
    console.log('✓ Vocabulary progress:', vocabStats)

    // 8. Get recommendations for next session
    const recommendations = await db.profiles.getRecommendations(user.id, 'es')
    console.log('✓ Next session recommendations:', recommendations)

    // 9. Generate analytics
    const analytics = await db.analytics.getUserAnalytics(user.id, 'es', 'week')
    console.log('✓ Weekly analytics:', {
      sessions: analytics.totalSessions,
      avgConfidence: Math.round(analytics.averageConfidence * 100) + '%',
      trend: analytics.improvementTrend
    })

    // 10. Generate report
    const report = await db.analytics.generateReport(user.id, 'es', 'week')
    console.log('✓ Learning report generated')
    console.log('  Summary:', report.summary)
    console.log('  Achievements:', report.achievements)
    console.log('  Goals:', report.goals)

  } catch (error) {
    console.error('✗ Real scenario test failed:', error)
  }
}

/**
 * Test error handling
 */
export async function testErrorHandling() {
  console.log('\n📝 Testing Error Handling...')
  
  const db = LanguageLearningDB.createWithLocalStorage()
  const user: User = { id: 'test-user' }

  // Test validation errors
  try {
    await db.saveConversation({
      title: '', // Invalid
      transcript: [],
      duration: -1, // Invalid
      language: ''  // Invalid
    }, user)
  } catch (error: any) {
    console.log('✓ Validation error caught:', error.message)
  }

  // Test missing data errors
  try {
    await db.progress.trackVocabulary('non-existent-user', 'es', ['word'])
  } catch (error: any) {
    console.log('✓ Missing data error caught:', error.message)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests().catch(console.error)
}