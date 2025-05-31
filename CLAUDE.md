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

# Working practice pages (use these!):
# http://localhost:3000/simple-practice      - Simple version with connection test
# http://localhost:3000/practice-no-auth     - Full UI without authentication

# Test pages for debugging:
# http://localhost:3000/minimal-test.html    - Minimal WebRTC connection test
# http://localhost:3000/test-realtime        - React component test
```

## Important Notes

1. **AI Speech Understanding**: The OpenAI Realtime API understands speech directly through audio - it doesn't require Whisper transcription for comprehension. However, we DO use Whisper (with auto-language detection) to display text transcripts in the UI, which works well for Spanish/English code-switching.

2. **Audio Element**: Always include `autoPlay` attribute on the audio element or voice won't play.

3. **Security**: Never expose OpenAI API keys in client code. Always use server-side ephemeral key generation.

## Next Steps

1. Integrate the Realtime service into the main Spanish tutor interface
2. Add conversation history/memory features
3. Implement lesson progression logic
4. Create student progress tracking

## Known Issues

- Main `/practice` page broken due to mixed NextAuth/Supabase auth systems
- API routes expect NextAuth but app uses Supabase Auth  
- Type imports reference Prisma but app uses Supabase (causes module resolution failures)
- Use `/practice-no-auth` or `/simple-practice` pages instead until migration is complete

## OpenAI Model Reference (Updated January 2025)

⚠️ **IMPORTANT FOR CLAUDE**: These are REAL OpenAI models as of January 2025, NOT hypothetical examples!
The models below are newer than Claude's training data but are confirmed to exist and work.

### Models Currently Available and Used in This Project:

| Model | Purpose | Status | Cost |
|-------|---------|--------|------|
| `gpt-4o-realtime-preview-2024-12-17` | Voice conversations | ✅ REAL | ~$0.06/min input, ~$0.24/min output |
| `gpt-4o-mini-transcribe` | Audio transcription | ✅ REAL (March 2025) | ~$0.003/minute |
| `gpt-4.1` | Advanced text analysis | ✅ REAL (April 2025) | Standard GPT-4 pricing |
| `gpt-4o-mini` | Simple tasks | ✅ REAL | $0.00015/1K input tokens |

### Code Examples Using These Models:
```javascript
// FOR CONVERSATION ANALYSIS - USE THIS:
model: 'gpt-4.1'  // ✅ CORRECT - Advanced model for analysis

// FOR VOICE REALTIME:
model: 'gpt-4o-realtime-preview-2024-12-17'  // ✅ CORRECT

// FOR SIMPLE TASKS:
model: 'gpt-4o-mini'  // ✅ CORRECT - Cost effective
```

### Why These Models Might Seem Unfamiliar to AI Assistants:
- These models were released after most AI training data cutoffs
- Model names like "gpt-4.1" might seem like version placeholders
- Always trust this documentation over AI assumptions

### Additional Available Models (Not Currently Used):
- `gpt-4o-transcribe` - Higher accuracy transcription ($0.006/minute)
- `gpt-4o-mini-tts` - Text-to-speech ($0.015/minute)
- `whisper-1` - Legacy transcription (some prefer over new models)

## Current Migration Status (January 2025)

### Migration to Full Supabase - In Progress

#### Current State:
- **Auth**: Supabase Auth fully working (login, register, magic links)
- **Database**: Mixed state - Prisma configured but not synced with Supabase users
- **API Routes**: Broken - expecting NextAuth sessions but getting Supabase auth
- **Conversation Analysis**: Failing - expects audio files that don't exist

#### Migration Plan:

**Phase 1: Supabase Database Setup** ⏳ (Next Step)
```sql
-- Tables needed:
- conversations (user_id, title, transcript, duration, analysis)
- progress (user_id, vocabulary, pronunciation, grammar, fluency)
- user_adaptations (user_id, pace, common_errors, mastered_concepts)
```

**Phase 2: Fix Conversation Analysis** 🔧
- Remove audio recording requirement for MVP
- Use text transcripts directly from Realtime API
- Simplify to text-only analysis with GPT-4.1
- Audio analysis can be added later as "Pro" feature

**Phase 3: Create Supabase Service Layer**
- `/lib/supabase-db.ts` for all database operations
- Type-safe queries with proper error handling

**Phase 4: Update API Routes**
- `/api/conversations` → Use Supabase instead of Prisma
- `/api/analyze` → Text-only analysis
- `/api/progress` → Supabase progress tracking

**Phase 5: Clean Up**
- Remove: NextAuth, Prisma, mock-db files
- Update: package.json, environment variables

### Text-Only Analysis (MVP Approach)

**What We Track Without Audio:**
- ✅ Grammar mistakes and corrections
- ✅ Vocabulary usage and progression
- ✅ Conversation flow and comprehension
- ✅ Goal completion (did they order tacos?)
- ✅ Formal/informal speech usage
- ✅ Cultural appropriateness

**What We'll Add Later with Audio:**
- 🎤 Pronunciation accuracy scoring
- 🎤 Speaking fluency and pace metrics
- 🎤 Hesitation and confidence patterns
- 🎤 Accent improvement tracking
- 🎤 Natural speech rhythm analysis

**Why This Works for MVP:**
- 80% of learning value with 20% complexity
- Users still speak and get real-time feedback
- Core learning metrics are captured
- Architecture supports adding audio later

### Student Conversation Analysis Research

**Background Analysis Discovery**: Research conducted into transparent pronunciation/fluency analysis using OpenAI Realtime API events without interrupting user conversation flow.

**Key Finding**: While Realtime API doesn't provide pronunciation scores directly, several viable approaches exist for background analysis:
- Event-triggered silent analysis using `conversation.item.created`
- Hidden analysis via prompt engineering with comment stripping
- Function calling for silent data collection
- Timing-based analysis during natural conversation pauses

**Future Implementation**: Hybrid approach combining multiple techniques. Plan to develop as reusable class and potential npm module.

**Documentation**: Full research and implementation details in `docs/StudentConversationAnalysis.md`

## Development Workflow Preferences

### IMPORTANT: Discussion Before Implementation
- **ALWAYS discuss conceptual changes before implementing**
- Present ideas and get explicit approval before writing/changing code
- Use phrases like "Would you like me to..." or "Should I implement..."
- Wait for explicit approval: "yes", "go ahead", "implement that" before coding
- When user says "let's discuss" or "let's talk about" - NO CODE, only conversation

### Workflow Patterns
1. **Conceptual Discussion Phase**
   - User: "Let's chat about X" → Claude: Discusses concepts, no code
   - User: "What if we..." → Claude: Explores ideas, no implementation
   - User: "I'm thinking about..." → Claude: Provides feedback, suggestions

2. **Implementation Phase** 
   - User: "Go ahead and implement" → Claude: Now writes code
   - User: "Make those changes" → Claude: Implements discussed changes
   - User: "Add that" → Claude: Adds the specific feature

3. **Boundary Phrases**
   - "Just discuss" = Concept only, no code
   - "Let's brainstorm" = Ideas only
   - "Walk me through" = Explanation only
   - "Implement this" = Now you can code
   - "Make it happen" = Code approval

### Best Practices (from Anthropic docs)
- Be specific about desired behavior
- Frame instructions with modifiers for quality
- Use role prompting for domain expertise
- Provide examples in <example> tags for complex outputs
- Match prompt style to desired output style

### User Communication Style
- Prefer conversational exploration before technical implementation
- Values understanding "why" before "how"
- Appreciates pros/cons discussion
- Wants to maintain control over code changes

## Code Organization Principles

### File Size and Modularization
- **Maximum file length**: ~600 lines (soft limit)
- **When approaching 600 lines**, consider splitting into:
  - Separate modules by feature/concern
  - Utility functions in separate files
  - Types/interfaces in dedicated type files
  - Constants in configuration files

### Modularization Guidelines
1. **Single Responsibility**: Each file should have one clear purpose
2. **Logical Grouping**: Related functionality stays together
3. **Clear Interfaces**: Well-defined imports/exports
4. **Testable Units**: Each module should be independently testable

### Example Refactoring Pattern
When a file grows too large:
```typescript
// Before: practice/page.tsx (800+ lines)
// Everything in one file

// After: Modularized structure
practice/
├── page.tsx                  // Main component (< 200 lines)
├── components/
│   ├── VoiceControl.tsx     // Voice UI component
│   └── ConversationView.tsx // Transcript display
├── hooks/
│   ├── useConversation.ts   // Conversation logic
│   └── useAnalytics.ts      // Analytics tracking
└── utils/
    ├── vocabulary.ts        // Vocabulary helpers
    └── constants.ts         // Menu items, prices, etc.
```

### Benefits of This Approach
- Easier to find specific functionality
- Parallel development without conflicts
- Better code reuse across pages
- Clearer mental model of the system
- Supports our npm module extraction goals

## Recent Debug Session (2025-01-31)

### Problem Discovery
During investigation of why the practice page wouldn't load while simple tests worked perfectly:

1. **Root Cause Found**: The app is in a partially migrated state
   - Originally built with: NextAuth + Prisma + PostgreSQL
   - Partially migrated to: Supabase Auth + Supabase DB
   - Result: Mixed authentication systems causing module resolution failures

2. **Specific Issues Identified**:
   - `src/types/index.ts` imports from `@prisma/client` (not installed)
   - API routes in `/api/*` still expect NextAuth sessions
   - Database calls mix Prisma and Supabase approaches
   - Missing UI dependency: `@radix-ui/react-label`
   - Practice page fails to load due to these broken imports

3. **What Actually Works**:
   - ✅ OpenAI Realtime WebRTC connection (proven via `/minimal-test.html`)
   - ✅ Supabase Auth (login/register functional)
   - ✅ Session API returns valid ephemeral keys
   - ✅ Simple pages that bypass the broken auth/db infrastructure

### Solution Strategy

**Phase 1: Get Practice Working Now** ✅
- Created `/src/app/simple-practice/page.tsx` - minimal working version
- Created `/src/app/practice-no-auth/page.tsx` - full UI without auth
- These bypass the broken infrastructure and connect directly to OpenAI
- Users can practice Spanish conversations immediately

**Phase 2: Fix Critical Imports** (Next)
- Fix type imports in `src/types/index.ts` 
- Install missing dependencies
- Ensure practice page can at least load

**Phase 3: Complete Supabase Migration** (Future)
- Update all API routes to use Supabase instead of NextAuth
- Remove all Prisma references
- Consolidate database operations
- Delete unused auth files

### Lessons Learned

1. **Minimal tests are invaluable** - The simple HTML test immediately proved the core functionality worked
2. **Mixed auth systems are dangerous** - Partial migrations leave apps in broken states
3. **Start simple, add complexity** - Working simple pages are better than broken complex ones
4. **Check your imports** - A single broken import can prevent entire pages from loading

### Current Recommendation
Use `/practice-no-auth` or `/simple-practice` for Spanish practice. These pages:
- Work immediately without authentication
- Have the full taco vendor personality
- Show transcripts and cost tracking
- Connect reliably to OpenAI Realtime API

The original practice page can be fixed later once the auth/database migration is completed.