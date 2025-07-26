# Project Configuration for Claude Code

---

## 🚀 QUICK SETUP

### Project Info
**Project Name**: Spanish Tutor MVP  
**Description**: AI-powered conversational Spanish learning app using OpenAI's Realtime API for voice conversations  
**Current Phase**: Phase 4 - Modular Learning System (In Progress)

### Technology Stack
**Framework**: Next.js 15 with TypeScript  
**Database**: Supabase (PostgreSQL + Auth)  
**Key Tools**: TypeScript, Tailwind CSS, OpenAI Realtime API, Framer Motion  
**Runtime**: Node.js 18+

### Commands
```bash
# Start development
npm run dev

# Run tests (REQUIRED before commits)  
npm test  # (tests not yet implemented)

# Lint code (REQUIRED after changes)
npm run lint

# Type checking (REQUIRED after changes)
npx tsc --noEmit --skipLibCheck

# Build for production
npm run build

# Database migrations
npx supabase db push < [sql-file]
```

### Project-Specific Notes
**Auth**: Supabase Auth with magic links and email/password  
**Database**: Language Learning DB module with Supabase/localStorage adapters  
**API**: RESTful routes in /api, ephemeral keys for OpenAI  
**Deployment**: Vercel for frontend, Supabase cloud for backend  
**Gotchas**: 
- Multiple GoTrueClient warning → Use singleton from /lib/supabase-client
- Database errors → Run SQL scripts in repo root
- React key warnings → Use timestamp + random string for IDs

---

# Spanish Tutor MVP - Development Guide

## Core Problem-Solving Philosophy (from CLAUDE-MASTER)

### Always Find Root Causes
- NEVER fix symptoms without understanding the disease
- Use "5 Whys" approach for persistent errors
- If a fix doesn't work, STOP and reassess - you're probably fixing the wrong thing

### Debugging Methodology

1. **Trace Before Fixing**
   - Follow the actual code execution path
   - Don't assume where errors originate
   - Say: "Let me trace where this actually happens" not "This must be in X"

2. **Verify Assumptions**
   - State hypotheses explicitly: "I think X because Y, let me verify"
   - Check your assumptions before making changes
   - If surprised by behavior, your mental model is wrong

3. **Think Architecturally**
   - Consider client/server boundaries
   - Check service layer accessibility
   - Trace data flow through the entire stack
   - Ask: "Is this the right place for this code?"

4. **Systematic Fixes**
   - One deep fix > five shallow patches
   - Address root cause, not error messages
   - Verify the fix actually works
   - Check for similar issues elsewhere

### Anti-Patterns to Avoid

❌ **Whack-a-Mole Debugging**
- Making similar fixes repeatedly
- Fixing error messages without understanding causes
- Adding "just one more check" without addressing why

❌ **Assumption-Based Fixes**
- "AuthError must be in AuthContext"
- "This should work" without verification
- Pattern matching without investigation

❌ **Local Optimization**
- Fixing immediate error without seeing bigger picture
- Making code work without asking if it should exist there
- Patching integration issues instead of architectural ones

### When to Go Deep

ALWAYS do comprehensive analysis for:
- Authentication/authorization issues
- Errors that persist after first fix
- Integration between services/layers
- "Works here but not there" problems
- Client/server communication issues

### File Access Reminder

**⚠️ CRITICAL**: When you get "file not accessible" errors, the file path is wrong. Never assume files exist. Always check directory structure first using LS tool before attempting to read files.

---

## Project Overview
A Spanish learning application using OpenAI's Realtime API for voice-based conversations with an AI tutor.

## Current Status (July 2025)
- **Phase 2 Architecture Refactor COMPLETE**: 77% code reduction achieved
- **Post-Refactor Bug Fixes COMPLETE**: Database schema and validation issues resolved
- **Architecture**: Fully migrated to Supabase (auth + database)
- **Features**: Smart adaptation, comprehension detection, session analytics, real-time analysis during conversation
- **App Status**: FULLY FUNCTIONAL - conversations save properly, analysis works
- **Ready for**: Phase 4 - Scenario Progression System

## Current Architecture

### Core Technology
- **Next.js 15** with TypeScript
- **OpenAI Realtime API** via WebRTC (not WebSocket!)
- **Ephemeral key generation** for secure client connections
- **Supabase**: Authentication and database (fully migrated)
- **Guest Mode**: localStorage-based practice without signup

### Modular Architecture (NPM-Ready)
- **OpenAI Realtime Module**: `src/hooks/useOpenAIRealtime.ts` + `src/services/openai-realtime.ts`
- **Spanish Analysis Module**: `src/lib/spanish-analysis/` (comprehensive vocabulary & cultural analysis)
- **Conversation Engine**: `src/hooks/useConversationEngine.ts` (integrates analysis with realtime)
- **Pedagogical System**: `src/lib/pedagogical-system.ts` (adaptive prompts & comprehension detection)

### Key Learning: WebRTC vs WebSocket
- ❌ WebSocket approach fails due to browser header restrictions
- ✅ WebRTC with ephemeral keys is the correct approach
- Server generates temporary tokens, client uses WebRTC connection

### Recent Architecture Changes (June 2025)
- **Phase 3.5 Complete**: Enhanced real-time progress feedback system
- **Guest Storage Fixed**: Now uses localStorage instead of sessionStorage
- **Component Lifecycle**: Standardized disconnectRef pattern across pages
- **Hidden Analysis**: Verified working with AI comment embedding

### Previous Architecture Changes (January 2025)
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
# http://localhost:3000/practice-no-auth     - Full featured guest mode with progress tracking
# http://localhost:3000/adaptive-practice    - Structured scenarios (requires auth)
# http://localhost:3000/practice             - Main practice (requires auth) ✅ WORKING
# http://localhost:3000/simple-practice      - Minimal test version

# Test pages for debugging:
# http://localhost:3000/minimal-test.html    - Minimal WebRTC connection test
# http://localhost:3000/test-realtime        - React component test
# http://localhost:3000/test-hidden-analysis - Test hidden analysis extraction
```

## Important Notes

1. **AI Speech Understanding**: The OpenAI Realtime API understands speech directly through audio - it doesn't require Whisper transcription for comprehension. However, we DO use Whisper (with auto-language detection) to display text transcripts in the UI, which works well for Spanish/English code-switching.

2. **Audio Element**: Always include `autoPlay` attribute on the audio element or voice won't play.

3. **Security**: Never expose OpenAI API keys in client code. Always use server-side ephemeral key generation.

## Module Integration Guidelines

### 🎯 **UNIFIED ANALYSIS SYSTEM - Spanish Analysis Module (PRIMARY)**

**⚠️ IMPORTANT: ALL practice pages MUST use the Spanish Analysis Module for consistency**

## **Standard Integration Pattern**

### 1. **Core Integration - useConversationEngine**
```typescript
import { useConversationEngine } from '@/hooks/useConversationEngine'
import { LearnerProfile } from '@/lib/pedagogical-system' // Temporary, will migrate

// Initialize with scenario for Spanish analysis
const {
  sessionStats,
  lastComprehensionFeedback, 
  conversationHistory,
  processTranscript,
  resetSession,
  getFullSpanishAnalysis,
  getDatabaseAnalysis
} = useConversationEngine({
  learnerProfile,
  onProfileUpdate: setLearnerProfile,
  scenario: 'taco_vendor' // 🎯 Enables comprehensive Spanish analysis
})
```

### 2. **Required UI Components**
```typescript
import { SpanishFeedbackDisplay } from '@/components/spanish-analysis/SpanishFeedbackDisplay'
import { VocabularyProgressBar } from '@/components/spanish-analysis/VocabularyProgressBar'
import { SessionSummaryWithAnalysis } from '@/components/spanish-analysis/SessionSummaryWithAnalysis'
import { VocabularyGuide } from '@/components/spanish-analysis/VocabularyGuide'

// Real-time feedback
{lastComprehensionFeedback && (
  <SpanishFeedbackDisplay feedback={lastComprehensionFeedback} />
)}

// Progress tracking
<VocabularyProgressBar 
  scenario="taco_vendor"
  analysis={getFullSpanishAnalysis()}
  sessionStats={sessionStats}
/>

// Vocabulary reference
<VocabularyGuide 
  scenario="taco_vendor"
  wordsUsed={getFullSpanishAnalysis()?.wordsUsed.map(w => w.word) || []}
/>

// Enhanced session summary
<SessionSummaryWithAnalysis
  analysis={getFullSpanishAnalysis()}
  sessionStats={sessionStats}
  duration={conversationDuration}
  onClose={handleClose}
/>
```

### 3. **Transcript Processing Integration**
```typescript
onTranscript: (role: 'user' | 'assistant', text: string) => {
  // Process through Spanish Analysis Module
  processTranscript(role, text)
  
  // Update conversation display
  setTranscripts(prev => [...prev, newTranscript])
}
```

### 4. **Available Scenarios**
```typescript
// Supported Spanish analysis scenarios:
'taco_vendor'           // ✅ Don Roberto taco stand (primary)
'mexico_city_adventure' // ✅ Mexico City tourism scenarios  
'hotel_checkin'         // ✅ Hotel registration
'taxi_ride'             // ✅ Taxi conversations
'restaurant'            // ✅ Restaurant ordering
'market'                // ✅ Market shopping
```

## **Implementation Status**

### ✅ **PAGES USING SPANISH ANALYSIS MODULE:**
- `/practice-with-analysis` - Full integration (Don Roberto)
- `/practice-no-auth` - Full integration  
- `/practice` - Full integration
- `/practice-adventure` - 🆕 **NEWLY INTEGRATED** (Mexico City)

### ❌ **DEPRECATED APPROACHES:**
- ~~Direct useOpenAIRealtime usage~~ - Use useConversationEngine instead
- ~~Custom analysis logic~~ - Use Spanish Analysis Module
- ~~Basic pedagogical-system~~ - Migrate to Spanish Analysis Module

## **Benefits of Unified System**

✅ **Consistent Analysis**: Same vocabulary tracking across all scenarios  
✅ **Cultural Authenticity**: Mexican Spanish expressions properly recognized  
✅ **Rich Feedback**: Real-time comprehension and confidence scoring  
✅ **Progress Tracking**: Cumulative vocabulary mastery across sessions  
✅ **Copy-Paste Summaries**: User-friendly session reports  
✅ **NPM Ready**: Modular architecture for future extraction

### Modular Architecture Notes

- **OpenAI Realtime**: Use `useOpenAIRealtime` hook (battle-tested)
- **Spanish Analysis**: Use `useConversationEngine` with scenario parameter  
- **Database Operations**: Use Language Learning DB module (`src/lib/language-learning-db/`)
- **Don't reinvent**: Leverage existing modules instead of creating new ones
- **NPM Ready**: All modules designed for eventual extraction

### 🗄️ **Database Architecture - Language Learning DB Module**

**⚠️ FUTURE: All practice pages should migrate to use the unified Language Learning DB**

```typescript
import { LanguageLearningDB } from '@/lib/language-learning-db'

// Create database instance (handles both auth and guest users)
const db = user 
  ? LanguageLearningDB.createWithSupabase({ url, apiKey })
  : LanguageLearningDB.createWithLocalStorage()

// Unified API for all data operations
await db.saveConversation(conversationData, user)
await db.progress.trackVocabulary(userId, 'es', vocabularyWords)
await db.profiles.updatePreferences(userId, 'es', preferences)
```

**Benefits:**
- ✅ **Storage Agnostic**: Works with Supabase, localStorage, Firebase
- ✅ **Type Safe**: Full TypeScript coverage
- ✅ **NPM Ready**: Designed for extraction as standalone package
- ✅ **Guest Support**: LocalStorage adapter for non-authenticated users
- ✅ **Rich Analytics**: Built-in learning progress tracking

## 🚀 Strategic Module Architecture Plan

### Current Module Status (85% Complete)

#### ✅ **Production-Ready Modules**
1. **Spanish Analysis Module** (80% complete) - `src/lib/spanish-analysis/`
   - Comprehensive vocabulary tracking
   - Cultural authenticity detection
   - Real-time feedback system
   - **Status**: NPM-ready, battle-tested

2. **OpenAI WebRTC Module** (90% complete) - `src/services/openai-realtime/`
   - Real-time speech-to-speech
   - WebRTC connection management
   - Cost tracking
   - **Status**: NPM-ready, production-tested

3. **Language Learning DB** (95% complete) - `src/lib/language-learning-db/`
   - Universal storage API
   - Multi-backend support (Supabase, localStorage)
   - Full service layer
   - **Status**: NPM-ready, fully tested

### 🎯 Future Module Extraction Opportunities

#### 1. **Session Management Module** 🟡
```typescript
// @your-org/learning-session
export class LearningSessionManager {
  startSession(type: 'conversation' | 'video' | 'quiz')
  trackProgress(metrics: SessionMetrics)
  completeSession(results: SessionResults)
  generateSummary(): SessionSummary
}
```
**Extract from**: Various practice pages' timer and completion logic
**Development time**: 1 day

#### 2. **Assessment Module** 🔴 (Critical for growth)
```typescript
// @your-org/assessment-engine
export class AssessmentEngine {
  generateQuiz(content: MediaContent): Quiz
  evaluateResponse(response: UserResponse): Score
  adaptDifficulty(performance: Performance): NextQuestion
  generateFeedback(results: TestResults): Feedback
}
```
**Build new**: No existing code
**Development time**: 2-3 days

#### 3. **Media Learning Module** 🔴 (Future video features)
```typescript
// @your-org/media-learning
export class MediaLearningPlayer {
  loadContent(video: VideoContent)
  syncTranscript(timestamp: number): TranscriptSegment
  trackEngagement(): EngagementMetrics
  extractKeyVocabulary(): VocabularyList
}
```
**Build new**: For 30-second news videos, etc.
**Development time**: 3-4 days

#### 4. **NPC Personality Module** 🟢 (Quick win)
```typescript
// @your-org/ai-personality
export class AIPersonality {
  createCharacter(role: 'taco_vendor' | 'news_anchor' | 'teacher')
  generatePrompt(context: ConversationContext): Prompt
  maintainPersona(history: ConversationHistory): Instructions
}
```
**Extract from**: `src/lib/npc-personality-system.ts`
**Development time**: 4 hours

#### 5. **Adaptive Learning Engine** 🟡
```typescript
// @your-org/adaptive-learning
export class AdaptiveLearningEngine {
  assessComprehension(interaction: LearningInteraction): Level
  adjustDifficulty(performance: Performance): NextChallenge
  recommendContent(profile: LearnerProfile): ContentList
}
```
**Extract from**: Current comprehension detection logic
**Development time**: 1-2 days

### 📋 Recommended Development Plan

#### **Immediate Priority** (This Week)
1. ✅ Complete database migration to Language Learning DB
   - Migrate remaining 4 practice pages
   - Delete old storage services (guest-storage.ts, unified-storage.ts)
   - Time: 2-3 hours

#### **Sprint 1** (Next Week) - Easy Extractions
1. 🟢 Extract NPC Personality Module (4 hours)
2. 🟡 Extract Session Management Module (1 day)
3. 🧹 Clean up pedagogical-system dependencies (1 day)

#### **Sprint 2** (Following Week) - Critical New Modules
1. 🔴 Build Assessment Module (2-3 days)
   - Quiz generation
   - Adaptive difficulty
   - Comprehensive feedback

#### **Sprint 3** (When Ready for Video)
1. 🔴 Build Media Learning Module (3-4 days)
   - Video player integration
   - Transcript synchronization
   - Engagement tracking

#### **Sprint 4** - Advanced Features
1. 🟡 Formalize Adaptive Learning Engine (1-2 days)
2. 🟡 Extract Progress Visualization Components

### 🎬 Example: News Video Learning Feature

With the complete module ecosystem, implementing new features becomes trivial:

```typescript
import { MediaLearningPlayer } from '@your-org/media-learning'
import { AssessmentEngine } from '@your-org/assessment-engine'
import { AIPersonality } from '@your-org/ai-personality'
import { SpanishAnalysis } from '@your-org/spanish-analysis'
import { LearningSessionManager } from '@your-org/learning-session'
import { LanguageLearningDB } from '@your-org/language-learning-db'

async function newsVideoLearning(videoId: string) {
  // Complete learning experience in ~20 lines
  const session = new LearningSessionManager()
  const player = new MediaLearningPlayer()
  const newsAnchor = new AIPersonality('news_anchor')
  
  // Watch video → Conversation → Test → Save
  await player.loadContent(videoId)
  const conversation = await conductConversation(newsAnchor)
  const quiz = new AssessmentEngine().generateQuiz(video)
  await LanguageLearningDB.saveSession(results)
}
```

### 🏆 Strategic Benefits

1. **Rapid Feature Development** - New features in hours, not weeks
2. **Consistent Quality** - Reuse battle-tested components
3. **Team Scalability** - Independent module ownership
4. **Monetization Options** - License modules separately
5. **Community Building** - Open source some, premium others

### 📊 Module Dependency Graph

```
Language Learning DB (Foundation)
    ├── Spanish Analysis Module
    ├── Session Management 
    ├── Assessment Engine
    └── Adaptive Learning
    
OpenAI WebRTC (Communication)
    ├── AI Personality
    └── Media Learning
    
Progress Visualization (UI)
    ├── Spanish Analysis Components
    └── Assessment Results
```

## Next Steps

1. **Phase 4**: Complete database migration to unified Language Learning DB
2. **Phase 5**: Extract Session Management and NPC Personality modules
3. **Phase 6**: Build Assessment Module for testing features
4. **Phase 7**: Create Media Learning Module when ready for video content
5. **Phase 8**: Package all modules as NPM packages for reuse

## Known Issues

- ✅ ~~Main `/practice` page broken~~ - FIXED in Phase 3
- ✅ ~~API routes expect NextAuth~~ - FIXED, now use Supabase
- ✅ ~~Type imports reference Prisma~~ - FIXED, cleaned up
- ✅ ~~Guest storage uses sessionStorage~~ - FIXED, now uses localStorage
- ✅ ~~Component lifecycle inconsistent~~ - FIXED, standardized pattern
- ✅ ~~Hidden analysis uncertain~~ - VERIFIED working

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

## Current Migration Status (June 2025)

### Migration to Full Supabase - ✅ COMPLETE

#### Current State:
- **Auth**: Supabase Auth fully working (login, register, magic links)
- **Database**: Fully migrated to Supabase with proper RLS policies
- **API Routes**: All updated to use Supabase auth and database
- **Conversation Analysis**: Working with text-based analysis

#### ✅ COMPLETE: Phase 3 - Authentication & Persistence (February 2025)
- **Removed NextAuth**: Deleted all NextAuth remnants, fixed type imports
- **Modern Auth**: Upgraded to `@supabase/ssr` package with proper security
- **Guest Mode**: Implemented full guest mode with localStorage persistence
- **Unified Storage**: Created `UnifiedStorageService` for seamless auth/guest handling
- **Build Success**: Fixed all TypeScript errors, all pages building correctly

#### Database Structure Implemented:
```sql
-- Tables created:
- conversations (user_id, title, transcript, duration, analysis, created_at)
- progress (user_id, vocabulary, pronunciation, grammar, fluency, conversations_completed, total_minutes_practiced)
- user_adaptations (user_id, pace, common_errors, mastered_concepts, struggle_areas)
```

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

### Guest Mode Implementation (MVP Enhancement)

**Architecture Overview:**
- **GuestStorageService** (`/src/lib/guest-storage.ts`) - localStorage management ✅ FIXED
- **UnifiedStorageService** (`/src/lib/unified-storage.ts`) - Unified API for auth/guest
- **Migration Ready** - Automatic guest→user data transfer on signup

**What Guests Can Do:**
- ✅ Full adaptive learning with profile persistence
- ✅ Save conversations and progress locally
- ✅ Track vocabulary and practice time
- ✅ Experience all features except cross-device sync
- ✅ Smart signup prompts based on usage

**Implementation Details:**
```typescript
// Guest data structure in localStorage
spanish-tutor-guest-learner-profile: LearnerProfile
spanish-tutor-guest-conversations: GuestConversation[]
spanish-tutor-guest-progress: GuestProgress
```

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

## Authentication Architecture (Updated February 2025)

### Current Implementation
- **Middleware**: `/src/middleware.ts` using `@supabase/ssr`
- **Auth Context**: `/src/contexts/AuthContext.tsx` wraps the app
- **Protected Routes**: Middleware handles `/practice/*` protection
- **Guest Routes**: `/practice-no-auth` and `/adaptive-practice` bypass auth

### Security Best Practices Implemented
1. **Never trust `getSession()`** in server code - always use `getUser()`
2. **Cookie management** uses only `getAll/setAll` methods
3. **Ephemeral keys** for OpenAI WebRTC connections
4. **RLS policies** on all Supabase tables

### Auth Flow
```
User → Middleware → getUser() → Route Protection
  ↓                                ↓
Guest → practice-no-auth    Auth → practice/adaptive-practice
```

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

**Phase 2: Fix Critical Imports** ✅ (COMPLETE)
- Fix type imports in `src/types/index.ts` 
- Install missing dependencies
- Ensure practice page can at least load

**Phase 3: Complete Supabase Migration** ✅ (COMPLETE - February 2025)
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

## Adaptive Learning Implementation Status (February 2025)

### Phase 1: Foundation Solidification ✅ COMPLETE

**What We Built:**
1. **Enhanced Comprehension Detection**
   - Fixed broken Spanish recognition (e.g., "Cuánto cuesta" now properly detected)
   - Added Mexican cultural expressions (órale, güero, simón, chido, etc.)
   - Implemented confidence scoring with Spanish usage bonus
   - Detects both confusion indicators and understanding markers

2. **Dynamic AI Behavior Adaptation**
   - Connected comprehension detection to instruction updates
   - AI now switches between "Spanish Focus" and "Bilingual Helper" modes
   - Real-time adaptation based on user struggle/success patterns
   - Implements CLT principles: communication > grammar perfection

3. **Rich Vocabulary Tracking**
   - Tracks 60+ Mexican Spanish words and phrases
   - Recognizes diminutives (taquitos, salsita, ahorita)
   - Handles multi-word phrases ("con todo", "para llevar")
   - Distinguishes mastered vocabulary from struggle areas

4. **Persistent Learning Patterns**
   - User adaptations save/load from Supabase
   - Tracks common errors and mastered concepts
   - Learning profile persists across sessions
   - Database layer fully tested and working

5. **CLT Pedagogical Integration**
   - Error tolerance scales with learner level
   - Task-based goals (successfully order tacos)
   - Natural code-switching patterns (60/40 for beginners)
   - Cultural authenticity with Mexican expressions

**Key Code Improvements:**
```typescript
// Before: Basic word matching
detectComprehension(text) // → binary yes/no

// After: Nuanced analysis
detectComprehension(text) // → {
  understood: true,
  confidence: 0.75,
  indicators: ['cuánto', 'cuesta', 'tacos']
}

// Before: Static AI personality
instructions: "You are a taco vendor..."

// After: Dynamic adaptation
generateAdaptivePrompt(persona, situation, learnerProfile)
// → Personalized instructions based on user's current needs
```

### Phase 2: Hidden Analysis System ✅ COMPLETE

**What We Built:**
1. **AI Prompt Enhancement**
   - Added hidden analysis instructions to generateAdaptivePrompt()
   - AI now includes `<!--ANALYSIS:pronunciation=X,fluency=Y,errors=[...],strengths=[...],confidence=Z-->` after responses
   - Analysis completely invisible to users

2. **Analysis Extraction System**
   - extractHiddenAnalysis() function parses and strips comments
   - Clean text displayed to user, analysis data processed separately
   - Handles malformed analysis gracefully with fallbacks

3. **Dynamic Profile Updates**
   - updateProfileFromAnalysis() enriches learner profile with pronunciation/fluency metrics
   - Running average confidence calculation (70% weight on history, 30% new)
   - Automatic level progression based on fluency and confidence
   - Error patterns tracked as struggling words

4. **Real-time UI Feedback**
   - Live pronunciation indicator (poor→fair→good→excellent)
   - Fluency progression display (halting→developing→conversational→fluent)
   - Confidence meter with percentage display
   - All updates happen transparently during conversation

**Key Technical Details:**
```typescript
// Analysis format in AI responses:
"¡Órale! Dos tacos de pastor, very good choice!"
<!--ANALYSIS:pronunciation=good,fluency=developing,errors=[gender_agreement],strengths=[food_vocabulary;ordering_phrases],confidence=0.7-->

// Extracted and displayed as:
"¡Órale! Dos tacos de pastor, very good choice!"

// While updating profile with:
{
  pronunciation: 'good',
  fluency: 'developing',
  averageConfidence: 0.65,
  strugglingWords: [...prev, 'gender_agreement'],
  masteredPhrases: [...prev, 'food_vocabulary', 'ordering_phrases']
}
```

### Phase 3: Authentication & Persistence ✅ COMPLETE

**What We Built:**
1. **Modern Auth System** - Removed NextAuth, implemented Supabase SSR
2. **Guest Mode** - Full localStorage-based practice for non-authenticated users
3. **Unified Storage** - Single API for both guest and authenticated data
4. **Migration Path** - Automatic guest→user data transfer on signup

### Phase 3.5: Smart Adaptation System ✅ COMPLETE

**Problem Identified:**
The 30-second cooldown between mode switches was too conservative and artificial:
- Prevented natural learning flow when users improved quickly
- Created frustrating delays when immediate adaptation was needed
- Time-based restrictions don't match real conversation dynamics

**Solution Implemented:**
Replaced time-based cooldown with **consecutive confirmation system**:

```typescript
// Old: Time-based cooldown (artificial delay)
const ADAPTATION_COOLDOWN_MS = 30000; // 30 seconds
if (timeSinceLastAdaptation >= ADAPTATION_COOLDOWN_MS) { /* adapt */ }

// New: Consecutive tracking (natural confirmation)
const REQUIRED_CONFIRMATIONS = 2; // Need 2 consecutive confirmations
if (consecutiveFailures >= REQUIRED_CONFIRMATIONS) { /* switch to helper */ }
if (consecutiveSuccesses >= REQUIRED_CONFIRMATIONS) { /* switch to Spanish */ }
```

**How It Works:**
- **Struggling → Helper Mode**: After 2 consecutive low-confidence responses (< 0.3)
- **Succeeding → Spanish Mode**: After 2 consecutive high-confidence responses (> 0.7)
- **Natural Feel**: Responds immediately when users demonstrate consistent patterns
- **No Artificial Delays**: Mode switches happen as soon as evidence is clear

**Benefits:**
1. **Responsive**: Quick adaptation when users clearly need help or are ready to advance
2. **Stable**: Prevents single outlier responses from causing mode switches
3. **Natural**: Matches real conversation dynamics better than arbitrary time limits
4. **Better UX**: No frustrating waits when users are clearly struggling or succeeding

### Phase 3.5 Enhancement: Real-time Progress Feedback ✅ COMPLETE

**What We Added:**
1. **Live Comprehension Feedback**
   - Color-coded confidence indicators after each response
   - Real-time feedback messages ("¡Excelente!", "Keep trying!")
   - Confidence percentage display

2. **Session Statistics Tracking**
   - Live exchange counter
   - Success rate percentage
   - Streak tracking (with 🔥 indicator)
   - Improvement trend analysis

3. **Adaptation Progress Visualization**
   - Progress bars showing steps to mode switch
   - Clear notifications when adaptation occurs
   - Explanatory messages for AI behavior changes

4. **Enhanced Session Summaries**
   - Detailed performance metrics
   - Vocabulary mastered count
   - Practice duration
   - Personalized encouragement

### Phase 3.6: Spanish Analysis Module ✅ COMPLETE

**What We Built:**
1. **Comprehensive Spanish Analysis System**
   - Location: `src/lib/spanish-analysis/`
   - Mexican vocabulary database (800+ words/phrases)
   - Cultural authenticity detection (órale, güero, chido, etc.)
   - Grammar pattern recognition
   - Scenario-specific vocabulary tracking

2. **Enhanced Conversation Engine Integration**
   - `useConversationEngine` enhanced with scenario parameter
   - Automatic Spanish analysis when scenario provided
   - Real-time vocabulary and cultural feedback
   - Database-ready analysis output

3. **Modular UI Components**
   - `SpanishFeedbackDisplay` - Real-time feedback
   - `VocabularyProgressBar` - Progress tracking
   - `SessionSummaryWithAnalysis` - Enhanced summaries

4. **Database Integration Foundation**
   - Enhanced conversation storage with JSONB analysis
   - Vocabulary and struggle analysis data structures
   - Ready for enhanced database schema migration

**Integration Status:**
- ✅ **practice-with-analysis**: Fully integrated with Spanish analysis
- ❌ **practice-no-auth**: Missing scenario parameter (basic analysis only)
- ❌ **practice**: Missing scenario parameter (basic analysis only)
- ❌ **adaptive-practice**: Uses separate analysis, needs Spanish module integration

### Current Development Status

**Completed Phases:** 4 of 6 (67% complete)
- ✅ Phase 1: Adaptive Learning Foundation
- ✅ Phase 2: Hidden Analysis System
- ✅ Phase 3: Authentication & Persistence
- ✅ Phase 3.5: Enhanced Progress Feedback
- ✅ Phase 3.6: Spanish Analysis Module
- ✅ Phase 4: Modular Learning System (July 2025)
- 📅 Phase 5: Enhanced Analytics Dashboard
- 📅 Phase 6: Production Readiness

### Phase 4: Modular Learning System ✅ COMPLETE (July 2025)

**What We Built:**
1. **Core Module Infrastructure**
   - Module types and interfaces (`src/lib/modules/core/types.ts`)
   - Module registry with singleton pattern
   - Module lifecycle management (initialize, start, pause, resume, end)
   - Module progress tracker with database integration

2. **Two Launch Modules**
   - **Free Practice Module**: Wraps existing practice system
     - Configuration system for features and achievements
     - Progress tracking integration
     - NPM-ready modular design
   
   - **Guided Journey Module**: Structured learning path
     - 11 scenarios across Mexico City
     - Performance-based unlocking (70% comprehension, 5+ vocab)
     - Progressive difficulty (1-5 levels)
     - Streak tracking and achievements

3. **Module Selection Dashboard**
   - Route: `/modules`
   - Visual module cards with progress bars
   - Lock/unlock system visualization
   - Guest mode support indicators
   - Coming soon preview section

4. **Database Support**
   - `module_progress` table with JSONB flexibility
   - RLS policies for secure access
   - Module service in Language Learning DB
   - Progress persistence across sessions

5. **Pedagogical Foundation**
   - Based on Vygotsky's Zone of Proximal Development
   - Scaffolded learning progression
   - Spaced repetition concepts
   - Performance scoring algorithm

**Key Technical Achievements:**
- Clean module abstraction for future expansion
- React context provider for module state
- Type-safe module configuration system
- Flexible JSONB storage for varied module data
- Integration with existing practice infrastructure

**Files Created:**
- RFC: `/docs/rfcs/2025-07-14-module-system.md`
- Documentation: `/docs/modules/` (4 files)
- Core infrastructure: `/src/lib/modules/core/` (4 files)
- Module implementations: `/src/lib/modules/free-practice/`, `/src/lib/modules/guided-journey/`
- UI components: `/src/components/modules/`, `/src/app/modules/`
- Database migration: `/scripts/migrations/add-module-system.sql`

**Note**: Database migration needs manual execution in Supabase dashboard

### Current Testing Status

**Working Pages:**
- `/practice-no-auth` - Full features with basic analysis ✅
- `/practice-with-analysis` - Spanish analysis integration testing ✅
- `/practice` - Full features for authenticated users (basic analysis) ✅
- `/adaptive-practice` - Structured scenarios (separate analysis) ✅
- `/test-hidden-analysis` - Hidden analysis testing ✅
- `/test-spanish-analysis` - Spanish analysis module testing ✅

**Database Status:**
- Supabase tables created and accessible ✅
- RLS policies require authentication (correct security) ✅
- Service functions tested and working ✅
- Automatic timestamps and indexes configured ✅

**Known Issues:**
- ✅ All major issues resolved
- Ready for Phase 4 implementation

### Recent Bug Fixes (July 2025)

1. **Database Schema Issues**: 
   - Added missing `language` column to progress table
   - Fixed unique constraint violations with proper upsert logic
   - Resolved camelCase vs snake_case field naming issues

2. **Transcript Validation Errors**:
   - Fixed "Invalid text at index 60" errors
   - Root cause: AI sending analysis-only responses
   - Solution: Filter empty transcripts at source before adding

3. **Type Errors Fixed**:
   - Added missing `id` field to transcript transformation
   - Removed non-existent `vocabularyLearned` field reference

4. **Real-time Analysis**: Confirmed working during conversation (user likes this)

Previous fixes (June 2025):
1. **Guest Storage**: Changed from sessionStorage to localStorage
2. **Component Lifecycle**: Standardized disconnectRef pattern
3. **Hidden Analysis**: Verified AI comment embedding works
4. **Feature Parity**: Both guest and auth pages have identical features
5. **TypeScript Errors**: All build errors resolved

### Incremental Development Philosophy

We're following a careful, test-driven approach:
1. **Small bites**: Each phase adds one major feature
2. **Adequate testing**: Every feature tested before moving on
3. **User-centric**: Focus on learning experience over technical complexity
4. **Pedagogically sound**: CLT/TBLL principles guide all decisions

The adaptive learning system is now fully functional with real-time visual feedback. Users can see their progress, understand AI adaptations, and track their improvement throughout each session. The system works for both guest and authenticated users with full feature parity.

## Phase 2 Architecture: Component Consolidation (COMPLETE)

### Quick Scenario Creation
With Phase 2 complete, creating new practice scenarios takes only 5 minutes:

```typescript
// Just change these 3 constants!
const SCENARIO = 'restaurant'
const NPC_NAME = 'Carlos'  
const NPC_DESCRIPTION = 'professional waiter at upscale restaurant'

// Full practice page with voice, analytics, and adaptation
export default function PracticeRestaurantPage() {
  const session = usePracticeSession({ scenario, npcName, npcDescription })
  return (
    <PracticeLayout {...props}>
      <SpanishAnalyticsDashboard {...session} />
      <ConversationSession {...session} />
      <VoiceControl {...session} />
    </PracticeLayout>
  )
}
```

### New Shared Architecture
- **usePracticeSession**: Unified hook managing all practice functionality
- **PracticeLayout**: Consistent page structure 
- **ConversationSession**: Complete conversation UI
- **SpanishAnalyticsDashboard**: Live learning metrics
- **77% code reduction**: 660 lines → 150 lines per page

See NOTES.md for detailed documentation on creating new scenarios.