# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

London NPCs Chat is a standalone web application that enables voice conversations with 25 unique London tour guide NPCs using OpenAI's Realtime API via WebRTC. Each NPC has a distinct personality, backstory, and expertise about specific London landmarks. The app features model selection between GPT-4o and GPT-4o Mini, modern gradient UI design, and both voice and text input capabilities.

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

**Model Selection System**:
```javascript
// User selects model via UI, stored in localStorage
function selectModel(modelName) {
    selectedModel = modelName;
    localStorage.setItem('selectedModel', modelName);
}

// Server accepts model parameter
app.get('/api/session', async (req, res) => {
    const requestedModel = req.query.model || 'gpt-4o-mini-realtime-preview-2024-12-17';
    // Creates session with specified model
});

// Client sends model preference
const selectedModel = localStorage.getItem('selectedModel') || 'gpt-4o-mini-realtime-preview-2024-12-17';
const tokenResponse = await fetch(`/api/session?model=${encodeURIComponent(selectedModel)}`);
```

**Connection Establishment**:
```javascript
// 1. Fetch ephemeral token from server with model preference
const selectedModel = localStorage.getItem('selectedModel') || 'gpt-4o-mini-realtime-preview-2024-12-17';
const response = await fetch(`/api/session?model=${encodeURIComponent(selectedModel)}`);
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

### Model Options
- **Premium**: `gpt-4o-realtime-preview-2024-12-17` (Higher Quality)
- **Cost-Efficient**: `gpt-4o-mini-realtime-preview-2024-12-17` (Good Quality)
- **Pricing**: Both models use same realtime API pricing structure
- **Selection**: Persisted via localStorage, visible throughout conversation

### Audio Configuration
- **Format**: PCM16 for both input/output
- **Speech Speed**: 1.1x (10% faster than normal)
- **Turn Detection**: Server VAD (toggleable) with variable silence threshold
- **VAD Control**: Users can switch between automatic VAD and push-to-talk mode
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

## User Interface Features

### Model Selection
- **Location**: Top of home page, always visible during conversation
- **Options**: Premium GPT-4o vs Cost-Efficient GPT-4o Mini
- **Persistence**: Choice saved in localStorage and restored on page load
- **Visual Feedback**: Selected model highlighted with gradient border

### Input Methods
- **Voice Input**: Primary method with microphone and VAD control
- **Text Input**: Alternative method with textarea and send button
- **Push-to-Talk**: Available when VAD is disabled (backtick key)
- **Keyboard Shortcuts**: Ctrl+Enter to send text messages

### Visual Design
- **Theme**: Purple gradient background with glassmorphism effects
- **Cards**: London landmark photos with overlay text and hover animations
- **Chat Interface**: Modern bubble layout with markdown support
- **Code Blocks**: Blackboard-style formatting for technical content

## User Instructions

### How to Use Voice Modes

**Voice Activity Detection (VAD) Mode - Default:**
1. Click "Start Tour" button
2. Simply speak naturally - AI detects when you start/stop talking
3. AI responds automatically after detecting silence
4. No manual controls needed

**Push-to-Talk (PTT) Mode:**
1. Click "VAD: OFF" button to disable automatic detection
2. Button changes to red and shows "VAD: OFF"
3. Status message shows: "Push-to-Talk Mode: Hold ` (backtick) key to talk"
4. **To speak**: Hold down the backtick key (`) while talking
5. **To get response**: Release the backtick key - AI will respond
6. Button shows "TALKING..." while backtick is pressed

### Text Input Alternative
1. Use the text area at bottom of chat interface
2. Type your message or paste text
3. Click "Send Text" or press Ctrl+Enter
4. AI responds in voice (connection may restart briefly after text)

## Common Development Tasks

### Adding a New NPC
1. Add entry to `london_npcs.json` with unique ID
2. Define `persona_prompt` with character voice and knowledge
3. Include `tour_guide_story` with location-specific details
4. Map to appropriate voice in `getVoiceForNPC()` function
5. Add corresponding image URL in `getUnsplashImage()` function

### Testing Voice Connection
1. Check browser console for WebRTC connection state
2. Verify microphone permissions granted
3. Monitor data channel messages for transcription events
4. Ensure audio element exists and has `autoPlay` attribute
5. Test both VAD and push-to-talk modes

### Testing Model Selection
1. Switch between models via UI buttons
2. Verify selection persists after page reload
3. Check server logs show correct model parameter
4. Confirm different model behavior in conversations

### Debugging Tips
- `connection.pc.connectionState` should be 'connected'
- `connection.dataChannel.readyState` should be 'open'
- Check for OpenAI errors in console (rate limits, invalid tokens)
- Verify `/api/session?model=X` returns valid `client_secret`
- Monitor localStorage for model persistence

## Architecture Decisions

1. **Vanilla JavaScript**: No framework dependencies for simplicity
2. **Single Connection Class**: Reusable `SimpleRealtimeConnection` for all NPCs
3. **Server-Side Token Generation**: Security best practice with model parameter support
4. **Dynamic Voice Selection**: Different voices enhance character uniqueness
5. **Mobile-First Design**: Responsive grid layout for touch devices
6. **Model Choice Transparency**: Always visible to inform users of cost/quality tradeoffs
7. **localStorage Persistence**: User preferences maintained across sessions
8. **Dual Input Methods**: Voice and text for accessibility and preference
9. **Modern Visual Design**: Gradient themes with glassmorphism for professional appearance
10. **Modular Image System**: Curated London landmark photos for authentic experience

## Recent Enhancements

### Model Selection System (Latest)
- Added user-selectable AI model choice (GPT-4o vs GPT-4o Mini)
- Persistent selection via localStorage
- Server-side model parameter handling
- Visual feedback and cost transparency

### Visual Design Overhaul
- Purple gradient background with modern styling
- Enhanced card designs with landmark photography
- Chat bubble interface with markdown support
- Glassmorphism effects throughout UI

### Input/Output Improvements
- Voice Activity Detection toggle
- Push-to-talk mode with backtick key
- Text input alternative with Ctrl+Enter shortcut
- Blackboard-style code formatting
- Auto-reconnection after text responses