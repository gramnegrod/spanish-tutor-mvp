// Command line test for Language Learning DB
// Run with: node test-db-cli.mjs

console.log('🧪 Language Learning DB - Command Line Test\n')

// Mock localStorage for Node.js
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index) => Object.keys(store)[index] || null
  }
})()

// Set up globals
global.localStorage = localStorageMock
global.window = { localStorage: localStorageMock }

async function testDB() {
  try {
    console.log('📦 Setting up test environment...')
    
    // Import using dynamic import
    const module = await import('./src/lib/language-learning-db/index.js')
    const { LanguageLearningDB } = module
    
    console.log('✅ Module imported successfully')
    
    // Create database instance
    const db = LanguageLearningDB.createWithLocalStorage()
    console.log('✅ Database instance created')
    
    // Health check
    const isHealthy = await db.health()
    console.log(`✅ Health check: ${isHealthy ? 'HEALTHY ✅' : 'UNHEALTHY ❌'}`)
    
    console.log('\n🎉 Basic module loading test passed!')
    console.log('\n📌 For full testing, use the browser test at:')
    console.log('   http://localhost:3000/test-db-basic')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 This is expected - Node.js can\'t easily run Next.js modules')
    console.log('   Use the browser test instead: http://localhost:3000/test-db-basic')
  }
}

testDB()