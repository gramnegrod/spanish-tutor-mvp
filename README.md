# Mexican Spanish Tutor MVP 🌮

An AI-powered conversational Spanish learning app using OpenAI's Realtime API for voice conversations and GPT-4o-mini for analytics.

## 🚀 Recent Architecture Improvements

- **Simplified Hook Architecture**: Reduced from 5 layers to 3 layers (40% reduction)
- **Performance Optimized**: Reduced re-renders from 8-10 to 2-3 per interaction
- **Modular Services**: OpenAI integration refactored into reusable service modules
- **77% Less Code**: New practice pages require only ~50 lines of code
- **Built-in Performance Monitoring**: Real-time performance tracking and analysis

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architectural documentation.

## Features

- 🎙️ **Real-time voice conversations** with Mexican Spanish AI personas
- 🚀 **<100ms latency** speech-to-speech interaction
- 📊 **Progress tracking** and personalized learning analytics
- 🏆 **Gamification** with streaks and achievements
- 🌐 **Cultural context** teaching (tú vs usted, diminutives, Mexican expressions)
- 📱 **Responsive design** with mobile-first approach
- 🔍 **Performance monitoring** with built-in diagnostics dashboard

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Prisma ORM, PostgreSQL
- **AI**: OpenAI Realtime API (voice), GPT-4o-mini (analytics)
- **Auth**: NextAuth.js with credentials provider
- **Audio**: Web Audio API with PCM16 conversion

## Prerequisites

- Node.js 18+
- PostgreSQL (or use Docker Compose)
- OpenAI API key with Realtime API access

## Setup Instructions

### 1. Clone and Install

```bash
git clone [repository-url]
cd spanish-tutor-mvp
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Database
DATABASE_URL="postgresql://spanish_tutor_user:spanish_tutor_pass@localhost:5432/spanish_tutor?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OpenAI
OPENAI_API_KEY="sk-..."
```

### 3. Database Setup

Using Docker:
```bash
docker-compose up -d
```

Or use your own PostgreSQL instance and update DATABASE_URL.

### 4. Initialize Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   └── practice*/         # Various practice pages
├── components/            # React components
│   ├── audio/            # Voice recorder, conversation UI
│   ├── dashboard/        # Progress cards
│   ├── practice/         # Reusable practice components
│   │   ├── ConversationSession.tsx
│   │   ├── PracticeLayout.tsx
│   │   ├── SessionModals.tsx
│   │   ├── SpanishAnalyticsDashboard.tsx
│   │   └── VoiceControl.tsx
│   ├── spanish-analysis/ # Spanish learning components
│   └── ui/               # Reusable UI components
├── config/               # Configuration files
│   ├── learning-scenarios.ts
│   └── openai-presets.ts
├── hooks/                # Custom React hooks
│   ├── useOpenAIRealtime.ts
│   ├── useConversationEngine.ts
│   ├── usePracticeSession.ts    # NEW: Unified practice hook
│   └── useTranscriptManager.ts  # NEW: Transcript management
├── lib/                  # Utilities and services
│   ├── language-learning-db/  # Database abstraction
│   ├── spanish-analysis/      # Spanish analysis module
│   └── pedagogical-system.ts  # Adaptive learning
└── types/                # TypeScript definitions
```

## Key Components

### Voice Recording Flow

1. User clicks record button → `VoiceRecorder` component
2. Audio captured via MediaRecorder API
3. Converted to PCM16 format (24kHz, mono)
4. Streamed to OpenAI Realtime API via WebSocket
5. Response audio played back in real-time

### Conversation Analysis

1. Session ends → transcript saved to database
2. GPT-4o-mini analyzes conversation
3. Extracts pronunciation notes, grammar successes, cultural appropriateness
4. Updates user progress and suggests next lessons

## API Endpoints

- `POST /api/auth/[...nextauth]` - Authentication
- `POST /api/register` - User registration
- `GET/POST /api/conversations` - Conversation CRUD
- `POST /api/analyze` - Analyze conversation with GPT-4o-mini
- `GET/POST /api/progress` - User progress tracking

## Deployment

### Vercel (Recommended for Frontend)

```bash
vercel --prod
```

### Railway/Render (Backend + Database)

1. Connect GitHub repository
2. Set environment variables
3. Deploy with `npm run build && npm start`

## Security Considerations

- API keys stored in environment variables
- NextAuth for session management
- Prisma with parameterized queries
- Rate limiting on API endpoints
- Audio data cleaned up after processing

## Creating New Practice Scenarios (Phase 2 Architecture)

### Quick Start: New Scenario in 5 Minutes

With our new modular architecture, creating a new practice scenario is incredibly simple:

```typescript
// src/app/practice-restaurant/page.tsx
'use client'

import React from 'react'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { PracticeLayout } from '@/components/practice/PracticeLayout'
import { SpanishAnalyticsDashboard } from '@/components/practice/SpanishAnalyticsDashboard'
import { ConversationSession } from '@/components/practice/ConversationSession'
import { VoiceControl } from '@/components/practice/VoiceControl'
import { SessionModals } from '@/components/practice/SessionModals'
import { SessionSummaryWithAnalysis } from '@/components/spanish-analysis/SessionSummaryWithAnalysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Just change these constants!
const SCENARIO = 'restaurant'  // Must match a scenario in spanish-analysis module
const NPC_NAME = 'Carlos'
const NPC_DESCRIPTION = 'professional waiter at an upscale Mexico City restaurant'

export default function PracticeRestaurantPage() {
  const session = usePracticeSession({
    scenario: SCENARIO,
    npcName: NPC_NAME,
    npcDescription: NPC_DESCRIPTION,
    enableAuth: true,     // Require login?
    enableAdaptation: true, // AI adapts to user level?
    enableAnalysis: true,   // Track Spanish progress?
    autoConnect: false      // Auto-start voice on load?
  })
  
  return (
    <PracticeLayout
      title="Restaurant Practice"
      npcName={NPC_NAME}
      subtitle="Order dinner at a fine dining restaurant"
      scenario={SCENARIO}
      vocabularyWordsUsed={session.getFullSpanishAnalysis()?.wordsUsed?.map(w => w.word) || []}
    >
      <audio ref={session.audioRef} autoPlay hidden />
      
      <SpanishAnalyticsDashboard
        scenario={SCENARIO}
        analysis={session.getFullSpanishAnalysis()}
        sessionStats={session.sessionStats}
        lastFeedback={session.lastComprehensionFeedback}
      />
      
      <div className="grid md:grid-cols-2 gap-6">
        <ConversationSession {...session} />
        <VoiceControl {...session} />
      </div>
      
      <SessionModals {...session} />
      
      {session.showSummary && (
        <SessionSummaryWithAnalysis {...session} />
      )}
    </PracticeLayout>
  )
}
```

That's it! A fully functional practice page with voice, analytics, and adaptation in ~50 lines.

### Architecture Benefits

1. **77% Less Code**: Refactored pages went from ~660 lines to ~150 lines
2. **Consistent UX**: All practice pages share the same polished interface
3. **Feature Parity**: Every scenario gets analytics, adaptation, and progress tracking
4. **Easy Testing**: Modular components can be tested in isolation
5. **NPM Ready**: Core modules designed for future extraction

### Available Scenarios

Current scenarios with Spanish analysis support:
- `taco_vendor` - Street food ordering
- `restaurant` - Restaurant dining  
- `hotel_checkin` - Hotel registration
- `taxi_ride` - Transportation
- `market` - Shopping at markets
- `mexico_city_adventure` - Tourist scenarios

### Customization Options

#### 1. Basic Configuration
```typescript
usePracticeSession({
  scenario: 'market',
  npcName: 'Doña María',
  npcDescription: 'friendly vendor at Mercado de Medellín',
  enableAuth: false,        // Guest mode
  enableAdaptation: true,   // AI adapts difficulty
  enableAnalysis: true,     // Spanish tracking
  autoConnect: true,        // Start immediately
  initialProfile: {         // Override defaults
    level: 'intermediate',
    comfortWithSlang: true
  }
})
```

#### 2. Custom AI Instructions
```typescript
// Override the AI personality completely
const generateInstructions = (profile: LearnerProfile) => {
  return `You are a strict Spanish teacher who corrects every mistake...`
}

const session = usePracticeSession({
  // ... other config
  customInstructions: generateInstructions
})
```

#### 3. Layout Variations
```typescript
// Minimal layout without vocabulary guide
<PracticeLayout
  title="Quick Practice"
  showVocabularyGuide={false}
>
  {/* your content */}
</PracticeLayout>

// Custom analytics dashboard
<SpanishAnalyticsDashboard
  className="bg-blue-50"  // Custom styling
  hideExpressions={true}  // Hide Mexican expressions
/>
```

### Module Architecture

The practice system is built on these core modules:

1. **usePracticeSession Hook**
   - Manages all state and logic
   - Handles auth, transcripts, analytics
   - Integrates with Language Learning DB

2. **PracticeLayout Component**
   - Consistent page structure
   - Header (auth/guest)
   - Vocabulary guide
   - Responsive design

3. **ConversationSession Component** 
   - Transcript display
   - Cost tracking
   - Action buttons
   - Session stats

4. **SpanishAnalyticsDashboard Component**
   - Vocabulary progress
   - Mexican expressions
   - Real-time feedback
   - Session metrics

5. **VoiceControl Component**
   - Microphone UI
   - Connection status
   - Speaking indicators
   - Adaptation feedback

### Advanced Features

#### Multi-Scenario Adventures
```typescript
// Create branching scenarios
const SCENARIOS = ['taxi_pickup', 'taxi_ride', 'taxi_payment']
const [currentScenario, setCurrentScenario] = useState(0)

const session = usePracticeSession({
  scenario: SCENARIOS[currentScenario],
  onScenarioComplete: () => setCurrentScenario(prev => prev + 1)
})
```

#### Custom Analytics
```typescript
// Add your own metrics
const customMetrics = {
  politenessScore: analyzePoliteness(session.transcripts),
  culturalAccuracy: checkCulturalNorms(session.transcripts)
}
```

#### Voice Presets
```typescript
import { SPANISH_VOICE_PRESET, MULTILINGUAL_VOICE_PRESET } from '@/config/openai-presets'

// Use predefined voice configurations
const session = usePracticeSession({
  voiceConfig: MULTILINGUAL_VOICE_PRESET, // Auto-detect language
  // or
  voiceConfig: {
    ...SPANISH_VOICE_PRESET,
    voice: 'nova' // Different voice
  }
})
```

## Future Enhancements

- [ ] Additional personas (Professional, Teenager, Grandmother)
- [ ] More learning scenarios
- [ ] Mobile app with React Native
- [ ] Group conversation practice
- [ ] Offline mode with cached lessons

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- OpenAI for Realtime API
- Mexican Spanish language consultants
- Shadcn/ui for component inspiration
