/**
 * React Hook for OpenAI Realtime API
 * 
 * Provides a simple interface for integrating real-time speech-to-speech
 * conversations in React components.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { OpenAIRealtimeService, RealtimeConfig, RealtimeEvents, CostTracking, SessionInfo } from '@/services/openai-realtime';

export interface UseOpenAIRealtimeOptions extends RealtimeConfig {
  autoConnect?: boolean;
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
  onError?: (error: Error) => void;
  onCostUpdate?: (costs: CostTracking) => void;
}

export interface UseOpenAIRealtimeReturn {
  // State
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  status: string;
  error: Error | null;
  costs: CostTracking | null;
  
  // Session management
  showTimeWarning: boolean;
  timeWarningMinutes: number;
  showSessionComplete: boolean;
  sessionInfo: SessionInfo | null;
  showMaxSessions: boolean;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  updateInstructions: (instructions: string) => void;
  extendSession: () => void;
  startFreshSession: () => void;
  dismissWarning: () => void;
  
  // Refs for audio element
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function useOpenAIRealtime(options: UseOpenAIRealtimeOptions = {}): UseOpenAIRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('Ready to connect');
  const [error, setError] = useState<Error | null>(null);
  const [costs, setCosts] = useState<CostTracking | null>(null);
  
  // Session management state
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [timeWarningMinutes, setTimeWarningMinutes] = useState(0);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showMaxSessions, setShowMaxSessions] = useState(false);
  
  const sessionCompleteResolver = useRef<((value: boolean) => void) | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const serviceRef = useRef<OpenAIRealtimeService | null>(null);
  
  // Initialize service
  useEffect(() => {
    const events: RealtimeEvents = {
      onConnect: () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatus('Connected');
      },
      onDisconnect: () => {
        setIsConnected(false);
        setIsSpeaking(false);
        setStatus('Disconnected');
      },
      onError: (err) => {
        setError(err);
        setIsConnecting(false);
        setStatus(`Error: ${err.message}`);
        options.onError?.(err);
      },
      onSpeechStart: () => {
        setIsSpeaking(true);
        setStatus('Listening...');
      },
      onSpeechStop: () => {
        setIsSpeaking(false);
        setStatus('Processing...');
      },
      onTranscript: (role, text) => {
        options.onTranscript?.(role, text);
        if (role === 'assistant') {
          setStatus('Ready');
        }
      },
      onCostUpdate: (costData) => {
        setCosts(costData);
        options.onCostUpdate?.(costData);
      },
      onTimeWarning: (minutesLeft, totalCost) => {
        setTimeWarningMinutes(minutesLeft);
        setShowTimeWarning(true);
      },
      onSessionComplete: async (sessionInfo, totalCost) => {
        setSessionInfo(sessionInfo);
        setShowSessionComplete(true);
        
        // Return a promise that resolves when user makes a choice
        return new Promise<boolean>((resolve) => {
          sessionCompleteResolver.current = resolve;
        });
      },
      onMaxSessionsReached: (totalCost, totalMinutes) => {
        setShowMaxSessions(true);
      },
      onStatusUpdate: setStatus
    };
    
    serviceRef.current = new OpenAIRealtimeService(options, events);
    
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, []); // Only initialize once
  
  const connect = useCallback(async () => {
    if (!serviceRef.current || isConnected || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await serviceRef.current.connect(audioRef.current || undefined);
    } catch (err) {
      // Error handling is done in the service events
    }
  }, [isConnected, isConnecting]);
  
  const disconnect = useCallback(() => {
    if (!serviceRef.current) return;
    serviceRef.current.disconnect();
  }, []);
  
  const updateInstructions = useCallback((instructions: string) => {
    if (!serviceRef.current) return;
    serviceRef.current.updateInstructions(instructions);
  }, []);
  
  const extendSession = useCallback(() => {
    setShowSessionComplete(false);
    if (sessionCompleteResolver.current) {
      sessionCompleteResolver.current(true);
      sessionCompleteResolver.current = null;
    }
  }, []);
  
  const startFreshSession = useCallback(() => {
    setShowSessionComplete(false);
    setShowMaxSessions(false);
    if (sessionCompleteResolver.current) {
      sessionCompleteResolver.current(false);
      sessionCompleteResolver.current = null;
    }
  }, []);
  
  const dismissWarning = useCallback(() => {
    setShowTimeWarning(false);
  }, []);
  
  // Auto-connect if requested
  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }
  }, [options.autoConnect]);
  
  return {
    // State
    isConnected,
    isConnecting,
    isSpeaking,
    status,
    error,
    costs,
    
    // Session management
    showTimeWarning,
    timeWarningMinutes,
    showSessionComplete,
    sessionInfo,
    showMaxSessions,
    
    // Actions
    connect,
    disconnect,
    updateInstructions,
    extendSession,
    startFreshSession,
    dismissWarning,
    
    // Refs
    audioRef
  };
}