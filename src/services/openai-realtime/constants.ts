/**
 * OpenAI Realtime API Constants
 */

// Pricing constants - OpenAI Realtime API pricing as of Jan 2025
export const PRICING = {
  // Official gpt-4o-mini-realtime-preview pricing from OpenAI
  audioInputPerMinute: 0.01,    // $10 per 1M audio tokens × 0.1M tokens/min = $0.01/min
  audioOutputPerMinute: 0.04,   // $40 per 1M audio tokens × 0.1M tokens/min = $0.04/min
  textInput: 0.6,               // $0.60 per 1M tokens
  textOutput: 2.4,              // $2.40 per 1M tokens
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