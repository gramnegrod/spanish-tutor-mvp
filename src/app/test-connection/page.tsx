'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestConnectionPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isConnecting, setIsConnecting] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[TestConnection] ${message}`)
  }

  const testConnection = async () => {
    setLogs([])
    setIsConnecting(true)

    try {
      // Step 1: Test session API
      addLog('Testing session API...')
      const sessionResponse = await fetch('/api/session')
      addLog(`Session API status: ${sessionResponse.status}`)
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text()
        addLog(`Session API error: ${errorText.substring(0, 200)}...`)
        return
      }
      
      const sessionData = await sessionResponse.json()
      addLog(`Got session data: ${JSON.stringify(sessionData).substring(0, 100)}...`)
      addLog(`Has client_secret: ${!!sessionData.client_secret}`)
      addLog(`Has value: ${!!sessionData.client_secret?.value}`)
      
      if (!sessionData.client_secret?.value) {
        addLog('ERROR: No client secret in response')
        return
      }
      
      // Step 2: Create RTCPeerConnection
      addLog('\nCreating RTCPeerConnection...')
      const pc = new RTCPeerConnection()
      
      pc.onconnectionstatechange = () => {
        addLog(`Connection state: ${pc.connectionState}`)
      }
      
      pc.oniceconnectionstatechange = () => {
        addLog(`ICE connection state: ${pc.iceConnectionState}`)
      }
      
      // Step 3: Get user media
      addLog('\nRequesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      addLog('✓ Got microphone access')
      
      pc.addTrack(stream.getTracks()[0])
      
      // Step 4: Create data channel
      addLog('\nCreating data channel...')
      const dc = pc.createDataChannel('oai-events')
      
      dc.onopen = () => {
        addLog('✓ Data channel opened')
      }
      
      dc.onerror = (error) => {
        addLog(`Data channel error: ${error}`)
      }
      
      // Step 5: Create offer
      addLog('\nCreating offer...')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      addLog('✓ Offer created and local description set')
      
      // Step 6: Send to OpenAI
      addLog('\nSending offer to OpenAI...')
      const openAIResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            'Authorization': `Bearer ${sessionData.client_secret.value}`,
            'Content-Type': 'application/sdp'
          }
        }
      )
      
      addLog(`OpenAI response status: ${openAIResponse.status}`)
      
      if (!openAIResponse.ok) {
        const error = await openAIResponse.text()
        addLog(`OpenAI error: ${error}`)
        return
      }
      
      const answerSdp = await openAIResponse.text()
      addLog('✓ Got answer from OpenAI')
      
      // Step 7: Set remote description
      addLog('\nSetting remote description...')
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
      addLog('✓ Remote description set')
      
      addLog('\n✅ Connection test complete!')
      
    } catch (error: any) {
      addLog(`\n❌ ERROR: ${error.message}`)
      console.error(error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">OpenAI Realtime Connection Test</h1>
      
      <Button 
        onClick={testConnection} 
        disabled={isConnecting}
        className="mb-4"
      >
        {isConnecting ? 'Testing...' : 'Test Connection'}
      </Button>
      
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
        <pre>{logs.join('\n') || 'Click "Test Connection" to start'}</pre>
      </div>
    </div>
  )
}