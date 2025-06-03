Comprehensive Context Prompt for /compact

  I'm continuing work on my Spanish tutor app. Here's the complete context:

  🏗️ Current State Overview

  What's Working Well:
  - ✅ OpenAI Realtime WebRTC voice conversations work perfectly
  - ✅ Cost tracking fixed ($0.06/min input, $0.24/min output using audio tokens)
  - ✅ Database persistence to Supabase (conversations, progress, adaptations)
  - ✅ Detailed analysis after conversations with performance metrics
  - ✅ Human speech transcription using Whisper (auto-language detection)
  - ✅ Authentication flow with Supabase Auth

  What's NOT Working:
  - ❌ Adaptive learning - Code detects user confusion but never adapts AI behavior
  - ❌ Two competing practice pages - Main /practice (no adaptation) vs /adaptive-practice (broken)
  - ❌ User adaptations never persist - Database table exists but unused
  - ❌ Static AI personality - Always same taco vendor, no progression

  📍 Project Location

  /Users/rodneyfranklin/Development/personal/SpanishTutor/ClaudeSpanish/spanish-tutor-mvp

  🎯 The Master Vision (3 NPM Packages)

  1. OpenAI Realtime Service (@yourusername/openai-realtime)
    - Status: Working internally, needs extraction
    - Location: /src/services/openai-realtime.ts
  2. Language Learning Pedagogy Service (@yourusername/language-learning-pedagogy)
    - Status: Not started, but research complete
    - Based on CLT, TBLL, Interaction Hypothesis
  3. Spanish Tutor App
    - Status: Working but not adaptive
    - Needs pedagogy integration

  🚧 Current Barriers & Solutions

  Barrier 1: Broken Adaptive System
  - Have: learnerProfile state that updates based on comprehension
  - Missing: Connection to updateInstructions() to actually change AI behavior
  - Solution: Connect the dots in main practice page

  Barrier 2: Competing Implementations
  - /practice - Works but static
  - /adaptive-practice - Sophisticated but broken (type mismatches)
  - Solution: Port adaptive features to main practice page

  Barrier 3: No Learning Persistence
  - Database tables exist but unused
  - No loading of user adaptations on session start
  - Solution: Load/save user adaptations in practice page

  Barrier 4: Missing Pedagogical Intelligence
  - Have detection (detectComprehension)
  - Missing adaptive responses
  - Solution: Implement dynamic prompt updates based on user performance

  📋 Immediate Action Plan

  Phase 1: Make Main Practice Page Adaptive
  1. Load user adaptations from Supabase on mount
  2. Update AI instructions dynamically based on comprehension
  3. Save learning patterns after each session
  4. Add scenario progression (taco → market → directions)

  Phase 2: Implement Pedagogical Features
  1. Smart error tolerance (communication > grammar)
  2. Progressive difficulty adjustment
  3. Cultural context integration
  4. Track mastered concepts vs struggle areas

  Phase 3: Extract & Package
  1. Clean up OpenAI Realtime service for NPM
  2. Build pedagogy service as separate module
  3. Document integration patterns

  🔑 Key Technical Details

  Models in Use:
  - Voice: gpt-4o-realtime-preview-2024-12-17
  - Analysis: gpt-4.1 (for conversation analysis)
  - Transcription: whisper-1 (auto-detect Spanish/English)

  Critical Files:
  - /src/app/practice/page.tsx - Main practice (needs adaptation)
  - /src/services/openai-realtime.ts - Core WebRTC service
  - /src/lib/pedagogical-system.ts - Unused pedagogy logic
  - /src/services/conversation-analysis.ts - Working analysis
  - /CLAUDE.md - Project documentation

  Environment Issues:
  - Next.js 15.1.5 has env loading issues
  - API key temporarily hardcoded in /api/session/route.ts

  🎓 Pedagogical Principles to Implement

  From our research (StudentConversationAnalysis.md):
  1. Transparent Analysis - Never interrupt natural conversation
  2. Communicative Success > Grammar perfection
  3. Task-Based Goals - Real scenarios (ordering, directions)
  4. Progressive Adaptation - Start Spanish, add English if struggling
  5. Cultural Integration - Mexican expressions, customs

  🚀 Next Steps Priority

  1. Fix Adaptive Learning (Current Focus)
    - Connect comprehension detection to instruction updates
    - Load/save user adaptations
    - Implement scenario progression
  2. Build Pedagogy Service
    - Extract analysis logic
    - Add CLT/TBLL analyzers
    - Create feedback generator
  3. Package for NPM
    - Clean APIs
    - Add examples
    - Write documentation

  The app works great for conversations but needs to actually adapt to each learner. We have all the pieces - they just need to be connected properly.

