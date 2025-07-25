// Test script for OpenAIRealtimeService
const { OpenAIRealtimeService } = require('./dist/index.js');

async function testService() {
  console.log('Testing OpenAIRealtimeService...\n');

  // Test 1: Configuration adaptation (old format with apiKey)
  console.log('Test 1: Old configuration format');
  const config1 = {
    session: {
      apiKey: 'sk-test123',
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy',
      instructions: 'You are a helpful assistant'
    },
    webrtc: {
      sampleRate: 24000
    }
  };
  
  const service1 = new OpenAIRealtimeService(config1);
  console.log('✅ Service created with old config format');
  console.log(`   WebRTC config has tokenEndpoint: ${!!service1.webrtcManager.config.tokenEndpoint}`);

  // Test 2: New configuration format with tokenEndpoint
  console.log('\nTest 2: New configuration format');
  const config2 = {
    session: {
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy'
    },
    connection: {
      tokenEndpoint: '/api/openai-tokens'
    }
  };
  
  const service2 = new OpenAIRealtimeService(config2);
  console.log('✅ Service created with new config format');

  // Test 3: State management
  console.log('\nTest 3: State management');
  const state = service2.getState();
  console.log(`✅ Initial status: ${state.status}`);
  console.log(`✅ WebRTC state: ${state.webrtc.connectionState}`);
  console.log(`✅ Data channel state: ${state.webrtc.dataChannelState}`);

  // Test 4: isConnected() method
  console.log('\nTest 4: Connection status check');
  console.log(`✅ isConnected() returns: ${service2.isConnected()}`);
  console.log(`✅ isConnecting() returns: ${service2.isConnecting()}`);

  // Test 5: Event listeners
  console.log('\nTest 5: Event listeners');
  let eventCount = 0;
  service2.on('ready', () => { eventCount++; });
  service2.on('disconnected', () => { eventCount++; });
  service2.on('error', () => { eventCount++; });
  console.log('✅ Event listeners registered');

  // Test 6: Method availability
  console.log('\nTest 6: Public API methods');
  const methods = [
    'start', 'stop', 'sendText', 'sendAudio', 
    'updateConfiguration', 'getState', 'getMetrics',
    'isConnected', 'isConnecting', 'isReconnecting',
    'on', 'off', 'removeAllListeners', 'dispose'
  ];
  
  for (const method of methods) {
    if (typeof service2[method] === 'function') {
      console.log(`✅ ${method}() method exists`);
    } else {
      console.log(`❌ ${method}() method missing`);
    }
  }

  // Test 7: Error handling
  console.log('\nTest 7: Error handling');
  try {
    await service2.sendText('test');
  } catch (error) {
    console.log(`✅ Correctly throws when not connected: ${error.message}`);
  }

  // Cleanup
  service1.dispose();
  service2.dispose();
  console.log('\n✅ Services disposed successfully');
}

testService().catch(console.error);