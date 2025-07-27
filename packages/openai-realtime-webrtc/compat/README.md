# Compatibility Helper

Simple helper for v2 → v3 migration. 

⚠️ This is part of a simple experimental module. Not for production use.

## Usage

```typescript
import { OpenAIRealtimeService } from '@openai-realtime/webrtc/compat';

// Your old v2 code might work
const service = new OpenAIRealtimeService({
  session: {
    apiKey: 'sk-...',
    voice: 'alloy'
  }
});
```

That's it. For anything more complex, just use the main module directly.