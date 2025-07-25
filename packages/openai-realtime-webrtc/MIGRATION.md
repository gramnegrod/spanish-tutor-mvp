# Simple Migration Guide: v3.x to v4.0

⚠️ **Note**: This is a simple module for experiments, not production use.

## What Changed

v4.0 removed WebSocket support - it's WebRTC only now.

## Breaking Changes

### 1. WebSocket Support Removed

**Before (v3.x):**
```typescript
const service = new OpenAIRealtimeService({
  connection: {
    websocketUrl: 'wss://api.openai.com/v1/realtime',
    apiBaseUrl: 'https://api.openai.com',
    // WebSocket-specific options
  }
});
```

**After (v4.0):**
```typescript
const service = new OpenAIRealtimeService({
  tokenEndpoint: '/api/token',
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy'
  // WebRTC is now the only connection method
});
```

### 2. Removed Events

The following events have been removed:
- `audioData` - Audio is now handled through WebRTC audio tracks
- `audioCompleted` - Use WebRTC track events instead

**Before (v3.x):**
```typescript
service.on('audioData', (data: ArrayBuffer) => {
  // Process audio data
});

service.on('audioCompleted', () => {
  // Audio playback completed
});
```

**After (v4.0):**
```typescript
// Audio is automatically handled through WebRTC
service.on('audioReceived', (audioData) => {
  // Audio is played through WebRTC audio track
  console.log('Received audio chunk');
});

// Use WebRTC track events
service.on('trackAdded', (track: MediaStreamTrack) => {
  if (track.kind === 'audio') {
    // Audio track added
  }
});
```

### 3. Configuration Changes

**Before (v3.x):**
```typescript
const config = {
  connection: {
    apiKey: 'your-api-key',
    apiBaseUrl: 'https://api.openai.com',
    websocketUrl: 'wss://api.openai.com/v1/realtime',
    tokenEndpoint: '/api/token'
  },
  // Other options
};
```

**After (v4.0):**
```typescript
const config = {
  tokenEndpoint: '/api/token', // Required for ephemeral tokens
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy',
  instructions: 'You are a helpful assistant',
  // WebRTC configuration is handled automatically
};
```

### 4. Audio Handling

Audio is now exclusively handled through WebRTC audio tracks.

**Before (v3.x):**
```typescript
// Manual audio handling
service.on('audioData', async (data) => {
  const blob = new Blob([data], { type: 'audio/pcm' });
  const url = URL.createObjectURL(blob);
  audioElement.src = url;
  await audioElement.play();
});
```

**After (v4.0):**
```typescript
// Automatic audio handling through WebRTC
const { audioRef } = useOpenAIRealtime(config);

// In your component
<audio ref={audioRef} autoPlay />
// Audio plays automatically through WebRTC
```

## New Features in v4.0

### Enhanced WebRTC Control

```typescript
// Monitor connection quality
service.on('connectionStateChange', (state) => {
  console.log('WebRTC state:', state);
});

// Get connection statistics
const stats = await service.getConnectionStats();
console.log('RTT:', stats.roundTripTime);
console.log('Packet loss:', stats.packetLoss);
```

### Simplified API

```typescript
// v4.0 - Clean, simple API
const service = new OpenAIRealtimeService({
  tokenEndpoint: '/api/token',
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy'
});

await service.connect();
// Voice chat is ready!
```

## Quick Migration Steps

1. Update to v4.0
2. Remove WebSocket config
3. Remove `audioData` and `audioCompleted` events
4. Use simple config format (no `connection` wrapper)

That's it! This is a simple module, so migration should be straightforward.