/**
 * OpenAI Realtime WebRTC Core Module
 * 
 * Exports core functionality for managing OpenAI Realtime API sessions
 * and WebRTC connections.
 */

// Main Service Class
export {
  OpenAIRealtimeService
} from './OpenAIRealtimeService';

// Note: Individual managers are not exported by default as they're 
// implementation details of OpenAIRealtimeService. The service provides
// a cleaner, unified API for all functionality.