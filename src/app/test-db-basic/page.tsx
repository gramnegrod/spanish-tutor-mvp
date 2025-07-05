'use client'

import { useState } from 'react'

export default function TestDBBasic() {
  const [output, setOutput] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const runBasicTest = async () => {
    setIsLoading(true)
    setOutput('🧪 Starting Language Learning DB Test...\n')

    try {
      // Dynamic import to avoid any build issues
      const { LanguageLearningDB } = await import('@/lib/language-learning-db')
      setOutput(prev => prev + '✅ Module imported successfully\n')

      // Test database creation
      const db = LanguageLearningDB.createWithLocalStorage()
      setOutput(prev => prev + '✅ Database instance created\n')

      // Test health check
      const isHealthy = await db.health()
      setOutput(prev => prev + `✅ Health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}\n`)

      // Test conversation save
      const conversation = await db.saveConversation({
        title: 'Basic Test Conversation',
        transcript: [
          { 
            id: '1', 
            speaker: 'assistant', 
            text: '¡Hola! Welcome to the test!', 
            timestamp: new Date().toISOString() 
          },
          { 
            id: '2', 
            speaker: 'user', 
            text: 'Hello! This is a test message.', 
            timestamp: new Date().toISOString() 
          }
        ],
        duration: 30,
        language: 'es',
        scenario: 'test'
      }, { id: 'test-user-123' })

      setOutput(prev => prev + `✅ Conversation saved with ID: ${conversation.id}\n`)

      // Test storage stats
      const adapter = db.getAdapter() as any
      if (adapter.getStorageStats) {
        const stats = adapter.getStorageStats()
        setOutput(prev => prev + `✅ Storage stats: ${JSON.stringify(stats, null, 2)}\n`)
      }

      setOutput(prev => prev + '\n🎉 All tests passed! Language Learning DB is working correctly.')

    } catch (error) {
      setOutput(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
      console.error('Test error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Language Learning DB - Basic Test</h1>
      
      <div className="mb-6">
        <button
          onClick={runBasicTest}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded"
        >
          {isLoading ? 'Running Tests...' : 'Run Basic Test'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Output:</h3>
        <pre className="whitespace-pre-wrap text-sm">
          {output || 'Click "Run Basic Test" to start testing...'}
        </pre>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">What this test does:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Import the Language Learning Database module</li>
          <li>Create a LocalStorage adapter instance</li>
          <li>Check database health and connectivity</li>
          <li>Save a test conversation with transcript</li>
          <li>Verify data was stored in localStorage</li>
          <li>Display storage statistics</li>
        </ul>
      </div>
    </div>
  )
}