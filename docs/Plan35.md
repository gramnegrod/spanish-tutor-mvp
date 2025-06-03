# Spanish Tutor MVP - Development Plan (Updated February 2025)

## 📊 Current Status Overview

**Progress: 3 of 6 phases complete (50% done)**

### ✅ Completed Phases

#### Phase 1: Adaptive Learning Foundation (COMPLETE)
**Accomplishments:**
- **Enhanced Comprehension Detection** - Fixed Spanish recognition, added 60+ Mexican expressions
- **Dynamic AI Behavior** - Real-time switching between "Spanish Focus" and "Bilingual Helper" modes
- **Rich Vocabulary Tracking** - Tracks diminutives, multi-word phrases, cultural expressions
- **Persistent Learning Patterns** - User adaptations save/load from Supabase
- **CLT Integration** - Error tolerance scales with level, natural code-switching (60/40 for beginners)

#### Phase 2: Hidden Analysis System (COMPLETE - February 2025)
**What We Built:**
1. **AI Prompt Enhancement**
   - Added hidden `<!--ANALYSIS:pronunciation=X,fluency=Y,errors=[...],strengths=[...],confidence=Z-->` comments
   - Implemented in `generateAdaptivePrompt()` in `/src/lib/pedagogical-system.ts`
   - AI includes analysis after EVERY response, completely invisible to users

2. **Analysis Extraction System**
   - Created `extractHiddenAnalysis()` function - parses and strips comments
   - Clean text displayed to user, analysis processed separately
   - Graceful fallbacks for malformed analysis

3. **Dynamic Profile Updates**
   - `updateProfileFromAnalysis()` enriches profiles with pronunciation/fluency
   - Running average confidence (70% history weight, 30% new)
   - Automatic level progression based on fluency + confidence
   - Error patterns tracked as struggling words

4. **Real-time UI Feedback**
   - Live pronunciation indicator (poor→fair→good→excellent)
   - Fluency progression (halting→developing→conversational→fluent)
   - Confidence meter with percentage display
   - All updates transparent during conversation

**Technical Implementation:**
```typescript
// AI sends hidden analysis:
"¡Órale! Dos tacos de pastor!"
<!--ANALYSIS:pronunciation=good,fluency=developing,errors=[gender_agreement],strengths=[food_vocabulary;ordering_phrases],confidence=0.7-->

// User sees only:
"¡Órale! Dos tacos de pastor!"

// Profile updates with:
{
  pronunciation: 'good',
  fluency: 'developing',
  averageConfidence: 0.65,
  strugglingWords: [...prev, 'gender_agreement'],
  masteredPhrases: [...prev, 'food_vocabulary', 'ordering_phrases']
}
```

### 🔧 Additional Fixes Completed

1. **Session Management** 
   - Fixed audio continuing after navigation
   - Added cleanup on component unmount
   - Disabled auto-timeout for practice-no-auth
   - Fixed max sessions navigation issues

2. **Adaptive Practice Page**
   - Fixed missing transcript display (config was undefined)
   - Added ConversationUI component integration
   - Fixed React rendering errors with object-based mistakes
   - Full database integration for all metrics

3. **Database Tracking**
   - Conversations saved with full transcripts
   - Progress metrics updated (pronunciation, grammar, fluency, cultural)
   - Vocabulary extraction and tracking
   - User adaptations persist across sessions

#### Phase 3: Fix Authentication & Persistence (COMPLETE - February 2025)
**What We Built:**
1. **Modern Supabase Auth Migration**
   - Removed all NextAuth remnants (deleted `/src/types/next-auth.d.ts`)
   - Upgraded to `@supabase/ssr` package (replaced deprecated auth-helpers)
   - Fixed security: middleware now uses `getUser()` instead of `getSession()`
   - Implemented proper cookie management with `getAll/setAll` pattern
   - Fixed all TypeScript errors and build issues

2. **Guest Mode Implementation**
   - Created `GuestStorageService` for localStorage-based persistence
   - Built `UnifiedStorageService` handling both guest and authenticated users
   - Real-time progress tracking (conversations, vocabulary, learner profiles)
   - Smart signup prompts based on usage thresholds

3. **Enhanced Practice Pages**
   - `/practice-no-auth` has full feature parity with authenticated mode
   - Progress card showing conversations and practice minutes
   - Automatic profile saving with adaptive learning persistence
   - "End Session" functionality with proper data saving
   - Guest-to-user migration system ready for implementation

**Technical Accomplishments:**
- Fixed all TypeScript type mismatches
- Resolved conflicting interface definitions
- Proper middleware with route protection
- All pages build successfully

## 🎯 Remaining Development Phases

### Phase 3.5: Cleanup and Review (Priority 1) 
**Goal**: Polish Phase 3 implementation before moving forward

**Note**: This phase will be guided manually by the user. Tasks include:
- Review and test authentication flow thoroughly
- Verify guest mode persistence across sessions
- Clean up any remaining technical debt
- Ensure all error cases are handled
- Document any edge cases found
- Prepare system for Phase 4 scenarios

**When cleanup is complete, we will proceed to Phase 4.**

### Phase 4: Scenario Progression System (Priority 2)
**Goal**: Multiple learning scenarios with intelligent progression

**Current State:**
- Basic scenario structure exists in `/src/config/learning-scenarios.ts`
- Travel agency scenario implemented
- No progression logic or unlocking system

**New Scenarios to Add:**
1. **Market Shopping** (Intermediate)
   - Bargaining practice
   - Quantity expressions (kilo, medio, docena)
   - Price negotiations
   - Cultural: "¿A cómo?" vs "¿Cuánto cuesta?"

2. **Restaurant Ordering** (Intermediate-Advanced)
   - Formal dining vocabulary
   - Special requests/allergies
   - Wine pairing discussions
   - Cultural: Sobremesa conversation

3. **Asking Directions** (Beginner-Intermediate)
   - Street navigation
   - Landmarks and distances
   - Transportation options
   - Cultural: Mexican direction-giving style

4. **Hotel Check-in** (Advanced)
   - Formal register practice
   - Complaint handling
   - Service requests
   - Cultural: Politeness levels

**Progression Features:**
- Unlock based on performance metrics
- Difficulty auto-adjustment within scenarios
- Cross-scenario vocabulary retention
- Achievement badges system
- Recommended next scenario based on weaknesses

### Phase 5: Enhanced Analytics Dashboard (Priority 3)
**Goal**: Rich insights and personalized learning paths

**Analytics Views:**
1. **Progress Overview**
   - Line charts for pronunciation/fluency over time
   - Vocabulary growth curve
   - Practice streak calendar
   - Milestone celebrations

2. **Detailed Metrics**
   - Error pattern analysis
   - Most improved areas
   - Struggling concepts heatmap
   - Conversation success rates

3. **Personalized Insights**
   - "Focus on these 5 words this week"
   - Scenario recommendations based on gaps
   - Optimal practice time suggestions
   - Peer comparison (optional)

4. **Export Features**
   - Progress reports (PDF)
   - Vocabulary lists
   - Achievement certificates

### Phase 6: Production Readiness (Priority 4)
**Goal**: Prepare for public launch

1. **Performance & Reliability**
   - Implement React error boundaries
   - Add exponential backoff for API failures
   - WebRTC reconnection logic
   - Connection quality indicators
   - Offline mode for review

2. **User Experience Polish**
   - Interactive onboarding tour
   - In-app help system
   - Feedback widget
   - Email notifications for milestones
   - Mobile responsive design

3. **Infrastructure**
   - Environment variable management
   - Sentry error tracking
   - Analytics (Mixpanel/Amplitude)
   - Cost monitoring alerts
   - Rate limiting

4. **Content Management**
   - Admin panel for scenarios
   - A/B testing framework
   - Content versioning
   - User feedback loop

## 🚀 Quick Wins Available Now

1. **Vocabulary Expansion** (30 min)
   - Add more Mexican slang
   - Regional variations (Northern vs Southern)
   - Common false friends
   - Cultural expressions

2. **Cost Optimization** (45 min)
   - Warning at $0.50, $1.00 thresholds
   - Daily/weekly cost summaries
   - Cost comparison between modes
   - Tips to reduce costs

3. **UI Enhancements** (1 hour)
   - Dark mode toggle
   - Font size controls
   - Keyboard shortcuts
   - Better loading states

## 📦 Future: NPM Package Extraction

### Package 1: OpenAI Realtime React
**Status**: Ready for extraction after Phase 4
- Core service + React hooks
- TypeScript definitions
- Cost tracking utilities
- Example implementations

### Package 2: Adaptive Language Learning System
**Status**: Ready for extraction after Phase 5
- Comprehension detection
- Hidden analysis system
- Adaptive prompting
- CLT/TBLL principles

### Package 3: Spanish Tutor Components
**Status**: After full production launch
- Conversation UI
- Progress visualizations
- Scenario templates
- Cultural note system

## 🎬 Next Immediate Steps

1. **Complete Phase 3.5** - Cleanup and review with user guidance
2. **Then Phase 4** - Add scenario variety for engagement
3. **Then Phase 5** - Analytics to show learning progress

## 📈 Success Metrics

**Technical:**
- < 2s connection time
- < 100ms transcript lag
- 99.9% uptime
- < $0.30/session average cost

**Learning:**
- 80% scenario completion rate
- 70% return rate after 1 week
- Average 15min sessions
- 50% move beginner→intermediate in 30 days

## 🔑 Key Technical Details

**Models (Per CLAUDE.md):**
- `gpt-4o-realtime-preview-2024-12-17` - Voice conversations
- `gpt-4.1` - Advanced analysis (April 2025 release)
- Hardcoded API key temporarily (environment var issues)

**Database:**
- Supabase with RLS enabled
- Tables: conversations, progress, user_adaptations
- Full transcript and analysis storage

**Storage Architecture:**
- Authenticated users: Supabase with RLS
- Guest users: localStorage with UnifiedStorageService
- Automatic migration path guest→authenticated
- Real-time progress sync across modes

**Architecture:**
- Next.js 15.1.5 with App Router
- OpenAI Realtime via WebRTC
- Ephemeral key generation
- Real-time adaptation engine
- Modern `@supabase/ssr` for authentication

**Working URLs:**
- `/practice-no-auth` - Full-featured guest mode with progress tracking
- `/adaptive-practice` - Structured scenario-based learning (requires auth)
- `/practice` - Main practice page (requires Supabase authentication)