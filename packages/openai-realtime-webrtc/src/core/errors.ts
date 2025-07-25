/**
 * Simple error classes for OpenAI Realtime WebRTC
 */

/**
 * Base error class
 */
export class RealtimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RealtimeError';
  }
}

/**
 * WebRTC connection error
 */
export class WebRTCError extends RealtimeError {
  constructor(message: string) {
    super(message);
    this.name = 'WebRTCError';
  }
}

/**
 * Audio permission error
 */
export class AudioError extends RealtimeError {
  constructor(message: string) {
    super(message);
    this.name = 'AudioError';
  }
}