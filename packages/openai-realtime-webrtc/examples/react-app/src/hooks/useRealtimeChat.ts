import { useState, useCallback, useRef, useEffect } from 'react'
// In production, this would be: import { RealtimeClient } from 'openai-realtime-webrtc'

// Types
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

// Mock RealtimeClient for demonstration
class MockRealtimeClient {
  private handlers: Record<string, Function> = {}
  
  on(event: string, handler: Function) {
    this.handlers[event] = handler
  }
  
  async connect() {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    this.handlers.connected?.()
    
    // Simulate some messages
    setTimeout(() => {
      this.handlers.message?.({
        role: 'assistant',
        content: 'Hello! I\'m connected and ready to chat. Just speak naturally!'
      })
    }, 2000)
  }
  
  async disconnect() {
    this.handlers.disconnected?.()
  }
}

export function useRealtimeChat() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [messages, setMessages] = useState<Message[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const clientRef = useRef<MockRealtimeClient | null>(null)
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate audio level changes when connected
  useEffect(() => {
    if (isConnected) {
      audioIntervalRef.current = setInterval(() => {
        // Simulate varying audio levels
        const level = Math.sin(Date.now() / 200) * 0.3 + 0.5 + Math.random() * 0.2
        setAudioLevel(Math.max(0, Math.min(1, level)))
      }, 50)
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current)
        audioIntervalRef.current = null
      }
      setAudioLevel(0)
    }
    
    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current)
      }
    }
  }, [isConnected])

  const connect = useCallback(async (apiKey: string) => {
    try {
      setConnectionState('connecting')
      setError(null)
      
      // Initialize the client
      const client = new MockRealtimeClient()
      clientRef.current = client
      
      // Set up event handlers
      client.on('connected', () => {
        setIsConnected(true)
        setConnectionState('connected')
        addMessage('system', 'Connected to OpenAI Realtime API')
      })
      
      client.on('disconnected', () => {
        setIsConnected(false)
        setConnectionState('disconnected')
        addMessage('system', 'Disconnected from OpenAI Realtime API')
      })
      
      client.on('error', (err: Error) => {
        setError(err.message)
        setConnectionState('error')
      })
      
      client.on('message', (msg: { role: string; content: string }) => {
        addMessage(msg.role as 'user' | 'assistant', msg.content)
      })
      
      client.on('userSpeaking', (speaking: boolean) => {
        setIsSpeaking(speaking)
      })
      
      // Connect
      await client.connect()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setConnectionState('error')
      setIsConnected(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect()
      clientRef.current = null
    }
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [])

  const addMessage = useCallback((role: Message['role'], content: string) => {
    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    isConnected,
    connectionState,
    messages,
    audioLevel,
    isSpeaking,
    error,
    connect,
    disconnect,
    clearMessages
  }
}