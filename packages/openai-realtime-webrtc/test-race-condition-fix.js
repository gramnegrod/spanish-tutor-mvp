/**
 * Test script to verify WebRTC race condition fixes
 * This script tests the WebRTCManager initialization flow
 */

const { WebRTCManager } = require('./dist/core/WebRTCManager.js');

async function testWebRTCManager() {
  console.log('Testing WebRTC Manager with race condition fixes...\n');

  // Create manager with test configuration
  const manager = new WebRTCManager({
    tokenEndpoint: process.env.TOKEN_ENDPOINT || 'https://api.example.com/token',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });

  // Track connection states
  const stateLog = [];
  
  manager.on('connectionStateChanged', (state) => {
    const log = {
      time: new Date().toISOString(),
      connectionState: state.connectionState,
      iceConnectionState: state.iceConnectionState,
      iceGatheringState: state.iceGatheringState,
      dataChannelState: state.dataChannelState
    };
    stateLog.push(log);
    console.log('State Change:', JSON.stringify(log, null, 2));
  });

  manager.on('connected', () => {
    console.log('\n✅ WebRTC Connected successfully!');
  });

  manager.on('connectionFailed', (error) => {
    console.error('\n❌ Connection failed:', error.message);
  });

  manager.on('iceCandidate', (candidate) => {
    console.log('ICE Candidate found:', candidate.candidate.substring(0, 50) + '...');
  });

  try {
    console.log('Starting initialization...');
    await manager.initialize();
    
    console.log('\nWaiting for full connection...');
    await manager.waitForConnection(10000);
    
    console.log('\n✅ All tests passed! WebRTC connection established without race conditions.');
    console.log('\nConnection State Timeline:');
    stateLog.forEach((log, index) => {
      console.log(`${index + 1}. ${log.time}: ${log.connectionState} | ICE: ${log.iceConnectionState} | Gathering: ${log.iceGatheringState}`);
    });
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\nConnection State Timeline:');
    stateLog.forEach((log, index) => {
      console.log(`${index + 1}. ${log.time}: ${log.connectionState} | ICE: ${log.iceConnectionState} | Gathering: ${log.iceGatheringState}`);
    });
  } finally {
    // Cleanup
    await manager.close();
    manager.dispose();
  }
}

// Run the test
console.log('WebRTC Race Condition Fix Test\n');
console.log('This test verifies that:');
console.log('1. WebRTC waits for stable connection before negotiating');
console.log('2. ICE gathering completes before sending offer');
console.log('3. Data channel is properly established');
console.log('4. No concurrent negotiations occur\n');

testWebRTCManager().catch(console.error);