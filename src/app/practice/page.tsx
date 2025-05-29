'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ConversationUI } from '@/components/audio/ConversationUI'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { ArrowLeft, RefreshCw, Mic, Loader2 } from 'lucide-react'

export default function PracticePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [transcripts, setTranscripts] = useState<Array<{speaker: string; text: string; timestamp: Date}>>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    isConnected,
    costs,
    showTimeWarning,
    timeWarningMinutes,
    showSessionComplete,
    sessionInfo,
    showMaxSessions,
    extendSession,
    handleSessionContinue,
    startFreshSession,
    dismissWarning
  } = useOpenAIRealtime({
    instructions: `You are a friendly Mexican taco vendor (taquero) in Mexico City. 
    You speak naturally in Mexican Spanish, using local slang and expressions.
    Keep responses brief and conversational, as if talking to a customer at your taco stand.
    If asked to explain something, provide the explanation in the language requested.
    Be warm, friendly, and encourage the conversation about tacos and Mexican food culture.`,
    voice: 'alloy',
    autoConnect: true,
    onTranscript: (role, text) => {
      setTranscripts(prev => [...prev, {
        speaker: role,
        text,
        timestamp: new Date()
      }]);
      setCurrentSpeaker(role);
      setTimeout(() => setCurrentSpeaker(null), 1000);
    }
  })

  useEffect(() => {
    // Temporarily disabled for testing
    // if (status === 'unauthenticated') {
    //   router.push('/login')
    // }
  }, [status, router])

  // Start conversation timer when first transcript appears
  useEffect(() => {
    if (transcripts.length > 0 && !conversationStartTime) {
      setConversationStartTime(new Date())
    }
  }, [transcripts, conversationStartTime])

  const handleEndConversation = async () => {
    if (transcripts.length === 0) return

    setIsAnalyzing(true)
    const endTime = new Date()
    const duration = conversationStartTime 
      ? Math.floor((endTime.getTime() - conversationStartTime.getTime()) / 1000)
      : 0

    try {
      // Save conversation
      const conversationResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Taco Ordering Practice',
          persona: 'TAQUERO',
          transcript: transcripts,
          duration
        })
      })

      const { conversation } = await conversationResponse.json()

      // Analyze conversation
      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id })
      })

      // Update progress
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minutesPracticed: Math.ceil(duration / 60),
          vocabulary: extractVocabulary(transcripts)
        })
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save conversation:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRestart = () => {
    setTranscripts([])
    setConversationStartTime(null)
    startFreshSession()
  }

  const handleExtendSession = () => {
    extendSession()
    dismissWarning()
  }
  
  const handleDismissWarning = () => {
    dismissWarning()
  }

  // Skip loading check for now
  // if (status === 'loading') {
  //   return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  // }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Practice with Taquero</h1>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Conversation Display */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                Practice ordering tacos from a friendly street vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConversationUI 
                transcripts={transcripts}
                isProcessing={isProcessing}
                currentSpeaker={currentSpeaker}
              />
              {/* Cost Display */}
              {costs && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Session Cost:</span>
                    <span className="font-mono font-semibold text-green-600">
                      ${costs.totalCost.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>You: {costs.audioInputSeconds.toFixed(1)}s</span>
                    <span>AI: {costs.audioOutputSeconds.toFixed(1)}s</span>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={handleRestart}
                  variant="outline"
                  className="flex-1"
                  disabled={transcripts.length === 0 || isAnalyzing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
                <Button 
                  onClick={handleEndConversation}
                  className="flex-1"
                  disabled={transcripts.length === 0 || isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'End & Analyze'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voice Control */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Control</CardTitle>
              <CardDescription>
                {isConnected ? 'Speak naturally in Spanish' : 'Connecting...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {/* Connection Status */}
              <div className="text-center">
                {isConnected ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <Mic className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">Connected - Speak anytime</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-600">Connecting to tutor...</p>
                  </div>
                )}
              </div>
              
              {/* Speaking Indicator */}
              {currentSpeaker === 'user' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-blue-600 animate-pulse"></div>
                    <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm font-medium">Listening...</span>
                </div>
              )}
              
              {/* Tips */}
              <div className="text-sm text-gray-600 space-y-2 text-center">
                <p className="font-semibold">Conversation starters:</p>
                <ul className="space-y-1">
                  <li>"Hola, ¿qué tal?"</li>
                  <li>"Quiero tacos, por favor"</li>
                  <li>"¿De qué son?"</li>
                  <li>"¿Cuánto cuesta?"</li>
                </ul>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="font-semibold text-xs">Need help?</p>
                  <p className="text-xs mt-1">Say "explícame" or "teach me" to get explanations</p>
                  <p className="text-xs">Say "in English" for English explanations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Time Warning Modal */}
      {showTimeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Time Warning</h3>
            <p className="text-gray-600 mb-4">
              You have {timeWarningMinutes} {timeWarningMinutes === 1 ? 'minute' : 'minutes'} remaining in this session.
            </p>
            <div className="text-sm text-gray-600 mb-4">
              Current session cost: ${costs?.totalCost.toFixed(4) || '0.0000'}
            </div>
            <Button onClick={handleDismissWarning} className="w-full">Got it</Button>
          </div>
        </div>
      )}

      {/* Session Complete Modal */}
      {showSessionComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Session Complete</h3>
            <p className="text-gray-600 mb-4">
              Your 10-minute session has ended. You can extend for another 10 minutes (up to 2 times).
            </p>
            <div className="text-sm mb-4">
              <div className="font-semibold">Total cost: ${costs?.totalCost.toFixed(4) || '0.0000'}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSessionContinue(false)} className="flex-1">
                End Session
              </Button>
              <Button onClick={() => handleSessionContinue(true)} className="flex-1">
                Continue (10 more minutes)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Max Sessions Modal */}
      {showMaxSessions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Maximum Session Time Reached</h3>
            <p className="text-gray-600 mb-4">
              You've reached the maximum session time of 30 minutes. Please start a new session if you'd like to continue practicing.
            </p>
            <div className="text-sm mb-4">
              <div className="font-semibold">Final session cost: ${costs?.totalCost.toFixed(4) || '0.0000'}</div>
            </div>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function extractVocabulary(transcripts: any[]): string[] {
  // Simple vocabulary extraction - can be improved
  const words = new Set<string>()
  transcripts.forEach(t => {
    if (t.speaker === 'assistant') {
      const spanishWords = t.text.toLowerCase().split(/\s+/)
      spanishWords.forEach(word => {
        if (word.length > 3) {
          words.add(word.replace(/[.,!?]/g, ''))
        }
      })
    }
  })
  return Array.from(words).slice(0, 10)
}