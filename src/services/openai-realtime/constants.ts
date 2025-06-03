/**
 * OpenAI Realtime API Constants
 */

// Pricing constants - OpenAI Realtime API pricing as of Jan 2025
export const PRICING = {
  // Audio pricing is per minute, not per token!
  audioInputPerMinute: 0.06,    // $0.06 per minute of audio input
  audioOutputPerMinute: 0.24,   // $0.24 per minute of audio output
  textInput: 5,                 // $5 per 1M tokens (not used in voice-only)
  textOutput: 20,               // $20 per 1M tokens (not used in voice-only)
};

// Session limits
export const SESSION_LIMITS = {
  maxSessions: 3,
  sessionTimeMinutes: 10,
  warningTimeMinutes: 8,
};

// Audio constants
export const AUDIO_CONSTANTS = {
  audioTokensPerSecond: 1667, // OpenAI uses ~1667 audio tokens per second
  pcm16BytesPerSecond: 24000 * 2, // 24000 samples/sec * 2 bytes/sample
};