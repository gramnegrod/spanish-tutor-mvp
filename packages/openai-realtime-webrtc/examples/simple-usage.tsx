/**
 * Simple example of using the OpenAI Realtime Service
 */

import React, { useState } from 'react';
import { useOpenAIRealtime } from '../src/react/useOpenAIRealtime';

export function SimpleExample() {
  const [message, setMessage] = useState('');
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const { 
    isConnected, 
    connect, 
    disconnect, 
    sendText, 
    audioRef,
    state 
  } = useOpenAIRealtime({
    tokenEndpoint: '/api/session',
    debug: true,
    instructions: 'You are a helpful assistant. Keep responses brief.'
  });

  // Handle text responses from the hook's state
  React.useEffect(() => {
    if (state.messages) {
      const newTranscript = state.messages.map(msg => 
        `${msg.role}: ${msg.text || 'Audio message'}`
      );
      setTranscript(newTranscript);
    }
  }, [state.messages]);

  const handleSend = () => {
    if (message.trim()) {
      sendText(message);
      setTranscript(prev => [...prev, `You: ${message}`]);
      setMessage('');
    }
  };

  return (
    <div>
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} autoPlay />
      
      {/* Connection button */}
      <button onClick={isConnected ? disconnect : connect}>
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
      
      {/* Chat interface */}
      {isConnected && (
        <>
          <div style={{ height: 300, overflow: 'auto' }}>
            {transcript.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
          
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button onClick={handleSend}>Send</button>
        </>
      )}
    </div>
  );
}

// Even simpler - vanilla JavaScript usage
async function vanillaExample() {
  // Import dynamically if using vanilla JS
  const { OpenAIRealtimeService } = await import('../src/core/OpenAIRealtimeService');
  
  // Create service
  const service = new OpenAIRealtimeService({
    tokenEndpoint: '/api/session',
    debug: true
  });
  
  // Listen for responses
  service.on('textReceived', (text) => {
    console.log('AI said:', text);
  });
  
  // Connect
  await service.connect();
  
  // Send a message
  await service.sendText('Hello, how are you?');
  
  // That's it! Audio just works through WebRTC
}