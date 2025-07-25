/**
 * OpenAI Realtime WebRTC NPM Module
 * 
 * WebRTC-based library for OpenAI's Realtime API. Direct peer-to-peer audio streaming
 * with ultra-low latency for natural voice conversations with AI.
 * 
 * @example Basic Usage
 * ```typescript
 * import { OpenAIRealtimeService } from '@openai-realtime/webrtc';
 * 
 * const service = new OpenAIRealtimeService({
 *   tokenEndpoint: '/api/token',
 *   model: 'gpt-4o-realtime-preview-2024-12-17',
 *   voice: 'alloy',
 *   instructions: 'You are a helpful assistant'
 * });
 * 
 * await service.connect(); // Establishes WebRTC connection
 * // Voice input/output is handled automatically through WebRTC
 * ```
 */

// Export core service
export { 
  OpenAIRealtimeService,
  type RealtimeServiceConfig,
  type RealtimeServiceState,
  type RealtimeServiceEvents
} from './core/OpenAIRealtimeService';

// Export WebRTC manager
export {
  WebRTCManager,
  type WebRTCEvents,
  type ConnectionState
} from './core/WebRTCManager';

// Export constants
export * from './core/constants';

// Export error classes
export * from './core/errors';

// Default export
export { OpenAIRealtimeService as default } from './core/OpenAIRealtimeService';