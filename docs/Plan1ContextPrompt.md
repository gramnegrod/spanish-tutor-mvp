 I'm continuing work on my Spanish tutor app. Here's the context:

  Current State Summary

  - OpenAI Realtime WebRTC service works perfectly (proven via minimal-test.html)
  - Main app is broken due to mixed NextAuth/Supabase authentication systems
  - Working practice pages available at: /simple-practice and /practice-no-auth
  - API key issues resolved (temporarily hardcoded in /api/session/route.ts)
  - The core voice functionality with the taco vendor personality works great

  Project Location

  /Users/rodneyfranklin/Development/personal/SpanishTutor/ClaudeSpanish/spanish-tutor-mvp

  Key Code Locations

  Working Components:
  - /src/services/openai-realtime.ts - Core WebRTC service for OpenAI Realtime API
  - /src/hooks/useOpenAIRealtime.ts - React hook wrapper
  - /src/app/simple-practice/page.tsx - Simple working practice page
  - /src/app/practice-no-auth/page.tsx - Full UI practice page without auth
  - /public/minimal-test.html - Minimal WebRTC test that proves connection works
  - /api/session/route.ts - Generates ephemeral keys (currently has hardcoded API key)

  Broken Components (need fixing):
  - /src/app/practice/page.tsx - Original practice page (broken due to auth/import issues)
  - /src/types/index.ts - Has Prisma imports but app uses Supabase
  - /api/* routes - Expect NextAuth but app uses Supabase Auth
  - Database calls mix Prisma and Supabase approaches

  The Master Plan

  We're building three things:

  1. Fix Spanish Tutor App (4 phases)

  - Phase 1: ✅ DONE - Created working practice pages
  - Phase 2: Fix critical imports and dependencies
  - Phase 3: Complete Supabase migration (remove all NextAuth/Prisma)
  - Phase 4: Enable full features (conversation saving, progress tracking)

  2. OpenAI Realtime NPM Module

  - Phase 1: ✅ Internal library (current)
  - Phase 2: Battle testing through Spanish tutor usage
  - Phase 3: Refine API based on learnings
  - Phase 4: Extract and publish as npm package

  3. Language Learning Pedagogy Module (NEW)

  - Implements CLT (Communicative Language Teaching)
  - Implements TBLL (Task-Based Language Learning)
  - Implements Interaction/Output Hypothesis
  - Smart error tolerance (communication > grammar)
  - Will become second npm package

  Critical Technical Learnings

  1. WebRTC approach works for OpenAI Realtime (WebSocket approach fails)
  2. Next.js 15.1.5 has environment variable loading issues in API routes
  3. ICE servers needed for WebRTC connection stability
  4. React StrictMode can cause duplicate connections
  5. Singleton pattern prevents multiple service instances

  Important Context

  The CLAUDE.md file in the project root contains:
  - Full debugging history
  - Detailed architectural decisions
  - Model information (gpt-4o-realtime-preview-2024-12-17, gpt-4.1)
  - Migration plans
  - Recent debug session notes from 2025-01-31

  Current Task

  Ready to implement Phase 2: Fix critical imports so the main practice page can load. The working practice pages are functioning well, so there's no rush - we
  can fix the architecture properly.

  The app uses Supabase for auth (working) but has leftover NextAuth/Prisma code that needs removal.