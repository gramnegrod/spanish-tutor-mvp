/**
 * Example usage patterns for the OpenAI Realtime API service
 */

import React, { useState } from 'react';
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime';
import type { CostTracking } from '@/services/openai-realtime';

// Example 1: Basic Spanish Tutor
export function SpanishTutorExample() {
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    status,
    connect,
    disconnect,
    audioRef
  } = useOpenAIRealtime({
    instructions: 'You are a friendly Mexican Spanish tutor. Speak only in Mexican Spanish.',
    voice: 'alloy',
    onTranscript: (role, text) => {
      setMessages(prev => [...prev, { role, text }]);
    }
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Spanish Tutor</h2>
      
      <div className="mb-4 p-3 bg-gray-100 rounded">
        Status: {status}
      </div>
      
      {!isConnected ? (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {isConnecting ? 'Connecting...' : 'Start Conversation'}
        </button>
      ) : (
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          End Conversation
        </button>
      )}
      
      {isSpeaking && (
        <div className="mt-4 p-3 bg-blue-100 rounded flex items-center gap-2">
          <div className="animate-pulse">🎤</div>
          <span>Listening...</span>
        </div>
      )}
      
      <div className="mt-6 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded ${
              msg.role === 'assistant' 
                ? 'bg-gray-200' 
                : 'bg-blue-100 text-right'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

// Example 2: Customer Service Bot with Dynamic Instructions
export function CustomerServiceExample() {
  const [department, setDepartment] = useState('general');
  
  const {
    isConnected,
    status,
    connect,
    disconnect,
    updateInstructions,
    audioRef
  } = useOpenAIRealtime({
    instructions: 'You are a helpful customer service representative.',
    temperature: 0.7,
    // Don't use input transcription - Whisper is bad for multilingual
    enableInputTranscription: false,
    onTranscript: (role, text) => {
      console.log(`${role}: ${text}`);
    }
  });

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    
    const instructions = {
      general: 'You are a helpful customer service representative.',
      technical: 'You are a technical support specialist. Help with product issues.',
      billing: 'You are a billing specialist. Help with payment and subscription issues.',
      sales: 'You are a sales representative. Help customers find the right product.'
    };
    
    updateInstructions(instructions[dept as keyof typeof instructions]);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Service</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Select Department:</label>
        <select
          value={department}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          className="px-3 py-2 border rounded"
          disabled={!isConnected}
        >
          <option value="general">General Support</option>
          <option value="technical">Technical Support</option>
          <option value="billing">Billing</option>
          <option value="sales">Sales</option>
        </select>
      </div>
      
      <button
        onClick={isConnected ? disconnect : connect}
        className={`px-4 py-2 rounded text-white ${
          isConnected ? 'bg-red-500' : 'bg-green-500'
        }`}
      >
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
      
      <div className="mt-4 p-3 bg-gray-100 rounded">
        {status}
      </div>
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

// Example 3: Minimal Integration
export function MinimalExample() {
  const { isConnected, connect, disconnect, audioRef } = useOpenAIRealtime({
    instructions: 'Be helpful and concise.',
    autoConnect: true // Connect automatically on mount
  });

  return (
    <>
      <button onClick={isConnected ? disconnect : connect}>
        {isConnected ? '🔴 Stop' : '🎤 Start'}
      </button>
      <audio ref={audioRef} />
    </>
  );
}

// Example 4: Cost Tracking Example
export function CostTrackingExample() {
  const [costs, setCosts] = useState<CostTracking | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  
  const {
    isConnected,
    connect,
    disconnect,
    audioRef
  } = useOpenAIRealtime({
    instructions: 'You are a helpful assistant. Be concise to save costs.',
    voice: 'alloy',
    onTranscript: (role, text) => {
      setMessages(prev => [...prev, { role, text }]);
    },
    onCostUpdate: (costData) => {
      setCosts(costData);
    }
  });

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Real-time Cost Tracking Demo</h2>
      
      {costs && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Session Costs</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Audio Input</div>
              <div>{formatDuration(costs.audioInputSeconds)} - {formatCost(costs.audioInputCost)}</div>
            </div>
            <div>
              <div className="font-medium">Audio Output</div>
              <div>{formatDuration(costs.audioOutputSeconds)} - {formatCost(costs.audioOutputCost)}</div>
            </div>
            <div>
              <div className="font-medium">Text Input</div>
              <div>{costs.textInputTokens} tokens - {formatCost(costs.textInputCost)}</div>
            </div>
            <div>
              <div className="font-medium">Text Output</div>
              <div>{costs.textOutputTokens} tokens - {formatCost(costs.textOutputCost)}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="text-lg font-bold">Total Cost: {formatCost(costs.totalCost)}</div>
            <div className="text-xs text-gray-600 mt-1">
              Rate: ${((costs.totalCost / Math.max(costs.audioInputSeconds + costs.audioOutputSeconds, 1)) * 60).toFixed(4)}/min
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={isConnected ? disconnect : connect}
        className={`px-4 py-2 rounded text-white ${
          isConnected ? 'bg-red-500' : 'bg-green-500'
        }`}
      >
        {isConnected ? 'Stop (End Session)' : 'Start Conversation'}
      </button>
      
      <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded ${
              msg.role === 'assistant' 
                ? 'bg-gray-200' 
                : 'bg-blue-100 text-right'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

// Example 5: Advanced Service Usage (without hook)
export function AdvancedServiceExample() {
  const [service, setService] = useState<any>(null);
  const [costs, setCosts] = useState<CostTracking | null>(null);
  
  const handleConnect = async () => {
    const { OpenAIRealtimeService } = await import('@/services/openai-realtime');
    
    const realtimeService = new OpenAIRealtimeService(
      {
        instructions: 'You are an AI assistant.',
        temperature: 0.9,
        turnDetection: {
          type: 'server_vad',
          threshold: 0.7,
          silenceDurationMs: 500
        }
      },
      {
        onTranscript: (role, text) => {
          // Custom handling
          if (role === 'assistant' && text.includes('goodbye')) {
            realtimeService.disconnect();
          }
        },
        onError: (error) => {
          // Custom error handling
          if (error.message.includes('microphone')) {
            alert('Please allow microphone access');
          }
        },
        onCostUpdate: (costData) => {
          setCosts(costData);
          console.log('Current session cost:', costData.totalCost);
        }
      }
    );
    
    await realtimeService.connect();
    setService(realtimeService);
  };
  
  return (
    <div>
      <button onClick={handleConnect}>Connect with Custom Handler</button>
      {service && (
        <>
          <button onClick={() => {
            service.sendMessage(JSON.stringify({
              type: 'response.create',
              response: { modalities: ['text', 'audio'] }
            }));
          }}>
            Send Custom Message
          </button>
          <button onClick={() => {
            const currentCosts = service.getCurrentCosts();
            console.log('Current costs:', currentCosts);
          }}>
            Log Current Costs
          </button>
          <button onClick={() => service.resetCostTracking()}>
            Reset Cost Tracking
          </button>
        </>
      )}
      {costs && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          Total Cost: ${costs.totalCost.toFixed(6)}
        </div>
      )}
    </div>
  );
}