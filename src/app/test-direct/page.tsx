'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'

export default function TestDirectPage() {
  const [logs, setLogs] = useState<string[]>([])
  
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[TestDirect] ${message}`)
  }

  const {
    isConnected,
    isConnecting,
    status,
    error,
    connect,
    disconnect,
    audioRef
  } = useOpenAIRealtime({
    instructions: `You are a friendly Mexican taco vendor. Say "Hola amigo!" when connected.`,
    voice: 'alloy',
    autoConnect: false,
    onTranscript: (role, text) => {
      addLog(`${role}: ${text}`)
    },
    onError: (err) => {
      addLog(`ERROR: ${err.message}`)
    }
  })

  useEffect(() => {
    addLog(`Status changed: ${status}`)
  }, [status])

  useEffect(() => {
    if (error) {
      addLog(`Error state: ${error.message}`)
    }
  }, [error])

  const handleConnect = async () => {
    addLog('Manually triggering connection...')
    try {
      await connect()
      addLog('Connect function completed')
    } catch (err: any) {
      addLog(`Connect error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Connection Test (No Auth)</h1>
      
      <div className="mb-4 space-y-2">
        <p>Connected: {isConnected ? '✅ Yes' : '❌ No'}</p>
        <p>Connecting: {isConnecting ? '⏳ Yes' : 'No'}</p>
        <p>Status: {status}</p>
        {error && <p className="text-red-500">Error: {error.message}</p>}
      </div>
      
      <div className="space-x-2 mb-4">
        <Button 
          onClick={handleConnect} 
          disabled={isConnecting || isConnected}
        >
          Connect
        </Button>
        
        <Button 
          onClick={disconnect} 
          disabled={!isConnected}
          variant="outline"
        >
          Disconnect
        </Button>
      </div>
      
      <audio ref={audioRef} autoPlay hidden />
      
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
        <pre>{logs.join('\n') || 'Click "Connect" to start'}</pre>
      </div>
    </div>
  )
}