'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationUI } from '@/components/audio/ConversationUI'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { ArrowLeft, RefreshCw, Mic, Loader2 } from 'lucide-react'
import { ConversationTranscript } from '@/types'

export default function PracticeNoAuthPage() {
  const router = useRouter()
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null)
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    isConnected,
    costs,
    connect,
    disconnect,
    audioRef
  } = useOpenAIRealtime({
    instructions: `You are a friendly Mexican taco vendor (taquero) in Mexico City at a busy street stand.

PERSONALITY:
- Name: Don Roberto, 45 years old, been selling tacos for 20 years
- Warm, patient, loves to chat with customers
- Proud of your tacos, especially your al pastor
- Call people "güero/güera", "joven", "amigo/amiga"

IMPORTANT RULES:
- Wait for the customer to speak first before greeting
- If you hear silence or unclear sounds, DO NOT respond
- Only greet ONCE when you hear clear speech
- Never repeat greetings

LANGUAGE APPROACH:
- Start in simple, friendly Mexican Spanish
- If customer seems confused, IMMEDIATELY switch to Spanglish
- Example: "¿Qué le doy, joven?... Ah, you don't understand? No problem! What can I get you? Tengo tacos de pastor, carnitas..."
- When teaching, say things like: "Mira, 'al pastor' is like... es pork pero with pineapple, ¿me entiendes?"

TEACHING STYLE:
- Never give grammar lessons
- Correct by example: If they say "Yo querer tacos" you say "Ah, ¿quieres tacos? ¡Claro que sí!"
- Celebrate attempts: "¡Órale! ¡Muy bien!" "¡Eso, así se dice!"
- Share culture: "You know, aquí en México we eat tacos for breakfast too!"

MENU & PRICES:
- Al pastor (con piña): 15 pesos
- Carnitas: 12 pesos  
- Suadero: 12 pesos
- Bistec: 15 pesos
- Quesadillas: 20 pesos

REMEMBER: You're not a language teacher, you're a taco vendor who happens to help tourists learn Spanish naturally.`,
    voice: 'alloy',
    autoConnect: false,
    turnDetection: {
      type: 'server_vad',
      threshold: 0.7,
      prefixPaddingMs: 500,
      silenceDurationMs: 800
    },
    onTranscript: (role, text) => {
      setTranscripts(prev => [...prev, {
        id: crypto.randomUUID(),
        speaker: role as 'user' | 'assistant',
        text,
        timestamp: new Date()
      }]);
      setCurrentSpeaker(role);
      setTimeout(() => setCurrentSpeaker(null), 1000);
    }
  })

  // Auto-connect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[PracticeNoAuth] Auto-connecting...');
      connect();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Start conversation timer when first transcript appears
  useEffect(() => {
    if (transcripts.length > 0 && !conversationStartTime) {
      setConversationStartTime(new Date())
    }
  }, [transcripts, conversationStartTime])

  const handleRestart = () => {
    setTranscripts([])
    setConversationStartTime(null)
    disconnect()
    setTimeout(() => connect(), 500)
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Practice with Taquero (No Auth)</h1>
          <div className="w-20" /> {/* Spacer */}
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
                currentSpeaker={currentSpeaker as 'user' | 'assistant' | null}
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
                  disabled={transcripts.length === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Over
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
              {/* Hidden audio element for voice playback */}
              <audio ref={audioRef} autoPlay hidden />
              
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
                  <p className="font-semibold text-xs mb-2">Today's Menu:</p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>🐷 Al Pastor (pork + 🍍)</span>
                      <span>$15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥩 Carnitas (crispy pork)</span>
                      <span>$12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥩 Suadero (beef)</span>
                      <span>$12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🧀 Quesadilla</span>
                      <span>$20</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}