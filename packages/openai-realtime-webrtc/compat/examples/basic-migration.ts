/**
 * Basic Migration Example
 * 
 * Shows how to migrate a simple v2 application to v3
 */

// ============================================
// V2 Code (OLD)
// ============================================

/*
import { OpenAIRealtimeService } from '@openai/realtime-webrtc';

const v2Config = {
  session: {
    apiKey: 'sk-...',  // Direct API key
    model: 'gpt-4o-realtime-preview',
    voice: 'alloy',
    instructions: 'You are a helpful assistant.',
    temperature: 0.8,
    tools: [{
      type: 'function',
      name: 'get_weather',
      description: 'Get current weather',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        }
      }
    }]
  },
  webrtc: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  },
  autoReconnect: true,
  debug: true
};

const service = new OpenAIRealtimeService(v2Config);

// Event handlers
service.on('ready', () => {
  console.log('Service ready!');
});

service.on('textReceived', (text) => {
  console.log('AI said:', text);
});

service.on('error', (error) => {
  console.error('Error:', error);
});

// Start the service
await service.start();

// Send a message
await service.sendText('Hello!');
*/

// ============================================
// V3 Code (NEW) - Direct Migration
// ============================================

import { OpenAIRealtimeService } from '@openai-realtime/webrtc';
import type { RealtimeServiceConfig } from '@openai-realtime/webrtc';

// Step 1: Update configuration
const v3Config: RealtimeServiceConfig = {
  // REQUIRED: Token endpoint instead of API key
  tokenEndpoint: '/api/realtime/token',
  
  // Simple, flat configuration
  voice: 'alloy',
  instructions: 'You are a helpful assistant.',
  audioFormat: 'pcm16',
  enableVAD: true,
  
  // Optional settings
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  autoReconnect: true,
  debug: true
};

// Step 2: Create service (same as before)
const service = new OpenAIRealtimeService(v3Config);

// Step 3: Update event handlers
service.on('connectionStateChange', (state) => {
  if (state === 'connected') {
    console.log('Service ready!');
  }
});

service.on('message', (message) => {
  if (message.role === 'assistant' && message.text) {
    console.log('AI said:', message.text);
  }
});

service.on('error', (error) => {
  console.error('Error:', error);
});

// Step 4: Use new method names
await service.connect();  // Instead of start()

// Send messages (same as before)
await service.sendText('Hello!');

// ============================================
// Server-Side Token Endpoint (NEW REQUIREMENT)
// ============================================

/*
// You need to implement this endpoint on your server:

app.get('/api/realtime/token', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        // Configure model settings here (temperature, tools, etc.)
        voice: 'alloy',
        temperature: 0.8,
        tools: [{
          type: 'function',
          name: 'get_weather',
          description: 'Get current weather',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' }
            }
          }
        }]
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get token' });
  }
});
*/

// ============================================
// Using the Compatibility Layer (TEMPORARY)
// ============================================

/*
// If you need more time to migrate, use the compatibility layer:

import { OpenAIRealtimeService } from '@openai/realtime-webrtc/compat/v2-adapter';

// Your v2 code works as-is, but you'll see deprecation warnings
const service = new OpenAIRealtimeService(v2Config);

// This gives you time to:
// 1. Set up the token endpoint
// 2. Update event handlers
// 3. Test thoroughly
// 4. Migrate gradually
*/

// ============================================
// Key Differences Summary
// ============================================

/*
1. Configuration:
   - V2: Nested config with API key
   - V3: Flat config with token endpoint

2. Authentication:
   - V2: Direct API key in client
   - V3: Server-side token generation

3. Connection:
   - V2: service.start()
   - V3: service.connect()

4. Events:
   - V2: 'ready', 'textReceived', etc.
   - V3: 'connectionStateChange', 'message', etc.

5. Features moved server-side:
   - Model selection
   - Temperature
   - Tools/Functions
   - Max tokens
*/