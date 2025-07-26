# Spanish Tutor MVP - Development Notes

## Phase 2 Completion: Component Consolidation (2025-01-31)

### What We Built

Created a modular practice architecture that reduces code duplication by 77% and makes new scenarios trivial to create.

#### New Shared Hooks
1. **`useTranscriptManager`** - Manages conversation transcripts, current speaker, and timing
2. **`usePracticeSession`** - Unified session management combining all practice functionality

#### New Shared Components
1. **`PracticeLayout`** - Consistent page structure with header and vocabulary guide
2. **`ConversationSession`** - Complete conversation UI with stats and cost display
3. **`SpanishAnalyticsDashboard`** - Unified analytics dashboard showing vocabulary progress
4. **`SessionCostDisplay`** - Reusable cost display component
5. **`SessionModals`** - Time warning and session management modals

#### Configuration
- **`openai-presets.ts`** - Standard voice configurations for Spanish/English/Multilingual

### Creating New Practice Scenarios

#### Quick Start (5 minutes)
```typescript
// src/app/practice-[scenario]/page.tsx
const SCENARIO = 'restaurant'  // Must match spanish-analysis module
const NPC_NAME = 'Carlos'
const NPC_DESCRIPTION = 'professional waiter at upscale restaurant'

export default function PracticeRestaurantPage() {
  const session = usePracticeSession({
    scenario: SCENARIO,
    npcName: NPC_NAME,
    npcDescription: NPC_DESCRIPTION,
    enableAuth: true,     // Require login?
    enableAdaptation: true, // AI adapts to user level?
    enableAnalysis: true,   // Track Spanish progress?
  })
  
  return (
    <PracticeLayout title="Restaurant Practice" {...props}>
      <SpanishAnalyticsDashboard {...session} />
      <div className="grid md:grid-cols-2 gap-6">
        <ConversationSession {...session} />
        <VoiceControl {...session} />
      </div>
      <SessionModals {...session} />
    </PracticeLayout>
  )
}
```

#### Available Scenarios
- `taco_vendor` - Street food ordering
- `restaurant` - Restaurant dining  
- `hotel_checkin` - Hotel registration
- `taxi_ride` - Transportation
- `market` - Shopping at markets
- `mexico_city_adventure` - Tourist scenarios

### Architecture Benefits
- **77% Less Code**: 660 lines → 150 lines per page
- **Consistent UX**: All pages share polished interface
- **Feature Parity**: Every scenario gets full analytics
- **Easy Testing**: Modular components
- **NPM Ready**: Designed for extraction

### Key Decisions
1. **Unified Hook**: Single `usePracticeSession` manages everything
2. **Composition**: Small focused components that work together
3. **Configuration Over Code**: Change constants, not logic
4. **Progressive Enhancement**: Start simple, add features as needed

---

## Phase 1 Cleanup Summary (2025-01-31)

### What Was Fixed
1. **Removed 23 test/debug pages** cluttering production
2. **Fixed security vulnerabilities** in error handling
3. **Created singleton Supabase client** (no more duplicate warnings)
4. **Fixed duplicate React keys** in transcript display
5. **Created SQL scripts** for database schema fixes

### Key Files Created
- `/src/lib/api-utils.ts` - Safe error handling
- `/src/lib/supabase-client.ts` - Singleton client pattern
- `/src/components/ErrorBoundary.tsx` - React error boundary
- `fix-database-issues.sql` - Add missing columns
- `cleanup-duplicate-profiles.sql` - Remove duplicates

### Remaining SQL Scripts to Run
```sql
-- Run these in Supabase SQL Editor:
-- 1. fix-database-issues.sql
-- 2. cleanup-duplicate-profiles.sql
```

---

## Module Extraction Roadmap

### Current NPM-Ready Modules
1. **Spanish Analysis Module** (80% complete)
   - Location: `src/lib/spanish-analysis/`
   - Mexican vocabulary database
   - Cultural authenticity detection
   
2. **OpenAI WebRTC Module** (90% complete)
   - Location: `src/services/openai-realtime/`
   - Real-time speech-to-speech
   
3. **Language Learning DB** (95% complete)
   - Location: `src/lib/language-learning-db/`
   - Universal storage API

### Future Extraction Opportunities
1. **Session Management Module** - Extract from practice pages
2. **Assessment Module** - Build for quizzes/tests
3. **Media Learning Module** - For video features
4. **NPC Personality Module** - AI character system

---

## Common Issues & Solutions

### Database Errors
- **"Could not find the 'language' column"** → Run fix-database-issues.sql
- **"Multiple rows returned"** → Run cleanup-duplicate-profiles.sql
- **"Row-level security policy"** → Check auth status

### React Warnings
- **Duplicate keys** → Use timestamp + random string for IDs
- **Too many renders** → Check hook dependencies
- **Memory leaks** → Cleanup in useEffect returns

### OpenAI Realtime
- **No audio** → Check autoPlay attribute on audio element
- **Connection drops** → Implement reconnection logic
- **High costs** → Monitor session duration, implement warnings

---

## Testing Checklist for New Scenarios

1. **Voice Connection**
   - [ ] Connect button works
   - [ ] Audio plays back
   - [ ] Transcripts appear
   
2. **Spanish Analysis**
   - [ ] Vocabulary tracks correctly
   - [ ] Mexican expressions detected
   - [ ] Progress bar updates
   
3. **Session Management**
   - [ ] End & Analyze works
   - [ ] Summary shows correct data
   - [ ] Data saves to database
   
4. **Edge Cases**
   - [ ] Guest mode works (if enabled)
   - [ ] Auth redirect works
   - [ ] Error handling graceful

---

## Performance Optimizations

### Current
- Singleton Supabase client
- Memoized database connections
- Lazy-loaded components

### Planned
- Route-based code splitting
- Audio preprocessing
- Transcript virtualization
- Analytics batching

---

## Links & Resources

- [OpenAI Realtime Docs](https://platform.openai.com/docs/guides/realtime)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Spanish Analysis Module README](src/lib/spanish-analysis/README.md)