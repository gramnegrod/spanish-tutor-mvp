/**
 * Event Mapper
 * 
 * Maps v2 event names and patterns to v3 equivalents.
 * Provides warnings and migration suggestions.
 */

import type { RealtimeEvents } from '../src/types';

// V2 Event definitions for reference
export interface V2Events {
  // Connection events
  ready: () => void;
  disconnected: (reason?: string) => void;
  stateChanged: (state: any) => void;
  reconnecting: (attempt: number, maxAttempts: number) => void;
  reconnected: () => void;
  reconnectionFailed: (error: Error) => void;
  
  // Audio events
  audioInput: (audioData: ArrayBuffer) => void;
  audioOutput: (audioData: ArrayBuffer) => void;
  audioTrackReceived: (track: MediaStreamTrack) => void;
  
  // Message events
  textReceived: (text: string) => void;
  conversationUpdated: (items: any[]) => void;
  
  // Function events
  functionCall: (name: string, args: Record<string, any>, callId: string) => void;
  
  // Metrics events
  metricsUpdated: (metrics: any) => void;
  
  // Error events
  error: (error: Error) => void;
}

// Event mapping configuration
export interface EventMapping {
  v3Event: keyof RealtimeEvents | null;
  transform?: (args: any[]) => any[];
  deprecated: boolean;
  message: string;
  suggestion: string;
}

// V2 to V3 event mappings
export const EVENT_MAPPINGS: Record<keyof V2Events, EventMapping> = {
  // Connection events
  ready: {
    v3Event: 'connectionStateChange',
    transform: () => ['connected'],
    deprecated: true,
    message: 'The "ready" event has been replaced with connectionStateChange',
    suggestion: 'Listen for connectionStateChange and check for "connected" state'
  },
  
  disconnected: {
    v3Event: 'connectionStateChange',
    transform: () => ['disconnected'],
    deprecated: true,
    message: 'The "disconnected" event has been replaced with connectionStateChange',
    suggestion: 'Listen for connectionStateChange and check for "disconnected" state'
  },
  
  stateChanged: {
    v3Event: null,
    deprecated: true,
    message: 'The "stateChanged" event has been removed',
    suggestion: 'Use specific events like connectionStateChange, message, etc.'
  },
  
  reconnecting: {
    v3Event: 'connectionStateChange',
    transform: () => ['connecting'],
    deprecated: true,
    message: 'The "reconnecting" event has been simplified',
    suggestion: 'Listen for connectionStateChange with "connecting" state'
  },
  
  reconnected: {
    v3Event: 'connectionStateChange',
    transform: () => ['connected'],
    deprecated: true,
    message: 'The "reconnected" event has been removed',
    suggestion: 'Listen for connectionStateChange transitions from "connecting" to "connected"'
  },
  
  reconnectionFailed: {
    v3Event: 'error',
    transform: (args) => [{ code: 'RECONNECTION_FAILED', message: args[0]?.message || 'Reconnection failed', details: args[0] }],
    deprecated: true,
    message: 'The "reconnectionFailed" event is now part of the error event',
    suggestion: 'Listen for error events with code "RECONNECTION_FAILED"'
  },
  
  // Audio events
  audioInput: {
    v3Event: 'audioData',
    deprecated: true,
    message: 'The "audioInput" event has been renamed to "audioData"',
    suggestion: 'Use the "audioData" event for all audio streaming'
  },
  
  audioOutput: {
    v3Event: 'audioData',
    deprecated: true,
    message: 'The "audioOutput" event has been merged with "audioData"',
    suggestion: 'Use the "audioData" event and check message context to determine direction'
  },
  
  audioTrackReceived: {
    v3Event: null,
    deprecated: true,
    message: 'The "audioTrackReceived" event has been removed',
    suggestion: 'Audio is now handled automatically through WebRTC'
  },
  
  // Message events
  textReceived: {
    v3Event: 'message',
    transform: (args) => [{
      id: `msg_${Date.now()}`,
      role: 'assistant',
      text: args[0],
      timestamp: Date.now()
    }],
    deprecated: true,
    message: 'The "textReceived" event has been replaced with "message"',
    suggestion: 'Use the "message" event and check the role field'
  },
  
  conversationUpdated: {
    v3Event: 'message',
    transform: (args) => args[0]?.[0] || null,
    deprecated: true,
    message: 'The "conversationUpdated" event has been replaced with individual "message" events',
    suggestion: 'Track messages individually using the "message" event'
  },
  
  // Function events
  functionCall: {
    v3Event: null,
    deprecated: true,
    message: 'Function calling has been redesigned in v3',
    suggestion: 'Configure functions server-side when generating tokens'
  },
  
  // Metrics events
  metricsUpdated: {
    v3Event: null,
    deprecated: true,
    message: 'Built-in metrics have been removed',
    suggestion: 'Implement custom metrics using the available events'
  },
  
  // Error events
  error: {
    v3Event: 'error',
    deprecated: false,
    message: 'The error event remains the same',
    suggestion: 'Continue using the error event as before'
  }
};

/**
 * Map v2 event to v3
 */
export function mapEvent(v2EventName: keyof V2Events, args: any[]): {
  v3EventName: keyof RealtimeEvents | null;
  v3Args: any[];
  warning: string | null;
} {
  const mapping = EVENT_MAPPINGS[v2EventName];
  
  if (!mapping) {
    return {
      v3EventName: null,
      v3Args: args,
      warning: `Unknown v2 event: ${v2EventName}`
    };
  }
  
  // Generate warning if deprecated
  const warning = mapping.deprecated 
    ? `⚠️ Event "${v2EventName}" is deprecated. ${mapping.message}. ${mapping.suggestion}`
    : null;
  
  // Transform arguments if needed
  const v3Args = mapping.transform ? mapping.transform(args) : args;
  
  return {
    v3EventName: mapping.v3Event,
    v3Args,
    warning
  };
}

/**
 * Create v2-compatible event handler that forwards to v3
 */
export function createV2EventHandler(
  v2EventName: keyof V2Events,
  v3Service: any,
  onWarning?: (warning: string) => void
): (...args: any[]) => void {
  return (...args: any[]) => {
    const { v3EventName, v3Args, warning } = mapEvent(v2EventName, args);
    
    if (warning && onWarning) {
      onWarning(warning);
    }
    
    if (v3EventName && v3Service.on) {
      // Forward to v3 event
      v3Service.emit(v3EventName, ...v3Args);
    }
  };
}

/**
 * Get migration suggestions for event usage
 */
export function getEventMigrationGuide(): string {
  let guide = '# Event Migration Guide\n\n';
  guide += 'This guide helps you migrate from v2 events to v3.\n\n';
  
  // Group by category
  const categories = {
    'Connection Events': ['ready', 'disconnected', 'stateChanged', 'reconnecting', 'reconnected', 'reconnectionFailed'],
    'Audio Events': ['audioInput', 'audioOutput', 'audioTrackReceived'],
    'Message Events': ['textReceived', 'conversationUpdated'],
    'Other Events': ['functionCall', 'metricsUpdated', 'error']
  };
  
  Object.entries(categories).forEach(([category, events]) => {
    guide += `## ${category}\n\n`;
    
    events.forEach(eventName => {
      const mapping = EVENT_MAPPINGS[eventName as keyof V2Events];
      if (mapping) {
        guide += `### ${eventName}\n`;
        guide += `- **Status**: ${mapping.deprecated ? 'Deprecated' : 'Active'}\n`;
        guide += `- **V3 Event**: ${mapping.v3Event || 'None'}\n`;
        guide += `- **Note**: ${mapping.message}\n`;
        guide += `- **Migration**: ${mapping.suggestion}\n\n`;
        
        // Add code example
        guide += '**V2 Code:**\n```typescript\n';
        guide += `service.on('${eventName}', (${getV2EventParams(eventName as keyof V2Events)}) => {\n`;
        guide += `  // Your code here\n`;
        guide += `});\n`;
        guide += '```\n\n';
        
        if (mapping.v3Event) {
          guide += '**V3 Code:**\n```typescript\n';
          guide += `service.on('${mapping.v3Event}', (${getV3EventParams(mapping.v3Event)}) => {\n`;
          guide += `  ${getV3EventExample(eventName as keyof V2Events)}\n`;
          guide += `});\n`;
          guide += '```\n\n';
        }
      }
    });
  });
  
  return guide;
}

/**
 * Get v2 event parameters for documentation
 */
function getV2EventParams(eventName: keyof V2Events): string {
  const params: Record<keyof V2Events, string> = {
    ready: '',
    disconnected: 'reason',
    stateChanged: 'state',
    reconnecting: 'attempt, maxAttempts',
    reconnected: '',
    reconnectionFailed: 'error',
    audioInput: 'audioData',
    audioOutput: 'audioData',
    audioTrackReceived: 'track',
    textReceived: 'text',
    conversationUpdated: 'items',
    functionCall: 'name, args, callId',
    metricsUpdated: 'metrics',
    error: 'error'
  };
  
  return params[eventName] || '';
}

/**
 * Get v3 event parameters for documentation
 */
function getV3EventParams(eventName: keyof RealtimeEvents): string {
  const params: Record<keyof RealtimeEvents, string> = {
    connectionStateChange: 'state',
    message: 'message',
    speechStart: '',
    speechEnd: '',
    audioData: 'data',
    transcription: 'text, isFinal',
    error: 'error',
    debug: 'info'
  };
  
  return params[eventName] || '';
}

/**
 * Get v3 event example code
 */
function getV3EventExample(v2EventName: keyof V2Events): string {
  const examples: Record<keyof V2Events, string> = {
    ready: `if (state === 'connected') {\n    // Service is ready\n  }`,
    disconnected: `if (state === 'disconnected') {\n    // Service disconnected\n  }`,
    stateChanged: '// Use specific events instead',
    reconnecting: `if (state === 'connecting') {\n    // Service is connecting/reconnecting\n  }`,
    reconnected: '// Check for state transitions',
    reconnectionFailed: `if (error.code === 'RECONNECTION_FAILED') {\n    // Handle reconnection failure\n  }`,
    audioInput: '// Handle audio data',
    audioOutput: '// Handle audio data',
    audioTrackReceived: '// Audio handled automatically',
    textReceived: `if (message.role === 'assistant') {\n    console.log(message.text);\n  }`,
    conversationUpdated: '// Track individual messages',
    functionCall: '// Configure server-side',
    metricsUpdated: '// Implement custom metrics',
    error: '// Handle error'
  };
  
  return examples[v2EventName] || '// Your code here';
}

/**
 * Batch convert v2 event listeners to v3
 */
export function convertEventListeners(
  v2Listeners: Record<string, Function[]>
): Record<string, Function[]> {
  const v3Listeners: Record<string, Function[]> = {};
  const warnings: string[] = [];
  
  Object.entries(v2Listeners).forEach(([eventName, listeners]) => {
    const mapping = EVENT_MAPPINGS[eventName as keyof V2Events];
    
    if (mapping && mapping.v3Event) {
      if (!v3Listeners[mapping.v3Event]) {
        v3Listeners[mapping.v3Event] = [];
      }
      
      // Wrap listeners with transformation
      listeners.forEach(listener => {
        const wrappedListener = (...args: any[]) => {
          const transformedArgs = mapping.transform ? mapping.transform(args) : args;
          listener(...transformedArgs);
        };
        
        v3Listeners[mapping.v3Event!].push(wrappedListener);
      });
      
      if (mapping.deprecated) {
        warnings.push(`Event "${eventName}": ${mapping.message}`);
      }
    }
  });
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️ Event migration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  return v3Listeners;
}