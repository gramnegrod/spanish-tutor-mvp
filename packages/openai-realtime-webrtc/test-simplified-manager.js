/**
 * Test script for simplified WebRTCManager
 * Demonstrates the cleaner API and better error handling
 */

import { WebRTCManagerSimplified } from './dist/webrtc-manager-simplified.js';

// Simple test configuration
const config = {
  tokenEndpoint: '/api/session', // Replace with your endpoint
  model: 'gpt-4o-realtime-preview-2024-12-17'
};

async function testSimplifiedManager() {
  console.log('=== Testing Simplified WebRTC Manager ===\n');
  
  const manager = new WebRTCManagerSimplified(config);
  
  // Set up event handlers - much simpler!
  manager.on('statusChanged', (state) => {
    console.log(`📊 Status: ${state.status}`);
    if (state.error) {
      console.error(`❌ Error: ${state.error}`);
    }
    if (state.isAudioActive) {
      console.log('🎤 Microphone active');
    }
  });
  
  manager.on('qualityChanged', (quality) => {
    const emoji = {
      excellent: '🟢',
      good: '🟡', 
      fair: '🟠',
      poor: '🔴',
      unknown: '⚪'
    }[quality.quality];
    
    console.log(`${emoji} Connection: ${quality.quality} (RTT: ${quality.rtt}ms, Loss: ${quality.packetLoss}%)`);
  });
  
  manager.on('message', (data) => {
    console.log('📨 Message received:', data);
  });
  
  manager.on('error', (error) => {
    console.error('⚠️ Critical error:', error.message);
  });
  
  try {
    // Super simple connection - just one method!
    console.log('Connecting to OpenAI Realtime API...\n');
    await manager.connect();
    
    console.log('✅ Connected successfully!\n');
    
    // Test sending a message
    console.log('Sending test message...');
    manager.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ 
          type: 'input_text', 
          text: 'Hello from the simplified WebRTC manager!' 
        }]
      }
    });
    console.log('✅ Message sent!\n');
    
    // Show connection state
    const state = manager.getState();
    console.log('Current state:', {
      status: state.status,
      quality: state.quality.quality,
      audioActive: state.isAudioActive
    });
    
    // Keep connection open for 10 seconds to see quality updates
    console.log('\nMonitoring connection for 10 seconds...\n');
    
    setTimeout(async () => {
      console.log('\nDisconnecting...');
      await manager.disconnect();
      console.log('✅ Disconnected cleanly');
      
      // Cleanup
      manager.dispose();
    }, 10000);
    
  } catch (error) {
    // Errors now have helpful messages!
    console.error('\n❌ Connection failed:');
    console.error(error.message);
    
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
  }
}

// Example of handling specific errors
async function demonstrateErrorHandling() {
  console.log('\n=== Demonstrating Error Handling ===\n');
  
  // Test without token endpoint
  const manager = new WebRTCManagerSimplified({});
  
  try {
    await manager.connect();
  } catch (error) {
    console.log('Expected error (no token endpoint):');
    console.log(`  ${error.message}`);
    console.log(`  Code: ${error.code}`);
  }
  
  // Test sending without connection
  try {
    manager.send({ test: 'data' });
  } catch (error) {
    console.log('\nExpected error (not connected):');
    console.log(`  ${error.message}`);
    console.log(`  Code: ${error.code}`);
  }
  
  manager.dispose();
}

// Run tests
console.log('Note: This test requires a real token endpoint at /api/session');
console.log('The endpoint should return: { client_secret: { value: "ephemeral_token_here" } }\n');

testSimplifiedManager();

// Uncomment to see error handling examples
// setTimeout(demonstrateErrorHandling, 12000);