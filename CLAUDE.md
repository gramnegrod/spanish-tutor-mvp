# Spanish Tutor MVP - Development Guide

## Project Overview
A Spanish learning application using OpenAI's Realtime API for voice-based conversations with an AI tutor.

## Current Architecture

### Core Technology
- **Next.js 15** with TypeScript
- **OpenAI Realtime API** via WebRTC (not WebSocket!)
- **Ephemeral key generation** for secure client connections

### Key Learning: WebRTC vs WebSocket
- ❌ WebSocket approach fails due to browser header restrictions
- ✅ WebRTC with ephemeral keys is the correct approach
- Server generates temporary tokens, client uses WebRTC connection

### Recent Architecture Changes (2025-01-29)
- **Removed all WebSocket implementations** - Standardized on WebRTC approach
- **Deleted files:**
  - `/src/lib/openai-realtime.ts` (WebSocket implementation)
  - `/src/lib/openai-realtime-mock.ts` (WebSocket mock)
  - `/src/app/demo-direct/page.tsx` (Direct WebSocket demo)
- **Updated `useRealtimeConnection` hook** - Now wraps the WebRTC service
- **Practice page** - Now uses WebRTC service with automatic microphone handling

## OpenAI Realtime Service Roadmap

### Current Status: Phase 1 - Internal Library ✅
The service is currently organized as an internal library at:
```
src/
├── services/
│   └── openai-realtime.ts    (core service)
├── hooks/
│   └── useOpenAIRealtime.ts  (React hook)
└── components/
    └── examples/
        └── RealtimeExamples.tsx
```

### Roadmap to NPM Package

#### Phase 1: Keep Simple (Current) ✅
- Store in project's lib folder
- Use in Spanish tutor app
- Document learnings

#### Phase 2: Battle Test (In Progress)
- [ ] Use extensively in Spanish tutor features
- [ ] Identify API improvements needed
- [ ] Add error recovery mechanisms
- [ ] Test with different configurations
- [ ] Gather performance metrics

#### Phase 3: Refine API
- [ ] Consolidate learnings from usage
- [ ] Improve TypeScript types
- [ ] Add more event handlers
- [ ] Create comprehensive test suite
- [ ] Handle edge cases discovered

#### Phase 4: Extract to NPM Package
- [ ] Create separate repository
- [ ] Set up build pipeline
- [ ] Write complete documentation
- [ ] Publish to NPM (public or private)
- [ ] Create migration guide

### Target Library Structure
```
lib/openai-realtime/
├── index.ts              // Public API exports
├── service.ts            // Core service
├── hook.ts              // React hook  
├── types.ts             // TypeScript interfaces
├── constants.ts         // Default configs
├── utils.ts             // Helper functions
├── __tests__/           // Unit tests
├── examples/            // Usage examples
└── README.md            // Documentation
```

## Key Files and Locations

### Documentation
- `/docs/openai-realtime-learnings.md` - WebRTC implementation details
- `/src/services/README.md` - Service usage guide

### Test Pages
- `/public/webrtc.html` - Original working prototype
- `/src/app/test-realtime/page.tsx` - React component test

### API Endpoint
- `/src/app/api/session/route.ts` - Ephemeral key generation

## Development Commands

```bash
# Start development server
npm run dev

# Test the service
# Visit: http://localhost:3000/test-realtime

# Original prototype
# Visit: http://localhost:3000/webrtc.html
```

## Important Notes

1. **No Whisper Transcription**: The AI understands speech perfectly without text transcription. Whisper often produces errors with multilingual input.

2. **Audio Element**: Always include `autoPlay` attribute on the audio element or voice won't play.

3. **Security**: Never expose OpenAI API keys in client code. Always use server-side ephemeral key generation.

## Next Steps

1. Integrate the Realtime service into the main Spanish tutor interface
2. Add conversation history/memory features
3. Implement lesson progression logic
4. Create student progress tracking

## Known Issues

- NextAuth session errors in console (harmless, can be ignored)
- No database/auth currently implemented (by design for MVP)