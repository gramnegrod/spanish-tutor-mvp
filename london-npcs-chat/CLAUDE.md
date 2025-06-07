# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

London NPCs Chat is a standalone web application that enables voice conversations with 25 unique London tour guide NPCs using OpenAI's Realtime API via WebRTC. Each NPC has a distinct personality, backstory, and expertise about specific London landmarks.

## Development Commands

```bash
# Install dependencies
npm install

# Start the server (runs on port 3001)
npm start
# or
npm run dev

# No build step required - vanilla JavaScript application
```

## Architecture

### WebRTC Implementation
This app uses WebRTC (NOT WebSocket) for real-time voice conversations with OpenAI:

1. **Server** (`server.js`): Express server provides `/api/session` endpoint to generate ephemeral tokens
2. **Client** (`app.js`): `SimpleRealtimeConnection` class manages WebRTC peer connections
3. **Data Channel**: Uses `oai-events` channel for bidirectional JSON messaging
4. **Audio Flow**: Microphone → WebRTC → OpenAI → WebRTC → Audio element

### Key Technical Components

**Connection Establishment**:
```javascript
// 1. Fetch ephemeral token from server
const response = await fetch('/api/session');
const { client_secret } = await response.json();

// 2. Create WebRTC offer
const offer = await pc.createOffer();

// 3. Send to OpenAI with bearer token
const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
    method: 'POST',
    body: offer.sdp,
    headers: {
        'Authorization': `Bearer ${client_secret.value}`,
        'Content-Type': 'application/sdp'
    }
});

// 4. Set remote description with answer
await pc.setRemoteDescription({ type: 'answer', sdp: await sdpResponse.text() });
```

**Voice Mapping Strategy**:
- Authority figures (Beefeater, Palace Guard) → `verse` (deepest)
- Technical/Educational → `coral` (bright)
- Religious/Historical → `sage` (warm)
- Cultural/Artistic → `shimmer` (smooth)
- Service/Market → `echo` (friendly)
- Academic/Museum → `alloy` (professional)

### NPC System

**Data Structure** (`london_npcs.json`):
```json
{
  "npcs": [{
    "id": "G1",
    "role": "Tower of London Yeoman Warder",
    "persona_prompt": "You are Beefeater Sergeant Thompson...",
    "backstory": "...",
    "prices_hours": "...",
    "tour_guide_story": "...",
    "current_events_2025": "...",
    "sample_qa": "..."
  }]
}
```

**Personality Configuration**:
- Each NPC has unique `persona_prompt` defining character and speech patterns
- `tour_guide_story` provides detailed location knowledge
- `current_events_2025` adds temporal context for realistic interactions

## Important Implementation Details

### Audio Configuration
- **Format**: PCM16 for both input/output
- **Speech Speed**: 1.25x (25% faster than normal)
- **Turn Detection**: Server VAD with 500ms silence threshold
- **Critical**: Audio element must have `autoPlay` attribute or voice won't play

### Message Protocol
Key events to handle:
- `session.created` → Send session update with NPC personality
- `conversation.item.input_audio_transcription.completed` → User speech
- `response.audio_transcript.delta` → AI response chunks
- `response.audio_transcript.done` → Complete AI response
- `error` → Connection or API errors

### Security
- OpenAI API key stored in `.env.local` (server-side only)
- Ephemeral tokens expire after each session
- No authentication required for the application itself

## Common Development Tasks

### Adding a New NPC
1. Add entry to `london_npcs.json` with unique ID
2. Define `persona_prompt` with character voice and knowledge
3. Include `tour_guide_story` with location-specific details
4. Map to appropriate voice in `getVoiceForNPC()` function

### Testing Voice Connection
1. Check browser console for WebRTC connection state
2. Verify microphone permissions granted
3. Monitor data channel messages for transcription events
4. Ensure audio element exists and has `autoPlay` attribute

### Debugging Tips
- `connection.pc.connectionState` should be 'connected'
- `connection.dataChannel.readyState` should be 'open'
- Check for OpenAI errors in console (rate limits, invalid tokens)
- Verify `/api/session` returns valid `client_secret`

## Architecture Decisions

1. **Vanilla JavaScript**: No framework dependencies for simplicity
2. **Single Connection Class**: Reusable `SimpleRealtimeConnection` for all NPCs
3. **Server-Side Token Generation**: Security best practice
4. **Dynamic Voice Selection**: Different voices enhance character uniqueness
5. **Mobile-First Design**: Responsive grid layout for touch devices