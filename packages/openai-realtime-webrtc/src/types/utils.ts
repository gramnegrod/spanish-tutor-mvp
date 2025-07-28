/**
 * Type Utilities for OpenAI Realtime WebRTC
 * 
 * Simple helper functions for working with Realtime types.
 */

import type {
  RealtimeConfig,
  RealtimeVoice,
  AudioFormat,
  Message,
  MessageRole
} from './index';

import { DEFAULT_CONFIG } from './index';
import { generateMessageId as generateSecureMessageId } from '../core/crypto-utils';

// ===== VALIDATION HELPERS =====

/**
 * Validate and merge configuration with defaults
 * @example
 * ```typescript
 * const config = validateConfig({ 
 *   tokenEndpoint: '/api/token',
 *   voice: 'echo' 
 * });
 * ```
 */
export function validateConfig(config: RealtimeConfig): Required<RealtimeConfig> {
  if (!config.tokenEndpoint) {
    throw new Error('tokenEndpoint is required in RealtimeConfig');
  }

  return {
    tokenEndpoint: config.tokenEndpoint,
    debug: config.debug ?? DEFAULT_CONFIG.debug!,
    autoReconnect: config.autoReconnect ?? DEFAULT_CONFIG.autoReconnect!,
    voice: config.voice ?? DEFAULT_CONFIG.voice!,
    instructions: config.instructions ?? '',
    inputAudioFormat: config.inputAudioFormat ?? DEFAULT_CONFIG.inputAudioFormat!,
    outputAudioFormat: config.outputAudioFormat ?? DEFAULT_CONFIG.outputAudioFormat!,
    enableVAD: config.enableVAD ?? DEFAULT_CONFIG.enableVAD!,
    iceServers: config.iceServers ?? [
      { urls: 'stun:stun.l.google.com:19302' }
    ],
    connectionTimeout: config.connectionTimeout ?? DEFAULT_CONFIG.connectionTimeout!
  };
}

/**
 * Check if a voice is valid
 */
export function isValidVoice(voice: string): voice is RealtimeVoice {
  const validVoices: RealtimeVoice[] = ['alloy', 'echo', 'shimmer', 'nova', 'fable', 'onyx'];
  return validVoices.includes(voice as RealtimeVoice);
}

/**
 * Check if an audio format is valid
 */
export function isValidAudioFormat(format: string): format is AudioFormat {
  const validFormats: AudioFormat[] = ['pcm16', 'g711_ulaw', 'g711_alaw'];
  return validFormats.includes(format as AudioFormat);
}

// ===== MESSAGE HELPERS =====

/**
 * Create a text message
 */
export function createTextMessage(text: string, role: MessageRole = 'user'): Message {
  return {
    id: generateMessageId(),
    role,
    text,
    timestamp: Date.now()
  };
}

/**
 * Create an audio message
 */
export function createAudioMessage(
  audioData: string, 
  role: MessageRole = 'user',
  duration?: number
): Message {
  return {
    id: generateMessageId(),
    role,
    audio: {
      data: audioData,
      duration
    },
    timestamp: Date.now()
  };
}

/**
 * Generate a unique message ID using cryptographically secure method
 */
export function generateMessageId(): string {
  return generateSecureMessageId();
}

// ===== AUDIO HELPERS =====

/**
 * Calculate audio duration from buffer
 * @param audioData - Audio buffer
 * @param format - Audio format
 * @param sampleRate - Sample rate (default: 24000)
 * @returns Duration in milliseconds
 */
export function calculateAudioDuration(
  audioData: ArrayBuffer,
  format: AudioFormat,
  sampleRate: number = 24000
): number {
  let bytesPerSample: number;
  
  switch (format) {
    case 'pcm16':
      bytesPerSample = 2; // 16-bit = 2 bytes
      break;
    case 'g711_ulaw':
    case 'g711_alaw':
      bytesPerSample = 1; // 8-bit = 1 byte
      break;
    default:
      bytesPerSample = 2;
  }
  
  const totalSamples = audioData.byteLength / bytesPerSample;
  return (totalSamples / sampleRate) * 1000; // Return in milliseconds
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ===== ERROR HELPERS =====

/**
 * Format error for display
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Check if error is a connection error
 */
export function isConnectionError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : '').toLowerCase();
  return message.includes('connection') || 
         message.includes('network') || 
         message.includes('timeout');
}

// ===== METRICS HELPERS =====

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// ===== DEBUG HELPERS =====

/**
 * Create a simple debug logger
 */
export function createDebugLogger(enabled: boolean) {
  return {
    log: (message: string, ...args: unknown[]) => {
      if (enabled) console.log(`[Realtime] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      if (enabled) console.error(`[Realtime] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      if (enabled) console.warn(`[Realtime] ${message}`, ...args);
    }
  };
}