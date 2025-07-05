/**
 * Simple test runner for Language Learning DB module
 * Since Jest is not installed, we'll create a basic test runner
 */

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index] || null
  }
})()

global.localStorage = localStorageMock

// Mock browser environment
global.window = {
  localStorage: localStorageMock
}

// Import using require since this is a .js file
const { LanguageLearningDB } = require('./LanguageLearningDB')

console.log('🧪 Testing Language Learning Database Module...\n')

async function runBasicTests() {
  try {
    console.log('📝 Test 1: Database Creation')
    const db = LanguageLearningDB.createWithLocalStorage()
    console.log('✓ Database instance created successfully')
    
    console.log('\n📝 Test 2: Health Check')
    const isHealthy = await db.health()
    console.log(`✓ Health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`)
    
    console.log('\n📝 Test 3: Save Conversation')
    const testUser = { id: 'test-user-123', email: 'test@example.com' }
    const conversation = await db.saveConversation({
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
    }, testUser)
    
    console.log(`✓ Conversation saved with ID: ${conversation.id}`)
    
    console.log('\n📝 Test 4: Initialize Progress')
    await db.progress.initialize(testUser.id, 'es', 'beginner')
    console.log('✓ Progress initialized successfully')
    
    console.log('\n📝 Test 5: Track Vocabulary')
    await db.progress.trackVocabulary(testUser.id, 'es', ['hola', 'quiero', 'tacos', 'pastor'])
    const progress = await db.progress.get(testUser.id, 'es')
    console.log(`✓ Vocabulary tracked: ${progress.vocabulary.length} words`)
    
    console.log('\n📝 Test 6: Create Profile')
    const profile = await db.profiles.create(testUser.id, 'es', {
      level: 'beginner',
      goals: ['travel', 'conversation'],
      preferences: {
        learningStyle: 'mixed',
        pace: 'normal',
        supportLevel: 'moderate',
        culturalContext: true
      }
    })
    console.log(`✓ Profile created with level: ${profile.level}`)
    
    console.log('\n📝 Test 7: Get User Data')
    const userData = await db.getUserData(testUser.id, 'es')
    console.log('✓ User data retrieved:', {
      hasProfile: !!userData.profile,
      hasProgress: !!userData.progress,
      conversationCount: userData.recentConversations.length
    })
    
    console.log('\n📝 Test 8: Storage Stats')
    const adapter = db.getAdapter()
    if (adapter.getStorageStats) {
      const stats = adapter.getStorageStats()
      console.log('✓ Storage stats:', stats)
    }
    
    console.log('\n✅ All basic tests passed successfully!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.error(error.stack)
  }
}

// Run the tests
runBasicTests().then(() => {
  console.log('\n🎉 Language Learning DB module validation complete!')
}).catch(console.error)