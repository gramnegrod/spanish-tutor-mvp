/**
 * Test script to verify WebRTCManager can complete negotiation
 */

import { WebRTCManager } from './dist/index.esm.js';

async function testWebRTCManager() {
  console.log('Testing WebRTCManager with mock token endpoint...\n');

  // Create a mock token endpoint for testing
  const config = {
    tokenEndpoint: '/api/session', // This would need to be a real endpoint
    model: 'gpt-4o-realtime-preview-2024-12-17',
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 24000,
    channelCount: 1
  };

  const manager = new WebRTCManager(config);

  // Add event listeners
  manager.on('connected', () => {
    console.log('✅ WebRTC connection established!');
  });

  manager.on('disconnected', (reason) => {
    console.log('❌ WebRTC disconnected:', reason);
  });

  manager.on('connectionFailed', (error) => {
    console.error('❌ Connection failed:', error);
  });

  manager.on('connectionStateChanged', (state) => {
    console.log('Connection state:', {
      connectionState: state.connectionState,
      iceConnectionState: state.iceConnectionState,
      dataChannelState: state.dataChannelState
    });
  });

  try {
    console.log('Initializing WebRTC connection...');
    await manager.initialize();
    
    console.log('WebRTC manager initialized successfully!');
    console.log('Is connected:', manager.isConnected());
    
    // Test sending data
    if (manager.isConnected()) {
      const testMessage = JSON.stringify({
        type: 'test',
        message: 'Hello from WebRTCManager!'
      });
      
      manager.sendData(testMessage);
      console.log('Test message sent');
    }
    
    // Clean up after 5 seconds
    setTimeout(() => {
      console.log('\nClosing connection...');
      manager.close();
      manager.dispose();
    }, 5000);
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Note: This test requires a real token endpoint to work
console.log('Note: This test requires a real token endpoint at /api/session');
console.log('The endpoint should return: { client_secret: { value: "ephemeral_token_here" } }\n');

testWebRTCManager();