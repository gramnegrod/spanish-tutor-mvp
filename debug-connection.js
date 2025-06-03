#!/usr/bin/env node

// Debug script to trace connection issues step by step
console.log('🔍 Debug: Testing connection flow step by step...\n');

// Step 1: Test API endpoint directly
async function testEphemeralKeyAPI() {
  console.log('📡 Step 1: Testing ephemeral key API...');
  
  try {
    const response = await fetch('http://localhost:3001/api/session');
    console.log('   Status:', response.status);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Response data keys:', Object.keys(data));
      console.log('   Has client_secret:', !!data.client_secret);
      console.log('   Has value:', !!data.client_secret?.value);
      return data.client_secret?.value;
    } else {
      const error = await response.text();
      console.log('   Error:', error);
      return null;
    }
  } catch (error) {
    console.log('   Fetch Error:', error.message);
    return null;
  }
}

// Step 2: Test WebRTC peer connection creation
async function testWebRTCSetup() {
  console.log('\n🌐 Step 2: Testing WebRTC setup...');
  
  try {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    console.log('   RTCPeerConnection created');
    console.log('   Connection state:', pc.connectionState);
    console.log('   ICE connection state:', pc.iceConnectionState);
    
    return pc;
  } catch (error) {
    console.log('   WebRTC Error:', error.message);
    return null;
  }
}

// Step 3: Test media access
async function testMediaAccess() {
  console.log('\n🎤 Step 3: Testing media access...');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('   Media stream created');
    console.log('   Audio tracks:', stream.getAudioTracks().length);
    return stream;
  } catch (error) {
    console.log('   Media Error:', error.message);
    return null;
  }
}

// Step 4: Test OpenAI WebRTC connection
async function testOpenAIWebRTC(ephemeralKey, pc, mediaStream) {
  console.log('\n🤖 Step 4: Testing OpenAI WebRTC connection...');
  
  if (!ephemeralKey || !pc || !mediaStream) {
    console.log('   Skipping - missing prerequisites');
    return false;
  }
  
  try {
    // Add media track
    pc.addTrack(mediaStream.getTracks()[0]);
    console.log('   Media track added');
    
    // Create data channel
    const dc = pc.createDataChannel('oai-events');
    console.log('   Data channel created');
    
    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('   Local description set');
    console.log('   SDP length:', offer.sdp.length);
    
    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        'Authorization': `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp'
      }
    });
    
    console.log('   OpenAI response status:', response.status);
    
    if (response.ok) {
      const answerSdp = await response.text();
      console.log('   Got answer SDP, length:', answerSdp.length);
      
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });
      console.log('   Remote description set');
      
      return true;
    } else {
      const error = await response.text();
      console.log('   OpenAI Error:', error);
      return false;
    }
  } catch (error) {
    console.log('   WebRTC Connection Error:', error.message);
    return false;
  }
}

// Run all tests
async function runDebugSequence() {
  console.log('Starting connection debug sequence...\n');
  
  const ephemeralKey = await testEphemeralKeyAPI();
  const pc = await testWebRTCSetup();
  const mediaStream = await testMediaAccess();
  const connected = await testOpenAIWebRTC(ephemeralKey, pc, mediaStream);
  
  console.log('\n📊 Summary:');
  console.log('   Ephemeral Key:', ephemeralKey ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   WebRTC Setup:', pc ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   Media Access:', mediaStream ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   OpenAI Connection:', connected ? '✅ SUCCESS' : '❌ FAILED');
  
  // Cleanup
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  if (pc) {
    pc.close();
  }
}

// Check if running in browser environment
if (typeof window !== 'undefined') {
  // Browser environment
  runDebugSequence();
} else {
  // Node.js environment
  console.log('This script needs to run in a browser environment to test WebRTC and media APIs');
  console.log('Open your browser console and paste this script there.');
}