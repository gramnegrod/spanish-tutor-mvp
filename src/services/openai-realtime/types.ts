/**
 * OpenAI Realtime API Types and Interfaces
 */

export interface RealtimeConfig {
  // Server endpoint that generates ephemeral tokens
  tokenEndpoint?: string;
  
  // Session configuration
  model?: string;
  voice?: 'alloy' | 'verse';
  instructions?: string;
  temperature?: number;
  
  // Audio settings
  inputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  outputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  
  // Turn detection settings
  turnDetection?: {
    type?: 'server_vad' | 'none';
    threshold?: number;
    prefixPaddingMs?: number;
    silenceDurationMs?: number;
  };
  
  // Enable input transcription (not recommended for multilingual)
  enableInputTranscription?: boolean;
  
  // Input audio transcription configuration
  inputAudioTranscription?: {
    model?: string;
    language?: string;
  };
}

export interface SessionInfo {
  currentSession: number; // 1, 2, or 3
  maxSessions: number; // 3
  sessionTimeMinutes: number; // 10
  totalTimeMinutes: number;
  canExtend: boolean;
}

export interface RealtimeEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onSpeechStart?: () => void;
  onSpeechStop?: () => void;
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
  onStatusUpdate?: (status: string) => void;
  onCostUpdate?: (costs: CostTracking) => void;
  onTimeWarning?: (minutesLeft: number, totalCost: number) => void;
  onSessionComplete?: (sessionInfo: SessionInfo, totalCost: number) => Promise<boolean>; // Returns true if user wants to extend
  onMaxSessionsReached?: (totalCost: number, totalMinutes: number) => void;
}

export interface CostTracking {
  audioInputSeconds: number;
  audioOutputSeconds: number;
  textInputTokens: number;
  textOutputTokens: number;
  audioInputCost: number;
  audioOutputCost: number;
  textInputCost: number;
  textOutputCost: number;
  totalCost: number;
}

export interface ConversationEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface RealtimeEvent {
  type: string;
  [key: string]: any;
}