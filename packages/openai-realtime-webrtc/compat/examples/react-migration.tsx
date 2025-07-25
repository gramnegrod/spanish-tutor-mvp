/**
 * React Hook Migration Example
 * 
 * Shows how to migrate React applications from v2 to v3
 */

import React, { useEffect, useState } from 'react';

// ============================================
// V2 React Code (OLD)
// ============================================

/*
import { useOpenAIRealtime } from '@openai/realtime-webrtc/react';

function V2VoiceAssistant() {
  const {
    // State
    isConnected,
    isReconnecting,
    messages,
    
    // Methods
    connect,
    disconnect,
    sendMessage,
    
    // Audio state
    isRecording,
    startRecording,
    stopRecording
  } = useOpenAIRealtime({
    apiKey: 'sk-...',
    model: 'gpt-4o-realtime-preview',
    voice: 'alloy',
    instructions: 'You are a helpful voice assistant.',
    tools: [{
      type: 'function',
      name: 'set_reminder',
      description: 'Set a reminder',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          time: { type: 'string' }
        }
      }
    }]
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return (
    <div>
      <h1>Voice Assistant</h1>
      
      <div>
        Status: {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting' : 'Disconnected'}
      </div>
      
      <button onClick={() => isRecording ? stopRecording() : startRecording()}>
        {isRecording ? 'Stop' : 'Start'} Recording
      </button>
      
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role}: {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}
*/

// ============================================
// V3 React Code (NEW)
// ============================================

import { useOpenAIRealtime } from '../../src/react';
import type { Message } from '../../src/types';

function V3VoiceAssistant() {
  const {
    // Simplified state
    connectionState,
    isRecording,
    isSpeaking,
    messages,
    
    // Simplified methods
    connect,
    disconnect,
    sendText,
    startRecording,
    stopRecording
  } = useOpenAIRealtime({
    tokenEndpoint: '/api/realtime/token',
    voice: 'alloy',
    instructions: 'You are a helpful voice assistant.',
    autoConnect: true  // New option
  });

  return (
    <div className="voice-assistant">
      <h1>Voice Assistant</h1>
      
      {/* Connection status with all states */}
      <div className="status">
        Status: {connectionState}
        {isSpeaking && ' (AI is speaking)'}
      </div>
      
      {/* Simplified recording button */}
      <button 
        onClick={() => isRecording ? stopRecording() : startRecording()}
        disabled={connectionState !== 'connected'}
      >
        {isRecording ? '🔴 Stop' : '🎤 Start'} Recording
      </button>
      
      {/* Text input option */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.text as HTMLInputElement;
        if (input.value) {
          sendText(input.value);
          input.value = '';
        }
      }}>
        <input name="text" placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>
      
      {/* Messages with better structure */}
      <div className="messages">
        {messages.map((msg) => (
          <MessageComponent key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}

// Better message component
function MessageComponent({ message }: { message: Message }) {
  return (
    <div className={`message ${message.role}`}>
      <div className="role">{message.role}</div>
      {message.text && <div className="text">{message.text}</div>}
      {message.audio && (
        <div className="audio">
          🔊 Audio ({message.audio.duration}ms)
        </div>
      )}
      <div className="time">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

// ============================================
// Migration with Compatibility Layer
// ============================================

// If you need gradual migration, create a wrapper:
function useV2CompatibleHook(v2Config: any) {
  // Map v2 config to v3
  const v3Config = {
    tokenEndpoint: v2Config.apiKey 
      ? `/api/token?key=${v2Config.apiKey}` 
      : v2Config.tokenEndpoint,
    voice: v2Config.voice,
    instructions: v2Config.instructions,
    autoConnect: false
  };
  
  const v3Hook = useOpenAIRealtime(v3Config);
  
  // Map v3 state to v2 format
  return {
    // V2 compatible state
    isConnected: v3Hook.connectionState === 'connected',
    isReconnecting: v3Hook.connectionState === 'connecting',
    messages: v3Hook.messages.map(m => ({
      role: m.role,
      content: m.text || '[audio]'
    })),
    
    // V2 compatible methods
    connect: v3Hook.connect,
    disconnect: v3Hook.disconnect,
    sendMessage: v3Hook.sendText,
    
    // Audio state (same)
    isRecording: v3Hook.isRecording,
    startRecording: v3Hook.startRecording,
    stopRecording: v3Hook.stopRecording
  };
}

// ============================================
// Advanced V3 Features
// ============================================

function AdvancedV3Example() {
  const {
    connectionState,
    messages,
    isRecording,
    isSpeaking,
    metrics,
    
    connect,
    disconnect,
    sendText,
    startRecording,
    stopRecording,
    clearConversation,
    updateConfig
  } = useOpenAIRealtime({
    tokenEndpoint: '/api/realtime/token',
    voice: 'alloy',
    instructions: 'You are a helpful assistant.',
    debug: true,
    
    // New callbacks
    onConnect: () => console.log('Connected!'),
    onDisconnect: () => console.log('Disconnected!')
  });
  
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  
  // Update voice dynamically
  useEffect(() => {
    updateConfig({ voice: selectedVoice as any });
  }, [selectedVoice, updateConfig]);
  
  return (
    <div>
      <h1>Advanced Assistant</h1>
      
      {/* Connection management */}
      <div className="connection">
        <button 
          onClick={() => connectionState === 'connected' ? disconnect() : connect()}
        >
          {connectionState === 'connected' ? 'Disconnect' : 'Connect'}
        </button>
        <span>State: {connectionState}</span>
      </div>
      
      {/* Voice selection */}
      <select 
        value={selectedVoice} 
        onChange={(e) => setSelectedVoice(e.target.value)}
      >
        <option value="alloy">Alloy</option>
        <option value="echo">Echo</option>
        <option value="shimmer">Shimmer</option>
        <option value="nova">Nova</option>
        <option value="fable">Fable</option>
        <option value="onyx">Onyx</option>
      </select>
      
      {/* Metrics display */}
      {metrics && (
        <div className="metrics">
          <div>Duration: {Math.round(metrics.duration / 1000)}s</div>
          <div>Messages: {metrics.messageCount}</div>
          {metrics.avgResponseTime && (
            <div>Avg Response: {metrics.avgResponseTime}ms</div>
          )}
        </div>
      )}
      
      {/* Clear conversation */}
      <button onClick={clearConversation}>
        Clear Conversation
      </button>
      
      {/* Activity indicators */}
      <div className="activity">
        {isRecording && <span>🔴 Recording</span>}
        {isSpeaking && <span>🔊 AI Speaking</span>}
      </div>
      
      {/* Messages */}
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.text || '[audio message]'}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Custom Hook Patterns
// ============================================

// Pattern 1: With error handling
function useVoiceAssistantWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);
  
  const assistant = useOpenAIRealtime({
    tokenEndpoint: '/api/realtime/token',
    voice: 'alloy'
  });
  
  // Handle errors
  useEffect(() => {
    const handleError = (error: any) => {
      setError(error.message);
      console.error('Assistant error:', error);
    };
    
    // In v3, errors come through the connectionState
    if (assistant.connectionState === 'error') {
      setError('Connection error occurred');
    }
    
    return () => setError(null);
  }, [assistant.connectionState]);
  
  return {
    ...assistant,
    error,
    clearError: () => setError(null)
  };
}

// Pattern 2: With persistence
function useVoiceAssistantWithPersistence() {
  const assistant = useOpenAIRealtime({
    tokenEndpoint: '/api/realtime/token'
  });
  
  // Save messages to localStorage
  useEffect(() => {
    if (assistant.messages.length > 0) {
      localStorage.setItem(
        'assistant-messages', 
        JSON.stringify(assistant.messages)
      );
    }
  }, [assistant.messages]);
  
  // Restore on mount
  useEffect(() => {
    const saved = localStorage.getItem('assistant-messages');
    if (saved) {
      // Note: Can't restore messages directly in v3
      // This is for display purposes only
      console.log('Previous conversation available');
    }
  }, []);
  
  return assistant;
}

// Pattern 3: With analytics
function useVoiceAssistantWithAnalytics() {
  const assistant = useOpenAIRealtime({
    tokenEndpoint: '/api/realtime/token'
  });
  
  // Track events
  useEffect(() => {
    if (assistant.connectionState === 'connected') {
      // Track connection
      analytics.track('assistant_connected');
    }
  }, [assistant.connectionState]);
  
  // Track messages
  const sendTextWithTracking = async (text: string) => {
    analytics.track('message_sent', { type: 'text' });
    return assistant.sendText(text);
  };
  
  return {
    ...assistant,
    sendText: sendTextWithTracking
  };
}

// Placeholder for analytics
declare const analytics: any;

export {
  V3VoiceAssistant,
  AdvancedV3Example,
  MessageComponent
};