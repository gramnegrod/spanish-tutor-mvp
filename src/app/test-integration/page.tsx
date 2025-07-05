'use client'

import React, { useState } from 'react'
import { LanguageLearningDB } from '@/lib/language-learning-db'

export default function TestIntegration() {
  const [result, setResult] = useState<string>('')

  const testQuickIntegration = async () => {
    try {
      setResult('🧪 Testing Language Learning DB integration...\n')
      
      // Test 1: Create database
      const db = LanguageLearningDB.createWithLocalStorage()
      setResult(prev => prev + '✅ Database created\n')
      
      // Test 2: Health check
      const isHealthy = await db.health()
      setResult(prev => prev + `✅ Health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}\n`)
      
      // Test 3: Save a conversation
      const conversation = await db.saveConversation({
        title: 'Integration Test Conversation',
        transcript: [
          { id: '1', speaker: 'assistant', text: '¡Hola!', timestamp: new Date().toISOString() },
          { id: '2', speaker: 'user', text: 'Hola, ¿cómo está?', timestamp: new Date().toISOString() }
        ],
        duration: 60,
        language: 'es',
        scenario: 'greeting'
      }, { id: 'test-user' })
      
      setResult(prev => prev + `✅ Conversation saved: ${conversation.id}\n`)
      
      // Test 4: Check localStorage
      const stats = (db.getAdapter() as any).getStorageStats?.()
      setResult(prev => prev + `✅ Storage stats: ${JSON.stringify(stats)}\n`)
      
      setResult(prev => prev + '\n🎉 Integration test completed successfully!')
      
    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Integration Test</h1>
      <button 
        onClick={testQuickIntegration}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Run Integration Test
      </button>
      
      <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
        {result || 'Click button to run test...'}
      </pre>
    </div>
  )
}