'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DebugRealtimePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [sessionData, setSessionData] = useState<any>(null)

  const log = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testSessionEndpoint = async () => {
    log('Testing session endpoint...')
    try {
      const response = await fetch('/api/session')
      const data = await response.json()
      
      if (response.ok) {
        log(`✅ Session endpoint works: ${JSON.stringify(data)}`)
        setSessionData(data)
      } else {
        log(`❌ Session endpoint failed: ${response.status} - ${JSON.stringify(data)}`)
      }
    } catch (error) {
      log(`❌ Session endpoint error: ${error}`)
    }
  }

  const testWebRTCConnection = async () => {
    if (!sessionData?.client_secret?.value) {
      log('❌ No session data - run session test first')
      return
    }

    log('Testing WebRTC connection...')
    
    try {
      const pc = new RTCPeerConnection()
      
      pc.onconnectionstatechange = () => {
        log(`WebRTC connection state: ${pc.connectionState}`)
      }
      
      pc.oniceconnectionstatechange = () => {
        log(`ICE connection state: ${pc.iceConnectionState}`)
      }
      
      pc.onicegatheringstatechange = () => {
        log(`ICE gathering state: ${pc.iceGatheringState}`)
      }

      // Add data channel
      const dc = pc.createDataChannel('oai-events')
      dc.onopen = () => log('✅ Data channel opened')
      dc.onclose = () => log('❌ Data channel closed')
      dc.onerror = (e) => log(`❌ Data channel error: ${e}`)

      // Create offer
      log('Creating WebRTC offer...')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      log('Local description set')

      // Send to OpenAI
      log('Sending offer to OpenAI...')
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.client_secret.value}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      })

      if (response.ok) {
        const answerSdp = await response.text()
        log('✅ Got answer from OpenAI')
        
        await pc.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp
        })
        log('Remote description set')
      } else {
        const errorText = await response.text()
        log(`❌ OpenAI rejected offer: ${response.status} - ${errorText}`)
      }

    } catch (error) {
      log(`❌ WebRTC error: ${error}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OpenAI Realtime Debug</h1>
      
      <div className="space-y-4 mb-8">
        <Button onClick={testSessionEndpoint}>
          Test Session Endpoint
        </Button>
        
        <Button 
          onClick={testWebRTCConnection}
          disabled={!sessionData}
        >
          Test WebRTC Connection
        </Button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  )
}