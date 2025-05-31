'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Loader2 } from 'lucide-react'
import { OpenAIRealtimeService } from '@/services/openai-realtime'

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
                  <p className="text-gray-400">Conversation will appear here...</p>
                )}
              </div>
              
              {error && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
                  Error: {error}
                </div>
              )}
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
              
              <div className="text-center">
                {isConnected ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <Mic className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">Connected - Speak anytime</p>
                  </div>
                ) : isConnecting ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-600">Connecting...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <Mic className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Not connected</p>
                  </div>
                )}
              </div>
              
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