# OpenAI Realtime Service

A modular, reusable service for implementing OpenAI's Realtime API using WebRTC for browser-based speech-to-speech conversations.

## Quick Start

### Using the React Hook

```tsx
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime';

function MyComponent() {
  const {
    isConnected,
    isSpeaking,
    connect,
    disconnect,
    audioRef
  } = useOpenAIRealtime({
    instructions: 'You are a helpful assistant.',
    onTranscript: (role, text) => {
      console.log(`${role}: ${text}`);
    }
  });

  return (
    <>
      <button onClick={isConnected ? disconnect : connect}>
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
      <audio ref={audioRef} />
    </>
  );
}
```

### Using the Service Directly

```typescript
import { OpenAIRealtimeService } from '@/services/openai-realtime';

const service = new OpenAIRealtimeService({
  instructions: 'You are a Spanish tutor.',
  voice: 'alloy',
  temperature: 0.8
}, {
  onTranscript: (role, text) => {
    console.log(`${role}: ${text}`);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});

// Connect
await service.connect();

// Update instructions dynamically
service.updateInstructions('Now be a French tutor.');

// Disconnect when done
service.disconnect();
```

## Configuration Options

### RealtimeConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tokenEndpoint` | string | '/api/session' | Server endpoint for ephemeral keys |
| `model` | string | 'gpt-4o-realtime-preview-2024-12-17' | OpenAI model to use |
| `voice` | 'alloy' \| 'verse' | 'alloy' | Voice for responses |
| `instructions` | string | 'You are a helpful assistant.' | System prompt |
| `temperature` | number | 0.8 | Response randomness (0-1) |
| `enableInputTranscription` | boolean | false | Show user speech as text |

### Turn Detection Options

```typescript
turnDetection: {
  type: 'server_vad',      // or 'none'
  threshold: 0.5,          // Voice activity threshold
  prefixPaddingMs: 300,    // Pre-speech buffer
  silenceDurationMs: 200   // Silence before ending turn
}
```

## Events

### Available Events

- `onConnect` - Called when connection is established
- `onDisconnect` - Called when disconnected
- `onError` - Called on any error
- `onSpeechStart` - User starts speaking
- `onSpeechStop` - User stops speaking
- `onTranscript` - Transcription available (user or assistant)
- `onStatusUpdate` - Status message updates

## Server Setup

Create an endpoint that generates ephemeral tokens:

```typescript
// app/api/session/route.ts
export async function GET() {
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy",
    }),
  });

  const data = await response.json();
  return Response.json(data);
}
```

## Best Practices

1. **Don't enable input transcription for multilingual conversations** - The AI understands perfectly without it
2. **Always clean up** - Call `disconnect()` when done
3. **Handle errors gracefully** - Microphone access can be denied
4. **Use server-side token generation** - Never expose API keys

## Common Use Cases

- Language tutoring apps
- Customer service bots
- Voice-controlled interfaces
- Accessibility tools
- Interactive voice response (IVR) systems

## Troubleshooting

### "Missing authentication" error
- You're trying to use WebSocket instead of WebRTC
- Solution: Use this service which implements WebRTC

### Poor transcription quality
- Whisper struggles with mixed languages
- Solution: Disable `enableInputTranscription`

### No audio output
- Check if `audioRef` is properly connected
- Ensure autoplay is allowed in browser

### Connection drops
- Implement reconnection logic in your app
- Monitor the `onDisconnect` event