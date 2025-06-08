'use client'

import { safeFormatDate, safeFormatTime } from '@/lib/utils'

export default function TestDateFixPage() {
  // Test cases that would have caused "Invalid Date" before
  const problemCases = [
    { 
      description: 'null createdAt (common DB issue)',
      conversation: { id: '1', title: 'Test', createdAt: null as any }
    },
    { 
      description: 'undefined createdAt',
      conversation: { id: '2', title: 'Test', createdAt: undefined as any }
    },
    { 
      description: 'empty string createdAt',
      conversation: { id: '3', title: 'Test', createdAt: '' as any }
    },
    { 
      description: 'invalid date string',
      conversation: { id: '4', title: 'Test', createdAt: 'not-a-date' as any }
    },
    { 
      description: 'valid ISO string',
      conversation: { id: '5', title: 'Test', createdAt: '2024-01-01T10:30:00.000Z' }
    },
    { 
      description: 'valid Date object',
      conversation: { id: '6', title: 'Test', createdAt: new Date().toISOString() }
    }
  ]

  const transcriptCases = [
    {
      description: 'null timestamp',
      transcript: { id: '1', speaker: 'user' as const, text: 'Hello', timestamp: null as any }
    },
    {
      description: 'undefined timestamp',
      transcript: { id: '2', speaker: 'assistant' as const, text: 'Hi', timestamp: undefined as any }
    },
    {
      description: 'valid Date object',
      transcript: { id: '3', speaker: 'user' as const, text: 'Test', timestamp: new Date() }
    },
    {
      description: 'valid ISO string',
      transcript: { id: '4', speaker: 'assistant' as const, text: 'Response', timestamp: new Date().toISOString() }
    }
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Date Fix Test Page</h1>
      <p className="mb-6 text-gray-600">
        Testing that we no longer get "Invalid Date" displays. All cases below should show safe fallbacks.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Conversation Dates (Dashboard Style)</h2>
          <div className="space-y-2">
            {problemCases.map((testCase, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between">
                <div>
                  <p className="font-medium">{testCase.conversation.title}</p>
                  <p className="text-sm text-gray-600">
                    {safeFormatDate(testCase.conversation.createdAt)}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {testCase.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Transcript Times (Chat Style)</h2>
          <div className="space-y-2">
            {transcriptCases.map((testCase, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{testCase.transcript.speaker}</span>
                  <span className="text-xs text-gray-500">
                    {safeFormatTime(testCase.transcript.timestamp)}
                  </span>
                </div>
                <p>{testCase.transcript.text}</p>
                <p className="text-xs text-gray-400 mt-1">{testCase.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Before vs After</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">❌ Before (would show "Invalid Date")</h3>
              <code className="text-sm bg-red-100 p-2 rounded block">
                {`{new Date(null).toLocaleDateString()}`} = "{new Date(null as any).toLocaleDateString()}"
              </code>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ After (shows safe fallback)</h3>
              <code className="text-sm bg-green-100 p-2 rounded block">
                {`{safeFormatDate(null)}`} = "{safeFormatDate(null)}"
              </code>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🎯 Fix Summary</h3>
            <ul className="text-sm space-y-1">
              <li>• Added <code>safeFormatDate()</code> and <code>safeFormatTime()</code> utility functions</li>
              <li>• Updated dashboard conversation display to use safe formatting</li>
              <li>• Updated ConversationUI component for transcript timestamps</li>
              <li>• Updated practice-adventure and test-realtime pages</li>
              <li>• Updated conversation analysis service</li>
              <li>• Modified ConversationTranscript type to allow both Date and string timestamps</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}