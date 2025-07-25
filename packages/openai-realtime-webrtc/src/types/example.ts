/**
 * Example usage of the simplified type system
 * 
 * This file demonstrates how to use the types in your application.
 */

import type {
  RealtimeConfig
  // RealtimeState,
  // RealtimeEvents
} from './index';

// Also import the actual service types for more examples
import type {
  RealtimeServiceConfig,
  RealtimeServiceState
} from '../core/OpenAIRealtimeService';

// ===== CONFIGURATION EXAMPLE =====

// Example using simplified types
const _config: RealtimeConfig = {
  tokenEndpoint: '/api/realtime/token',
  voice: 'alloy',
  instructions: 'You are a helpful Spanish tutor',
  debug: true
};

// Example using actual service configuration
const serviceConfig: RealtimeServiceConfig = {
  tokenEndpoint: '/api/realtime/token',
  voice: 'alloy',
  instructions: 'You are a helpful Spanish tutor',
  debug: true,
  temperature: 0.8,
  maxOutputTokens: 4096
};

// ===== STATE EXAMPLE =====

// Example state object - demonstrates RealtimeState structure
// const exampleState: RealtimeState = {
//   connectionState: 'connected',
//   isRecording: false,
//   isSpeaking: true,
//   messages: [
//     {
//       id: 'msg_1',
//       role: 'user',
//       text: 'Hello, how are you?',
//       timestamp: Date.now()
//     },
//     {
//       id: 'msg_2',
//       role: 'assistant',
//       text: 'Hello! I am doing well, thank you.',
//       timestamp: Date.now() + 1000
//     }
//   ],
//   metrics: {
//     duration: 30000,
//     messageCount: 2,
//     avgResponseTime: 1500
//   }
// };

// ===== EVENT HANDLERS EXAMPLE =====

// Example event handlers - demonstrates RealtimeEvents structure
// const eventHandlers: Partial<RealtimeEvents> = {
//   connectionStateChange: (state) => {
//     // Handle connection state changes
//     console.log('Connection state changed:', state);
//   },
//   
//   message: (message) => {
//     // Handle new message: message.text || 'Audio message'
//     console.log('New message:', message);
//   },
//   
//   speechStart: () => {
//     // Handle user starting to speak
//     console.log('User started speaking');
//   },
//   
//   speechEnd: () => {
//     // Handle user stopping speaking
//     console.log('User stopped speaking');
//   },
//   
//   error: (error) => {
//     // Handle error: error.message
//     console.error('Error occurred:', error);
//   }
// };

// ===== SERVICE USAGE EXAMPLE =====

// Example usage function - demonstrates service lifecycle
// async function exampleUsage() {
//   // Import the service from the core module
//   const { OpenAIRealtimeService } = await import('../core/OpenAIRealtimeService');
//   
//   // Create service instance with proper config
//   const service = new OpenAIRealtimeService(serviceConfig);
//   
//   // Set up event listeners
//   service.on('textReceived', (text) => {
//     console.log('AI said:', text);
//   });
//   
//   service.on('error', (error) => {
//     console.error('Service error:', error);
//   });
//   
//   // Connect to the service
//   await service.connect();
//   
//   // Send a text message
//   await service.sendText('Hola, ¿cómo estás?');
//   
//   // The service handles audio automatically through WebRTC
//   // No need to manually start/stop recording
//   
//   // Disconnect when done
//   await service.disconnect();
// }

// ===== REACT HOOK EXAMPLE =====

// This would be in a React component file (.tsx)
/*
// Note: This example should be in a .tsx file to properly handle JSX syntax
// 
// import { useOpenAIRealtime } from '@openai-realtime/webrtc/react';
// 
// function SpanishTutor() {
//   const {
//     isConnected,
//     connect,
//     disconnect,
//     sendText,
//     audioRef,
//     state
//   } = useOpenAIRealtime({
//     tokenEndpoint: '/api/token',
//     voice: 'nova',
//     instructions: 'You are a friendly Spanish tutor',
//     debug: true
//   });
//   
//   return (
//     React.createElement('div', null,
//       React.createElement('h1', null, 'Spanish Tutor'),
//       React.createElement('audio', { ref: audioRef, autoPlay: true }),
//       React.createElement('div', null, 'Status: ' + state.status),
//       React.createElement('button', { 
//         onClick: isConnected ? disconnect : connect
//       }, isConnected ? 'Disconnect' : 'Connect'),
//       React.createElement('button', {
//         onClick: () => sendText('Teach me Spanish!')
//       }, 'Start Lesson'),
//       React.createElement('div', null,
//         state.messages && state.messages.map(msg => 
//           React.createElement('div', { key: msg.id },
//             React.createElement('strong', null, msg.role + ':'), ' ', msg.text
//           )
//         )
//       )
//     )
//   );
// }
*/

// ===== TYPE CHECKING EXAMPLES =====

// import { isRealtimeError } from './index';

// Example error handling function - demonstrates type checking
// function handleError(error: unknown) {
//   if (isRealtimeError(error)) {
//     // TypeScript knows this is a RealtimeError
//     console.error(`Error ${error.code}: ${error.message}`);
//   } else {
//     // Handle unknown error
//     console.error('Unknown error:', error);
//   }
// }

// ===== MESSAGE CREATION EXAMPLES =====

// import { createTextMessage, createAudioMessage } from './utils';

// Example message creation - demonstrates utility functions
// const textMessage = createTextMessage('Hello world', 'user');
// const audioMessage = createAudioMessage('base64audiodata', 'assistant', 3000);
// console.log('Created messages:', { textMessage, audioMessage });

export {}; // Make this a module