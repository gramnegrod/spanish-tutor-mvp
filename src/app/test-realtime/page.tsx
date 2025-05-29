'use client';

import React, { useState } from 'react';
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime';

export default function TestRealtimePage() {
  const [transcripts, setTranscripts] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: Date }>>([]);
  
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    status,
    error,
    costs,
    showTimeWarning,
    timeWarningMinutes,
    showSessionComplete,
    sessionInfo,
    showMaxSessions,
    connect,
    disconnect,
    extendSession,
    startFreshSession,
    dismissWarning,
    audioRef
  } = useOpenAIRealtime({
    instructions: 'You are a friendly Mexican Spanish tutor. Speak only in Mexican Spanish.',
    voice: 'alloy',
    temperature: 0.8,
    onTranscript: (role, text) => {
      setTranscripts(prev => [...prev, { role, text, timestamp: new Date() }]);
    },
    onError: (err) => {
      console.error('Realtime error:', err);
    }
  });

  const clearTranscripts = () => {
    setTranscripts([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OpenAI Realtime Service Test</h1>
        
        {/* Status Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-medium ${isConnected ? 'text-green-600' : 'text-gray-800'}`}>
                {status}
              </span>
            </div>
            
            <div>
              <span className="text-gray-600">Connection:</span>
              <span className={`ml-2 font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-600">Speaking:</span>
              <span className={`ml-2 font-medium ${isSpeaking ? 'text-blue-600' : 'text-gray-400'}`}>
                {isSpeaking ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-600">Configuration:</span>
              <span className="ml-2 text-sm text-gray-500">Spanish Tutor</span>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 font-medium">Error:</p>
              <p className="text-red-600 text-sm mt-1">{error.message}</p>
            </div>
          )}
        </div>

        {/* Cost Tracking */}
        {costs && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">💰 Cost Tracking</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">${costs.totalCost.toFixed(4)}</p>
                <p className="text-sm text-blue-600">Total Cost</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-semibold text-green-600">{costs.audioInputSeconds.toFixed(1)}s</p>
                <p className="text-sm text-green-600">Audio Input</p>
                <p className="text-xs text-green-500">${costs.audioInputCost.toFixed(4)}</p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-semibold text-purple-600">{costs.audioOutputSeconds.toFixed(1)}s</p>
                <p className="text-sm text-purple-600">Audio Output</p>
                <p className="text-xs text-purple-500">${costs.audioOutputCost.toFixed(4)}</p>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-lg font-semibold text-orange-600">{costs.textInputTokens + costs.textOutputTokens}</p>
                <p className="text-sm text-orange-600">Text Tokens</p>
                <p className="text-xs text-orange-500">${(costs.textInputCost + costs.textOutputCost).toFixed(4)}</p>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>💡 Pricing: Audio Input $100/1M tokens (~$0.06/min), Audio Output $200/1M tokens (~$0.24/min)</p>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          
          <div className="flex gap-4">
            {!isConnected ? (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect
              </button>
            )}
            
            <button
              onClick={clearTranscripts}
              disabled={transcripts.length === 0}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Clear Transcripts
            </button>
          </div>
          
          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-blue-600 animate-pulse"></div>
                <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-blue-700 font-medium">Listening...</span>
            </div>
          )}
        </div>

        {/* Transcripts Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Conversation Transcripts
            {transcripts.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">({transcripts.length} messages)</span>
            )}
          </h2>
          
          {transcripts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transcripts yet. Connect and start speaking to see the conversation.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transcripts.map((transcript, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    transcript.role === 'assistant' 
                      ? 'bg-gray-100 mr-8' 
                      : 'bg-blue-100 ml-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">
                      {transcript.role === 'assistant' ? '🤖 Assistant' : '👤 You'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {transcript.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-800">{transcript.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} autoPlay className="hidden" />
        
        {/* Time Warning Modal */}
        {showTimeWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="text-center">
                <div className="text-yellow-500 text-4xl mb-4">⏰</div>
                <h3 className="text-lg font-semibold mb-2">Time Warning</h3>
                <p className="text-gray-600 mb-4">
                  {timeWarningMinutes} minutes left in this session
                </p>
                {costs && (
                  <p className="text-sm text-gray-500 mb-4">
                    Cost so far: <span className="font-mono">${costs.totalCost.toFixed(4)}</span>
                  </p>
                )}
                <button
                  onClick={dismissWarning}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Complete Modal */}
        {showSessionComplete && sessionInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="text-center">
                <div className="text-blue-500 text-4xl mb-4">🕙</div>
                <h3 className="text-lg font-semibold mb-2">Session Complete!</h3>
                <div className="text-gray-600 mb-4">
                  <p>Time: {sessionInfo.sessionTimeMinutes} minutes</p>
                  {costs && (
                    <p>Total cost: <span className="font-mono">${costs.totalCost.toFixed(4)}</span></p>
                  )}
                </div>
                {sessionInfo.canExtend ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Continue for {sessionInfo.sessionTimeMinutes} more minutes?
                      <br />
                      (Session {sessionInfo.currentSession + 1} of {sessionInfo.maxSessions})
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={extendSession}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Yes, Continue
                      </button>
                      <button
                        onClick={startFreshSession}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        No, Start Fresh
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startFreshSession}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Start Fresh
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Max Sessions Modal */}
        {showMaxSessions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">🏁</div>
                <h3 className="text-lg font-semibold mb-2">Maximum Session Reached</h3>
                <div className="text-gray-600 mb-4">
                  {costs && (
                    <p>Final cost: <span className="font-mono">${costs.totalCost.toFixed(4)}</span></p>
                  )}
                  <p>Total time: 30 minutes</p>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Starting fresh conversation...
                </p>
                <button
                  onClick={startFreshSession}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Info */}
        <div className="mt-8 text-xs text-gray-500 text-center">
          <p>Test page for OpenAI Realtime Service with Session Management</p>
          <p>10-minute sessions, 3 session max, smart summaries</p>
        </div>
      </div>
    </div>
  );
}