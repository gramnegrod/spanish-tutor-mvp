# Mexican Spanish Tutor MVP 🌮

An AI-powered conversational Spanish learning app using OpenAI's Realtime API for voice conversations and GPT-4o-mini for analytics.

## Features

- 🎙️ **Real-time voice conversations** with Mexican Spanish AI personas
- 🚀 **<100ms latency** speech-to-speech interaction
- 📊 **Progress tracking** and personalized learning analytics
- 🏆 **Gamification** with streaks and achievements
- 🌐 **Cultural context** teaching (tú vs usted, diminutives, Mexican expressions)

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
│   └── practice/          # Voice conversation interface
├── components/            # React components
│   ├── audio/            # Voice recorder, conversation UI
│   ├── dashboard/        # Progress cards
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and services
│   ├── openai-realtime.ts # WebSocket connection
│   ├── audio-utils.ts    # Audio processing
│   └── openai-analytics.ts # GPT-4o-mini integration
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
