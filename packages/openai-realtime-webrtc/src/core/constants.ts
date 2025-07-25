/**
 * Simple constants for OpenAI Realtime WebRTC
 */

// Model and API
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-realtime-preview-2024-12-17';
export const OPENAI_DATA_CHANNEL_NAME = 'oai-events';

// Audio settings
export const DEFAULT_SAMPLE_RATE = 24000;
export const DEFAULT_CHANNEL_COUNT = 1;

// Basic error messages
export const ERROR_MESSAGES = {
  DISPOSED: 'Manager has been disposed',
  ALREADY_INITIALIZED: 'Connection already initialized',
  NOT_INITIALIZED: 'Connection not initialized',
  NOT_CONNECTED: 'Service not connected',
  DATA_CHANNEL_UNAVAILABLE: 'Data channel not available',
  TOKEN_ENDPOINT_MISSING: 'Token endpoint not configured',
  PERMISSION_DENIED: 'Microphone permission denied',
  DEVICE_NOT_FOUND: 'No audio input device found'
} as const;