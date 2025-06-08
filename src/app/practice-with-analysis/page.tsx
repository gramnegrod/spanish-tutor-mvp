'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, ArrowLeft, TrendingUp, Award } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { useConversationEngine } from '@/hooks/useConversationEngine'
import { generateAdaptivePrompt, LearnerProfile } from '@/lib/pedagogical-system'
import { UnifiedStorageService } from '@/lib/unified-storage'
import { safeFormatTime } from '@/lib/utils'

// Enhanced UI Components for Spanish Analysis Feedback
import { SpanishFeedbackDisplay } from '@/components/spanish-analysis/SpanishFeedbackDisplay'
import { VocabularyProgressBar } from '@/components/spanish-analysis/VocabularyProgressBar'
import { SessionSummaryWithAnalysis } from '@/components/spanish-analysis/SessionSummaryWithAnalysis'

export default function PracticeWithAnalysisPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>({
    level: 'beginner',
    comfortWithSlang: false,
    needsMoreEnglish: true,
    strugglingWords: [],
    masteredPhrases: []
  })

  // Scenario configuration - easily changeable
  const SCENARIO = 'taco_vendor'
  const NPC_NAME = 'Don Roberto'
  
  // Initialize conversation engine with scenario
  const {
    sessionStats,
    lastComprehensionFeedback,
    conversationHistory,
    processTranscript,
    resetSession,
    getFullSpanishAnalysis,
    getDatabaseAnalysis
  } = useConversationEngine({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    scenario: SCENARIO // This enables Spanish analysis!
  })

  // Generate instructions for the AI
  const generateInstructions = (profile: LearnerProfile) => {
    return generateAdaptivePrompt(NPC_NAME, 'Mexican taco stand', profile)
  }

  // OpenAI Realtime connection
  const {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    audioRef
  } = useOpenAIRealtime({
    instructions: generateInstructions(learnerProfile),
    autoConnect: true,
    enableInputTranscription: true, // 🔧 CRITICAL: Enable user speech transcription
    inputAudioTranscription: {
      model: 'whisper-1',
      language: 'es' // 🇪🇸 Set Spanish language for better transcription
    },
    onTranscript: async (role, text) => {
      console.log('[PracticeWithAnalysis] onTranscript fired:', { role, text: text.substring(0, 50) + '...' });
      
      // Process through enhanced conversation engine
      const { displayText } = await processTranscript(role, text)
      
      console.log('[PracticeWithAnalysis] Processed transcript:', { role, displayText: displayText.substring(0, 50) + '...' });
      
      // Update UI with clean transcript
      setTranscripts(prev => [...prev, {
        id: Date.now().toString(),
        speaker: role,
        text: displayText,
        timestamp: new Date()
      }])

      // Trigger analysis update
      if (role === 'user') {
        console.log('[PracticeWithAnalysis] User speech detected, triggering analysis update');
        setLastAnalysisUpdate(Date.now())
      }
    }
  })

  const [transcripts, setTranscripts] = useState<any[]>([])
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null)
  const [lastAnalysisUpdate, setLastAnalysisUpdate] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const disconnectRef = useRef(false)

  // Load learner profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await UnifiedStorageService.getLearnerProfile(user)
      if (profile) {
        setLearnerProfile(profile)
      }
    }
    loadProfile()
  }, [user])

  // Track conversation start and cleanup
  useEffect(() => {
    if (isConnected && !conversationStartTime) {
      setConversationStartTime(new Date())
    }
  }, [isConnected, conversationStartTime])

  useEffect(() => {
    return () => {
      disconnectRef.current = true
      disconnect()
    }
  }, [])

  const handleEndConversation = async () => {
    if (!conversationStartTime) return

    const duration = Math.floor((Date.now() - conversationStartTime.getTime()) / 1000)
    
    // Get full Spanish analysis
    const fullAnalysis = getFullSpanishAnalysis()
    const databaseAnalysis = getDatabaseAnalysis()
    
    console.log('[PracticeWithAnalysis] Full Spanish analysis:', fullAnalysis)
    console.log('[PracticeWithAnalysis] Database format:', databaseAnalysis)

    // Save conversation with enhanced analysis
    await UnifiedStorageService.saveConversation({
      title: `${NPC_NAME} - ${new Date().toLocaleDateString()}`,
      persona: NPC_NAME,
      transcript: transcripts,
      duration,
      vocabularyAnalysis: databaseAnalysis?.vocabularyAnalysis,
      struggleAnalysis: databaseAnalysis?.struggleAnalysis
    }, user)

    // Update progress with Spanish metrics
    await UnifiedStorageService.updateProgress({
      minutes_practiced: Math.round(duration / 60),
      conversations_completed: 1,
      vocabulary: fullAnalysis?.wordsUsed.map(w => w.word) || []
    }, user)

    // Save learner profile
    await UnifiedStorageService.saveLearnerProfile(learnerProfile, user)

    setShowSummary(true)
  }

  const handleMicToggle = () => {
    // OpenAI Realtime automatically handles mic recording
    // Just need to connect/disconnect if not already connected
    if (!isConnected && !isConnecting) {
      connect()
    }
  }

  // Get current Spanish analysis for display
  const currentAnalysis = getFullSpanishAnalysis()
  
  // Debug analysis data
  useEffect(() => {
    console.log('[PracticeWithAnalysis] Current analysis:', currentAnalysis);
    console.log('[PracticeWithAnalysis] Session stats:', sessionStats);
    console.log('[PracticeWithAnalysis] Conversation history length:', conversationHistory.length);
  }, [currentAnalysis, sessionStats, conversationHistory])

  if (showSummary) {
    return (
      <SessionSummaryWithAnalysis
        analysis={currentAnalysis}
        sessionStats={sessionStats}
        duration={conversationStartTime ? 
          Math.floor((Date.now() - conversationStartTime.getTime()) / 1000) : 0
        }
        onClose={() => router.push('/dashboard')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Practice with {NPC_NAME}</h1>
          <div className="text-sm text-gray-600">
            {conversationStartTime && `${Math.floor((Date.now() - conversationStartTime.getTime()) / 60000)}:${String(Math.floor((Date.now() - conversationStartTime.getTime()) / 1000) % 60).padStart(2, '0')}`}
          </div>
        </div>

        {/* Spanish Analysis Dashboard */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          
          {/* Vocabulary Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Vocabulary Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VocabularyProgressBar
                scenario={SCENARIO}
                analysis={currentAnalysis}
                sessionStats={sessionStats}
              />
            </CardContent>
          </Card>

          {/* Mexican Expressions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4" />
                Mexican Spanish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {sessionStats.mexicanExpressionsUsed}
              </div>
              <div className="text-xs text-gray-600">expressions used</div>
              {currentAnalysis?.mexicanExpressions.slice(-3).map((expr, i) => (
                <div key={i} className="text-xs mt-1 text-green-700">
                  "{expr}" ✨
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Session Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Session Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Exchanges:</span>
                  <span className="font-medium">{sessionStats.totalResponses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spanish Words:</span>
                  <span className="font-medium">{sessionStats.spanishWordsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-medium">
                    {Math.round(sessionStats.averageConfidence * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Feedback Display */}
        {lastComprehensionFeedback && (
          <SpanishFeedbackDisplay feedback={lastComprehensionFeedback} />
        )}

        {/* Conversation Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
              {transcripts.length === 0 ? (
                <div className="text-center text-gray-500">
                  <p className="mb-2">Ready to practice Spanish!</p>
                  <p className="text-sm">Click the microphone and greet {NPC_NAME}</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Try: "Hola, ¿qué tal?" or "Buenos días"
                  </p>
                </div>
              ) : (
                transcripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    className={`flex ${
                      transcript.speaker === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        transcript.speaker === 'user'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {transcript.speaker === 'user' ? 'You' : NPC_NAME}
                      </p>
                      <p>{transcript.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transcript.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleEndConversation}
            disabled={transcripts.length === 0}
          >
            End Conversation
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {isConnected ? (
                <span className="text-green-600">● Connected - Voice Active</span>
              ) : isConnecting ? (
                <span className="text-yellow-600">● Connecting...</span>
              ) : (
                <span className="text-red-600">● Disconnected</span>
              )}
            </div>
            
            <Button
              size="lg"
              variant={isConnected ? "default" : "outline"}
              onClick={handleMicToggle}
              disabled={isConnecting}
              className="rounded-full w-16 h-16"
            >
              {isConnecting ? (
                <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Audio element for voice playback */}
        <audio 
          ref={audioRef}
          autoPlay 
          className="hidden"
        />

      </div>
    </div>
  )
}