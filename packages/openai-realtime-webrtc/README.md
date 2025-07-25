# @openai-realtime/webrtc

**A simple WebRTC module for OpenAI's Realtime API.** Basic peer-to-peer audio streaming for voice conversations with AI.

> **⚠️ IMPORTANT:** This is a simple, experimental module for basic WebRTC connectivity - NOT a production-ready library. Use at your own risk for prototypes and experiments only.

> **Note:** This is a private repository and is not published to the NPM registry.

## 🌟 Features

- **Basic WebRTC Audio** - Simple peer-to-peer connection
- **Voice Conversations** - Basic bidirectional audio
- **React Hook** - Simple React integration
- **TypeScript Support** - Basic type definitions included

## 🌐 About This Module

This is a simple wrapper around WebRTC functionality for OpenAI's Realtime API. It provides basic voice streaming capabilities for experiments and prototypes.

**What this module does:**
- Establishes a basic WebRTC connection
- Handles simple audio streaming
- Provides a minimal React hook

**What this module does NOT do:**
- Production-level error handling
- Advanced connection management
- Performance optimization
- Comprehensive testing
- Enterprise features

## 📦 Installation

This is a private GitHub package. Install directly from GitHub:

```bash
# Install from GitHub (replace YOUR-USERNAME with your GitHub username)
npm install git+https://github.com/YOUR-USERNAME/spanish-tutor-mvp.git#packages/openai-realtime-webrtc

# Or with a specific branch/tag
npm install git+https://github.com/YOUR-USERNAME/spanish-tutor-mvp.git#v2.0.0

# For Yarn users
yarn add git+https://github.com/YOUR-USERNAME/spanish-tutor-mvp.git#packages/openai-realtime-webrtc
```

### Local Development / Workspace Installation

If you're using this module within a monorepo or for local development:

```json
{
  "dependencies": {
    "@openai-realtime/webrtc": "workspace:*"
  }
}
```

> **Note:** This package is part of a private repository and is not published to the NPM registry. You'll need access to the private GitHub repository to install it.

### Browser Usage (No Build Tools)

For direct browser usage without bundlers:

```html
<!DOCTYPE html>
<html>
<head>
    <script src="path/to/dist/browser.js"></script>
</head>
<body>
    <script>
        // Global variable available
        const service = new OpenAIRealtimeWebRTC.OpenAIRealtimeService({
            tokenEndpoint: '/api/session'
        });
        
        // Same API as the module version
        service.on('connected', () => console.log('Connected'));
        await service.connect();
    </script>
</body>
</html>
```

The browser.js bundle includes all dependencies and works standalone.

## 🚀 Quick Start

Get WebRTC voice chat working with OpenAI's Realtime API:

```typescript
import { OpenAIRealtimeService } from '@openai-realtime/webrtc';

// 1. Create the service with ephemeral token endpoint
const service = new OpenAIRealtimeService({
  tokenEndpoint: '/api/token',  // Your server endpoint that returns ephemeral tokens
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy',
  instructions: 'You are a helpful assistant'
});

// 2. Listen for WebRTC events
service.on('ready', () => {
  console.log('WebRTC connection established');
});

service.on('textReceived', (text) => {
  console.log('AI said:', text);
});

service.on('audioReceived', (audioData) => {
  // Audio is automatically played through WebRTC audio track
  console.log('Received audio chunk');
});

// 3. Connect via WebRTC
await service.connect();

// 4. The service handles all WebRTC negotiation and audio streaming
// Voice input is automatically captured and sent
// AI responses are played through the WebRTC audio track
```

The library handles all WebRTC complexity - ICE negotiation, data channels, and audio streaming. For more examples, see the [examples directory](examples/).

### React Usage

```tsx
import { useOpenAIRealtime } from '@openai-realtime/webrtc/react';

function VoiceChat() {
  const {
    isConnected,
    connect,
    disconnect,
    connectionState,
    audioRef,
    state
  } = useOpenAIRealtime({
    tokenEndpoint: '/api/token',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'alloy',
    instructions: 'You are a helpful assistant'
  });

  return (
    <div>
      {/* WebRTC audio element for AI voice output */}
      <audio ref={audioRef} autoPlay />
      
      <button onClick={isConnected ? disconnect : connect}>
        {isConnected ? 'End Call' : 'Start Voice Chat'}
      </button>
      
      <div>
        <p>WebRTC Status: {connectionState}</p>
        <p>Session ID: {state.sessionId || 'None'}</p>
        <p>Audio Active: {state.isRecording ? 'Yes' : 'No'}</p>
        <p>AI Speaking: {state.isSpeaking ? 'Yes' : 'No'}</p>
        {state.error && <p>Error: {state.error.message}</p>}
      </div>
    </div>
  );
}
```

## ⚙️ Basic Configuration

```typescript
const service = new OpenAIRealtimeService({
  tokenEndpoint: '/api/get-token',    // Your server endpoint
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy',
  instructions: 'You are a helpful assistant'
});
```

That's it! This module keeps things simple. For advanced configuration needs, consider building your own solution.

## 📖 API Reference

### OpenAIRealtimeService

The main service class for managing realtime sessions.

#### Constructor
```typescript
new OpenAIRealtimeService(config: RealtimeServiceConfig)
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `connect()` | Connect to the service | `Promise<void>` |
| `disconnect()` | Disconnect from the service | `Promise<void>` |
| `sendText(text: string)` | Send a text message | `Promise<void>` |
| `updateConfig(config: Partial<RealtimeServiceConfig>)` | Update service configuration | `void` |
| `getState()` | Get current service state | `RealtimeServiceState` |
| `dispose()` | Clean up all resources | `void` |

#### Events

| Event | Description | Payload |
|-------|-------------|---------|
| `ready` | Service connected and ready | `void` |
| `error` | Error occurred | `Error` |
| `textReceived` | Text response from AI | `string` |
| `audioOutput` | Audio response from AI | `ArrayBuffer` |
| `functionCall` | Function call from AI | `FunctionCall` |
| `reconnecting` | Reconnection attempt | `{ attempt: number }` |
| `disconnected` | Service disconnected | `string` (reason) |
| `metricsUpdated` | Metrics updated | `ServiceMetrics` |
| `conversationUpdated` | Conversation updated | `ConversationEntry[]` |
| `costUpdated` | Cost tracking updated | `CostTracking` |

### React Hook: useOpenAIRealtime

#### Usage
```typescript
const result = useOpenAIRealtime(config: RealtimeServiceConfig)
```

#### Returns
```typescript
{
  // Current service state
  state: RealtimeServiceState;
  // Is the service connected?
  isConnected: boolean;
  // Connect to the service
  connect: () => Promise<void>;
  // Disconnect from the service
  disconnect: () => Promise<void>;
  // Send text message
  sendText: (text: string) => void;
  // Update configuration
  updateConfig: (config: Partial<RealtimeServiceConfig>) => void;
  // Audio element ref for playback
  audioRef: RefObject<HTMLAudioElement>;
}
```

## 🎯 Simple Examples

### Basic Connection Monitoring

```typescript
service.on('connectionStateChange', (state) => {
  console.log('Connection state:', state);
});

service.on('error', (error) => {
  console.error('Error:', error);
});
```

### Server Token Endpoint

```typescript
// Simple Express endpoint
app.post('/api/token', async (req, res) => {
  // Your token generation logic here
  res.json({ token: 'your-ephemeral-token' });
});
```

## 🔄 Simple Migration

If you're using v3.x, the main change is removing WebSocket support. See [MIGRATION.md](MIGRATION.md) for details.

## 🐛 Troubleshooting

This is a simple module - expect basic functionality only. Common issues:

- **Connection fails**: Check your token endpoint
- **No audio**: Ensure autoplay is allowed in your browser
- **Errors**: This module has minimal error handling

For production use, consider building a more robust solution.

## 🏗️ Simple Structure

- **Core**: Basic WebRTC connection management
- **React Hook**: Simple React integration
- **Types**: Basic TypeScript definitions

## 🤝 Contributing

This is a simple experimental module. Feel free to fork and modify for your needs.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Remember:** This is a simple experimental module, not a production library. Use it for learning and prototypes!