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
  updateInstructions: (instructions: string) => Promise<void>;
  extendSession: () => void;
  startFreshSession: () => void;
  dismissWarning: () => void;
  handleSessionContinue: (continueSession: boolean) => void;
  
  // Refs for audio element
  audioRef: React.RefObject<HTMLAudioElement | null>;
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
  
  // Use refs to avoid stale closures for dynamic callbacks
  const onTranscriptRef = useRef(options.onTranscript);
  const onErrorRef = useRef(options.onError);
  const onCostUpdateRef = useRef(options.onCostUpdate);
  
  // Update refs when options change
  onTranscriptRef.current = options.onTranscript;
  onErrorRef.current = options.onError;
  onCostUpdateRef.current = options.onCostUpdate;
  
  // Initialize service
  useEffect(() => {
    // Clean initialization
    if (serviceRef.current) {
      console.log('[useOpenAIRealtime] Service already exists, cleaning up...');
      serviceRef.current.disconnect();
      serviceRef.current = null;
    }
    
    const events: RealtimeEvents = {
      onConnect: () => {
        console.log('[useOpenAIRealtime] onConnect fired');
        setIsConnected(true);
        setIsConnecting(false);
        setStatus('Connected');
        console.log('[useOpenAIRealtime] State updated - connected');
      },
      onDisconnect: () => {
        setIsConnected(false);
        setIsSpeaking(false);
        setStatus('Disconnected');
      },
      onError: (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsConnecting(false);
        setStatus(`Error: ${err.message}`);
        console.log('[useOpenAIRealtime] Calling onError via ref');
        onErrorRef.current?.(err);
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
        console.log('[useOpenAIRealtime] onTranscript called:', { role, text: text.substring(0, 50) + '...', hasCallback: !!onTranscriptRef.current });
        onTranscriptRef.current?.(role, text);
        if (role === 'assistant') {
          setStatus('Ready');
        }
      },
      onCostUpdate: (costData) => {
        setCosts(costData);
        onCostUpdateRef.current?.(costData);
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
    
    console.log('[useOpenAIRealtime] Creating service with options:', {
      ...options,
      instructions: options.instructions ? options.instructions.substring(0, 50) + '...' : undefined
    });
    serviceRef.current = new OpenAIRealtimeService(options, events);
    
    return () => {
      if (serviceRef.current) {
        console.log('[useOpenAIRealtime] Cleaning up service...');
        serviceRef.current.disconnect();
        serviceRef.current = null;
      }
    };
  }, []); // Only initialize once
  
  const connect = useCallback(async () => {
    // Removed performance monitoring
    try {
      if (!serviceRef.current || isConnected || isConnecting) return;
      
      setIsConnecting(true);
      setError(null);
      
      try {
        await serviceRef.current.connect(audioRef.current || undefined);
      } catch (err) {
        setIsConnecting(false);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Error handling is done in the service events
      }
    } catch (err) {
      // Re-throw to maintain behavior
      throw err;
    }
  }, [isConnected, isConnecting]);
  
  const disconnect = useCallback(() => {
    if (!serviceRef.current) return;
    serviceRef.current.disconnect();
  }, []);
  
  const updateInstructions = useCallback(async (instructions: string) => {
    // Removed performance monitoring
      console.log('🔄 [useOpenAIRealtime] updateInstructions called');
      console.log('📝 [useOpenAIRealtime] Instructions length:', instructions.length);
      console.log('🔗 [useOpenAIRealtime] Service available:', !!serviceRef.current);
      
      if (!serviceRef.current) {
        console.error('❌ [useOpenAIRealtime] No service available for updateInstructions');
        return;
      }
      
      console.log('✅ [useOpenAIRealtime] Calling service.updateInstructions...');
      await serviceRef.current.updateInstructions(instructions);
      console.log('✨ [useOpenAIRealtime] updateInstructions call completed');
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
  
  const handleSessionContinue = useCallback((continueSession: boolean) => {
    if (continueSession) {
      extendSession();
    } else {
      // End session - disconnect and clear everything
      disconnect();
      setShowSessionComplete(false);
      if (sessionCompleteResolver.current) {
        sessionCompleteResolver.current(false);
        sessionCompleteResolver.current = null;
      }
    }
  }, [disconnect, extendSession]);
  
  // Auto-connect if requested
  useEffect(() => {
    if (options.autoConnect && !isConnected && !isConnecting) {
      console.log('[useOpenAIRealtime] Auto-connecting...');
      connect();
    }
  }, []); // Only run once on mount, not when options change
  
  
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
    handleSessionContinue,
    
    // Refs
    audioRef
  };
}