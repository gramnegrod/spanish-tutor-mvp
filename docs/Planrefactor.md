Looking at the file sizes, we have some significant bloat:

  Critical Issues (Way Over 600 Lines):

  1. /practice/page.tsx - 1,271 lines 😱 (671 lines over!)
  2. /practice-no-auth/page.tsx - 1,063 lines 😱 (463 lines over!)
  3. /services/openai-realtime.ts - 860 lines 😱 (260 lines over!)
  4. /adaptive-practice/page.tsx - 747 lines 😱 (147 lines over!)

  The Good News:

  The rest of the files are reasonably sized:
  - pedagogical-system.ts - 413 lines ✅
  - RealtimeExamples.tsx - 335 lines ✅
  - All other files under 300 lines ✅

  Modularization Opportunities

  1. Practice Pages (Biggest Offenders)

  The practice pages have become monolithic monsters because we kept adding features directly into them. I can see several clear extraction
  opportunities:

  For /practice/page.tsx & /practice-no-auth/page.tsx:

  practice/
  ├── page.tsx                     // Main component (~200 lines)
  ├── components/
  │   ├── VoiceControlPanel.tsx   // Voice UI + indicators (~150 lines)
  │   ├── ConversationDisplay.tsx // Transcript + cost display (~100 lines)
  │   ├── ProgressFeedback.tsx    // Real-time feedback UI (~150 lines)
  │   ├── SessionStats.tsx        // Live stats + trends (~100 lines)
  │   ├── AdaptationProgress.tsx  // Mode switch visualization (~100 lines)
  │   └── TutorModeIndicator.tsx  // Helper/Immersion mode display (~80 lines)
  ├── hooks/
  │   ├── useConversationLogic.ts // All the onTranscript logic (~200 lines)
  │   ├── useAdaptationSystem.ts  // Consecutive tracking logic (~150 lines)
  │   └── useSessionTracking.ts   // Statistics and progress (~100 lines)
  └── utils/
      ├── comprehensionAnalysis.ts // detectComprehension + helpers (~100 lines)
      ├── vocabularyExtraction.ts  // Spanish word detection (~100 lines)
      └── constants.ts             // Menu items, prices, phrases (~50 lines)

  2. OpenAI Realtime Service

  The service has grown organically and mixes concerns:

  services/openai-realtime/
  ├── RealtimeService.ts          // Core connection logic (~300 lines)
  ├── SessionManager.ts           // Session timers + limits (~200 lines)
  ├── CostTracker.ts             // Cost calculation + events (~150 lines)
  ├── AudioHandler.ts            // Audio element management (~100 lines)
  └── types.ts                   // All interfaces (~100 lines)

  3. What I'm Seeing in the Bloated Files:

  Practice Pages Issues:
  - UI Logic Mixed: React components mixed with business logic
  - Duplicate Code: Both practice pages have nearly identical logic (we ported features)
  - Massive useEffect: The onTranscript callback is doing WAY too much
  - Inline Functions: Huge arrow functions defined inline
  - State Management: Too many useState hooks in one component

  OpenAI Service Issues:
  - Multiple Responsibilities: Connection + session + cost + audio management
  - Long Methods: Some methods are 100+ lines
  - Event Handling: Massive switch statement for realtime events
  - Mixed Concerns: WebRTC, pricing, timers all in one class

  Strategic Refactoring Approach

  Phase 1: Extract Shared Logic (High Impact)

  1. Create useConversationEngine hook - Extract the massive onTranscript logic
  2. Create useAdaptiveSystem hook - Extract adaptation/consecutive tracking
  3. Create shared components - VoiceControl, ProgressFeedback, etc.

  Phase 2: Service Decomposition (Medium Impact)

  1. Split OpenAI service into focused classes
  2. Extract cost tracking into separate service
  3. Create session management utility

  Phase 3: UI Component Extraction (Lower Impact)

  1. Break down practice pages into smaller components
  2. Create shared layout components
  3. Extract constants and utilities

  Benefits of This Approach:

  1. Maintainability: Much easier to find and fix bugs
  2. Testability: Can unit test individual hooks/components
  3. Reusability: Components can be shared between pages
  4. Performance: Better code splitting opportunities
  5. Collaboration: Multiple developers can work without conflicts

