/**
 * Event Migration Example
 * 
 * Shows how to migrate v2 event handlers to v3
 */

// ============================================
// V2 Event Patterns (OLD)
// ============================================

/*
const v2Service = new OpenAIRealtimeService(config);

// Connection events
v2Service.on('ready', () => {
  console.log('Connected and ready');
});

v2Service.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});

v2Service.on('reconnecting', (attempt, maxAttempts) => {
  console.log(`Reconnecting... ${attempt}/${maxAttempts}`);
});

v2Service.on('reconnected', () => {
  console.log('Reconnected successfully');
});

v2Service.on('reconnectionFailed', (error) => {
  console.error('Failed to reconnect:', error);
});

// Audio events
v2Service.on('audioInput', (audioData) => {
  // User's microphone audio
  console.log('User audio:', audioData.byteLength, 'bytes');
});

v2Service.on('audioOutput', (audioData) => {
  // AI's audio response
  console.log('AI audio:', audioData.byteLength, 'bytes');
});

v2Service.on('audioTrackReceived', (track) => {
  // Direct audio track for playback
  const audio = new Audio();
  audio.srcObject = new MediaStream([track]);
  audio.play();
});

// Message events
v2Service.on('textReceived', (text) => {
  console.log('AI said:', text);
});

v2Service.on('conversationUpdated', (items) => {
  console.log('Conversation has', items.length, 'messages');
});

// Function calling
v2Service.on('functionCall', (name, args, callId) => {
  console.log(`Function called: ${name}`, args);
  // Handle function and respond
});

// State and metrics
v2Service.on('stateChanged', (state) => {
  console.log('State:', state);
});

v2Service.on('metricsUpdated', (metrics) => {
  console.log('Metrics:', metrics);
});
*/

// ============================================
// V3 Event Patterns (NEW)
// ============================================

import { OpenAIRealtimeService } from '@openai/realtime-webrtc';
import type { ConnectionState, Message, RealtimeError } from '@openai/realtime-webrtc';

const v3Service = new OpenAIRealtimeService({
  tokenEndpoint: '/api/realtime/token'
});

// Connection events - Now unified
v3Service.on('connectionStateChange', (state: ConnectionState) => {
  switch (state) {
    case 'connected':
      console.log('Connected and ready');
      break;
    case 'connecting':
      console.log('Connecting...');
      break;
    case 'disconnected':
      console.log('Disconnected');
      break;
    case 'error':
      console.log('Connection error');
      break;
  }
});

// Audio events - Simplified
v3Service.on('audioData', (data: ArrayBuffer) => {
  // All audio data comes through this event
  // Context determines if it's input or output
  console.log('Audio data:', data.byteLength, 'bytes');
});

// Message events - Structured
v3Service.on('message', (message: Message) => {
  // All messages have consistent structure
  console.log(`${message.role} message:`, message.text || '[audio]');
  
  if (message.role === 'assistant' && message.text) {
    // This replaces 'textReceived'
    console.log('AI said:', message.text);
  }
  
  if (message.audio) {
    // Audio messages include data
    console.log('Audio message:', message.audio.duration, 'ms');
  }
});

// Speech detection
v3Service.on('speechStart', () => {
  console.log('User started speaking');
});

v3Service.on('speechEnd', () => {
  console.log('User stopped speaking');
});

// Transcription
v3Service.on('transcription', (text: string, isFinal: boolean) => {
  if (isFinal) {
    console.log('User said:', text);
  } else {
    console.log('Partial:', text);
  }
});

// Error handling - Enhanced
v3Service.on('error', (error: RealtimeError) => {
  console.error(`Error ${error.code}:`, error.message);
  
  // Check for specific error types
  if (error.code === 'CONNECTION_FAILED') {
    // Handle connection failures
  } else if (error.code === 'TOKEN_EXPIRED') {
    // Handle token expiration
  }
});

// Debug information
v3Service.on('debug', (info: string) => {
  console.debug('[Debug]', info);
});

// ============================================
// Migration Patterns
// ============================================

// Pattern 1: Connection state tracking
let isReady = false;
let reconnectAttempts = 0;

v3Service.on('connectionStateChange', (state) => {
  const wasReady = isReady;
  isReady = state === 'connected';
  
  if (!wasReady && isReady) {
    // Equivalent to 'ready' event
    console.log('Service is now ready');
    reconnectAttempts = 0;
  } else if (wasReady && !isReady) {
    // Equivalent to 'disconnected' event
    console.log('Service disconnected');
  } else if (state === 'connecting' && reconnectAttempts > 0) {
    // Equivalent to 'reconnecting' event
    console.log(`Reconnecting... attempt ${reconnectAttempts}`);
  }
});

// Pattern 2: Message tracking
const conversation: Message[] = [];

v3Service.on('message', (message) => {
  conversation.push(message);
  // Equivalent to 'conversationUpdated'
  console.log('Conversation updated:', conversation.length, 'messages');
});

// Pattern 3: Custom metrics
const metrics = {
  messagesSent: 0,
  messagesReceived: 0,
  connectionTime: 0,
  lastActivity: Date.now()
};

v3Service.on('message', (message) => {
  if (message.role === 'user') {
    metrics.messagesSent++;
  } else {
    metrics.messagesReceived++;
  }
  metrics.lastActivity = Date.now();
});

v3Service.on('connectionStateChange', (state) => {
  if (state === 'connected') {
    metrics.connectionTime = Date.now();
  }
});

// Pattern 4: Audio playback
// Note: Audio is now handled automatically through WebRTC
// No need to manually manage audio tracks

// ============================================
// Side-by-Side Comparison
// ============================================

class EventMigrationExample {
  // V2 approach
  setupV2Events(service: any) {
    service.on('ready', this.onReady);
    service.on('disconnected', this.onDisconnected);
    service.on('textReceived', this.onTextReceived);
    service.on('audioOutput', this.onAudioOutput);
    service.on('stateChanged', this.onStateChanged);
  }
  
  // V3 approach
  setupV3Events(service: OpenAIRealtimeService) {
    service.on('connectionStateChange', (state) => {
      if (state === 'connected') this.onReady();
      if (state === 'disconnected') this.onDisconnected();
      this.onStateChanged(state);
    });
    
    service.on('message', (message) => {
      if (message.role === 'assistant' && message.text) {
        this.onTextReceived(message.text);
      }
    });
    
    service.on('audioData', this.onAudioOutput);
  }
  
  private onReady() {
    console.log('Ready');
  }
  
  private onDisconnected() {
    console.log('Disconnected');
  }
  
  private onTextReceived(text: string) {
    console.log('Text:', text);
  }
  
  private onAudioOutput(data: ArrayBuffer) {
    console.log('Audio:', data.byteLength);
  }
  
  private onStateChanged(state: any) {
    console.log('State:', state);
  }
}

// ============================================
// Using Event Mapper Helper
// ============================================

import { mapEvent, getEventMigrationGuide } from '../event-mapper';

// Get migration guide
console.log(getEventMigrationGuide());

// Map individual events
const { v3EventName, v3Args, warning } = mapEvent('textReceived', ['Hello world']);
if (warning) {
  console.warn(warning);
}

export {};