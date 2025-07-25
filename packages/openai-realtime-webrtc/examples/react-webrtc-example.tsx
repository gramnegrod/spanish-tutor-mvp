/**
 * React WebRTC Integration Example
 * 
 * Demonstrates the cleaned React hook working with WebRTC-only functionality.
 * This example shows the correct usage patterns for the simplified API.
 */

import React, { useEffect, useState } from 'react';
import { useOpenAIRealtime } from '../src/react/useOpenAIRealtime';
import type { RealtimeServiceConfig } from '../src/core/OpenAIRealtimeService';

interface VoiceChatProps {
  tokenEndpoint: string;
}

export function ReactWebRTCExample({ tokenEndpoint }: VoiceChatProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  // Configure the service with WebRTC-appropriate settings
  const config: RealtimeServiceConfig = {
    tokenEndpoint,
    voice: 'alloy',
    temperature: 0.8,
    instructions: 'You are a helpful assistant. Keep responses conversational and brief.',
    debug: true, // Enable debug logging
    autoReconnect: true,
    maxReconnectAttempts: 3,
    // WebRTC-specific settings
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  };

  const {
    state,
    isConnected,
    connect,
    disconnect,
    sendText,
    updateConfig,
    audioRef
  } = useOpenAIRealtime(config);

  // Log state changes for demonstration
  useEffect(() => {
    console.log('Service state changed:', state);
  }, [state]);

  // Handle connection status for UI feedback
  const getStatusColor = () => {
    switch (state.status) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const handleSendText = () => {
    if (inputText.trim() && isConnected) {
      sendText(inputText);
      setMessages(prev => [...prev, `You: ${inputText}`]);
      setInputText('');
    }
  };

  const handleVoiceChange = (voice: string) => {
    updateConfig({ voice: voice as any });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>React WebRTC Voice Chat</h1>
      
      {/* Audio element for WebRTC playback */}
      <audio 
        ref={audioRef} 
        autoPlay 
        style={{ display: 'none' }}
      />
      
      {/* Connection Status */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          marginBottom: '10px'
        }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getStatusColor()
            }}
          />
          <span>Status: {state.status}</span>
          {state.sessionId && <span>(Session: {state.sessionId.slice(0, 8)}...)</span>}
        </div>
        
        {state.error && (
          <div style={{ 
            color: '#F44336', 
            backgroundColor: '#FFEBEE', 
            padding: '10px', 
            borderRadius: '4px' 
          }}>
            Error: {state.error.message}
          </div>
        )}
        
        <div style={{ fontSize: '12px', color: '#666' }}>
          Messages sent: {state.metrics.messagesSent} | 
          Messages received: {state.metrics.messagesReceived}
          {state.metrics.connectedAt && (
            <> | Connected: {state.metrics.connectedAt.toLocaleTimeString()}</>
          )}
        </div>
      </div>

      {/* Connection Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={isConnected ? disconnect : connect}
          disabled={state.status === 'connecting'}
          style={{
            padding: '10px 20px',
            backgroundColor: isConnected ? '#F44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {state.status === 'connecting' ? 'Connecting...' : 
           isConnected ? 'Disconnect' : 'Connect'}
        </button>

        {/* Voice Selection */}
        <select 
          onChange={(e) => handleVoiceChange(e.target.value)}
          disabled={!isConnected}
          style={{ padding: '8px', marginLeft: '10px' }}
          defaultValue="alloy"
        >
          <option value="alloy">Alloy</option>
          <option value="echo">Echo</option>
          <option value="fable">Fable</option>
          <option value="onyx">Onyx</option>
          <option value="nova">Nova</option>
          <option value="shimmer">Shimmer</option>
        </select>
      </div>

      {/* Text Input */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Type a message..."
            disabled={!isConnected}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleSendText}
            disabled={!isConnected || !inputText.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Message History */}
      <div style={{ 
        border: '1px solid #ddd',
        borderRadius: '4px',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '10px'
      }}>
        <h3>Conversation</h3>
        {messages.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No messages yet. Connect and start chatting!
          </p>
        ) : (
          messages.map((message, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              {message}
            </div>
          ))
        )}
      </div>

      {/* Usage Instructions */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px',
        backgroundColor: '#F5F5F5',
        borderRadius: '4px'
      }}>
        <h4>WebRTC Integration Features:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>✅ Real-time audio playback via WebRTC tracks</li>
          <li>✅ Automatic audio track management</li>
          <li>✅ Memory-safe track cleanup</li>
          <li>✅ No deprecated WebSocket audio handling</li>
          <li>✅ Proper service state management</li>
          <li>✅ Debug logging support</li>
          <li>✅ Configuration updates during runtime</li>
          <li>✅ Automatic reconnection handling</li>
        </ul>
      </div>
    </div>
  );
}

// Example usage
export default function App() {
  return (
    <ReactWebRTCExample 
      tokenEndpoint="/api/session" // Replace with your token endpoint
    />
  );
}