'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OpenAIRealtimeService } from '@openai-realtime/webrtc'
import { 
  LoadingState, 
  ConnectionStatus, 
  ErrorDisplay, 
  ConversationEmptyState 
} from '@/components/shared'

export default function SimplePracticePage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [status, setStatus] = useState('Ready to connect')
  const [transcripts, setTranscripts] = useState<Array<{role: string, text: string}>>([])
  const [error, setError] = useState<string | null>(null)
  
  const serviceRef = useRef<OpenAIRealtimeService | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const connect = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      console.log('[SimplePractice] Creating service...')
      
      const service = new OpenAIRealtimeService({
        tokenEndpoint: '/api/session',
        instructions: `You are a friendly Mexican taco vendor (taquero) in Mexico City.
          Name: Don Roberto
          Personality: Warm, patient, loves to chat
          Language: Start in simple Mexican Spanish
          Teaching style: Natural conversation, no grammar lessons
          Goal: Help customer order tacos naturally`,
        voice: 'alloy',
        turnDetection: {
          type: 'server_vad',
          threshold: 0.7,
          prefixPaddingMs: 500,
          silenceDurationMs: 800
        }
      }, {
        onConnect: () => {
          console.log('[SimplePractice] Connected!')
          setIsConnected(true)
          setIsConnecting(false)
          setStatus('Connected - Speak to start')
        },
        onDisconnect: () => {
          setIsConnected(false)
          setStatus('Disconnected')
        },
        onError: (err) => {
          console.error('[SimplePractice] Error:', err)
          setError(err.message)
          setIsConnecting(false)
          setStatus('Error: ' + err.message)
        },
        onTranscript: (role, text) => {
          console.log(`[SimplePractice] ${role}: ${text}`)
          setTranscripts(prev => [...prev, { role, text }])
        },
        onStatusUpdate: setStatus
      })
      
      serviceRef.current = service
      
      console.log('[SimplePractice] Connecting...')
      await service.connect(audioRef.current || undefined)
      console.log('[SimplePractice] Connection complete')
      
    } catch (err: any) {
      console.error('[SimplePractice] Connection error:', err)
      setError(err.message)
      setIsConnecting(false)
    }
  }
  
  const disconnect = () => {
    if (serviceRef.current) {
      serviceRef.current.disconnect()
      serviceRef.current = null
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect()
        serviceRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Simple Practice Test</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Conversation Display */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                {status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto bg-gray-50 rounded p-4 space-y-2">
                {transcripts.map((t, i) => (
                  <div key={i} className={`${t.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                    <strong>{t.role}:</strong> {t.text}
                  </div>
                ))}
                {transcripts.length === 0 && (
                  <ConversationEmptyState isConnected={isConnected} />
                )}
              </div>
              
              <ErrorDisplay 
                error={error}
                onDismiss={() => setError(null)}
                variant="card"
                className="mt-2"
              />
            </CardContent>
          </Card>
          
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Control</CardTitle>
              <CardDescription>
                {isConnected ? 'Speak naturally in Spanish' : 'Click connect to start'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              <audio ref={audioRef} autoPlay hidden />
              
              <ConnectionStatus 
                isConnected={isConnected}
                isConnecting={isConnecting}
                size="md"
              />
              
              <div className="space-x-2">
                <Button 
                  onClick={connect} 
                  disabled={isConnecting || isConnected}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
                <Button 
                  onClick={disconnect} 
                  disabled={!isConnected}
                  variant="outline"
                >
                  Disconnect
                </Button>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2 text-center">
                <p className="font-semibold">Try saying:</p>
                <ul className="space-y-1">
                  <li>"Hola, buenos días"</li>
                  <li>"Quiero tacos de pastor"</li>
                  <li>"¿Cuánto cuesta?"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}