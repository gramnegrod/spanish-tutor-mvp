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
  onAudioStart?: () => void;
  onAudioComplete?: () => void;
  onAudioInterrupted?: () => void;
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

// Token details for usage tracking
export interface TokenDetails {
  text_tokens?: number;
  audio_tokens?: number;
  cached_tokens?: number;
}

// Usage information from OpenAI Realtime API
export interface RealtimeUsage {
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  input_token_details?: TokenDetails;
  output_token_details?: TokenDetails;
}

// Session configuration for OpenAI Realtime API
export interface SessionConfiguration {
  type: 'session.update';
  session: {
    modalities: ('text' | 'audio')[];
    instructions?: string;
    voice?: 'alloy' | 'verse';
    input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    turn_detection?: {
      type?: 'server_vad' | 'none';
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    };
    temperature?: number;
    input_audio_transcription?: {
      model: string;
      language?: string;
    };
  };
}

// Base event interface for Realtime API events
export interface RealtimeEvent {
  type: string;
  // Using a more constrained approach - specific known event types
  error?: {
    message: string;
    code?: string;
  };
  transcript?: string;
  delta?: string | ArrayBuffer;
  duration_ms?: number;
  audio_duration_ms?: number;
  item_id?: string;
  response?: {
    usage?: RealtimeUsage;
    status?: string;
    output?: unknown[];
  };
  item?: {
    type?: string;
    role?: 'user' | 'assistant';
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };
  // For other event-specific properties that we haven't typed yet
  [key: string]: unknown;
}