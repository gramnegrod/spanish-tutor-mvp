'use client'

import React, { useState, useEffect } from 'react'
import { LanguageLearningDB } from '@/lib/language-learning-db'
import type { User } from '@/lib/language-learning-db/types'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message?: string
  data?: any
}

export default function TestLanguageLearningDB() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateResult = (name: string, status: TestResult['status'], message?: string, data?: any) => {
    setResults(prev => prev.map(r => 
      r.name === name ? { ...r, status, message, data } : r
    ))
  }

  const runTests = async () => {
    setIsRunning(true)
    
    // Initialize test results
    const initialTests: TestResult[] = [
      { name: 'Database Creation', status: 'pending' },
      { name: 'Health Check', status: 'pending' },
      { name: 'Save Conversation', status: 'pending' },
      { name: 'Initialize Progress', status: 'pending' },
      { name: 'Track Vocabulary', status: 'pending' },
      { name: 'Create Profile', status: 'pending' },
      { name: 'Get User Data', status: 'pending' },
      { name: 'Storage Stats', status: 'pending' }
    ]
    setResults(initialTests)

    const testUser: User = { id: 'test-user-123', email: 'test@example.com' }

    try {
      // Test 1: Database Creation
      updateResult('Database Creation', 'pending', 'Creating database instance...')
      const db = LanguageLearningDB.createWithLocalStorage()
      updateResult('Database Creation', 'success', 'Database instance created successfully')

      // Test 2: Health Check
      updateResult('Health Check', 'pending', 'Checking database health...')
      const isHealthy = await db.health()
      updateResult('Health Check', 'success', `Health status: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`, { isHealthy })

      // Test 3: Save Conversation
      updateResult('Save Conversation', 'pending', 'Saving test conversation...')
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
      updateResult('Save Conversation', 'success', `Conversation saved with ID: ${conversation.id}`, { conversationId: conversation.id })

      // Test 4: Initialize Progress
      updateResult('Initialize Progress', 'pending', 'Initializing user progress...')
      await db.progress.initialize(testUser.id, 'es', 'beginner')
      updateResult('Initialize Progress', 'success', 'Progress initialized successfully')

      // Test 5: Track Vocabulary
      updateResult('Track Vocabulary', 'pending', 'Tracking vocabulary...')
      await db.progress.trackVocabulary(testUser.id, 'es', ['hola', 'quiero', 'tacos', 'pastor'])
      const progress = await db.progress.get(testUser.id, 'es')
      updateResult('Track Vocabulary', 'success', `Vocabulary tracked: ${progress?.vocabulary.length} words`, { vocabularyCount: progress?.vocabulary.length })

      // Test 6: Create Profile
      updateResult('Create Profile', 'pending', 'Creating learner profile...')
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
      updateResult('Create Profile', 'success', `Profile created with level: ${profile.level}`, { level: profile.level })

      // Test 7: Get User Data
      updateResult('Get User Data', 'pending', 'Retrieving user data...')
      const userData = await db.getUserData(testUser.id, 'es')
      const userDataSummary = {
        hasProfile: !!userData.profile,
        hasProgress: !!userData.progress,
        conversationCount: userData.recentConversations.length
      }
      updateResult('Get User Data', 'success', 'User data retrieved successfully', userDataSummary)

      // Test 8: Storage Stats
      updateResult('Storage Stats', 'pending', 'Getting storage statistics...')
      const adapter = db.getAdapter() as any
      if (adapter.getStorageStats) {
        const stats = adapter.getStorageStats()
        updateResult('Storage Stats', 'success', 'Storage stats retrieved', stats)
      } else {
        updateResult('Storage Stats', 'success', 'Storage stats not available for this adapter')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      updateResult('Database Creation', 'error', errorMessage)
      console.error('Test failed:', error)
    }

    setIsRunning(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Language Learning Database Test</h1>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.name} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{result.name}</h3>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                result.status === 'success' ? 'bg-green-100 text-green-800' :
                result.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {result.status === 'success' ? '✓ Success' :
                 result.status === 'error' ? '✗ Error' :
                 '⏳ Pending'}
              </span>
            </div>
            
            {result.message && (
              <p className="text-gray-600 mb-2">{result.message}</p>
            )}
            
            {result.data && (
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Test Summary</h3>
          <div className="flex space-x-4 text-sm">
            <span className="text-green-600">
              ✓ Passed: {results.filter(r => r.status === 'success').length}
            </span>
            <span className="text-red-600">
              ✗ Failed: {results.filter(r => r.status === 'error').length}
            </span>
            <span className="text-yellow-600">
              ⏳ Pending: {results.filter(r => r.status === 'pending').length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}