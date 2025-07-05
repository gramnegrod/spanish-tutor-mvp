# Language Learning Database

A universal, framework-agnostic database abstraction for language learning applications.

## 🎯 Overview

This module provides a clean, consistent API for managing language learning data across different storage backends. It's designed to be extracted as an NPM package for use in any language learning application.

## ✨ Features

- **Database Agnostic**: Works with Supabase, Firebase, localStorage, and more
- **Framework Agnostic**: Use with React, Vue, Angular, or vanilla JavaScript
- **TypeScript First**: Full type safety with comprehensive interfaces
- **Guest Mode Support**: LocalStorage adapter for non-authenticated users
- **Rich Analytics**: Built-in learning analytics and progress tracking
- **Modular Design**: Use individual services or the complete package

## 🚀 Quick Start

```typescript
import { LanguageLearningDB } from '@/lib/language-learning-db'

// With Supabase
const db = LanguageLearningDB.createWithSupabase({
  url: 'your-supabase-url',
  apiKey: 'your-anon-key'
})

// With localStorage (guest mode)
const guestDB = LanguageLearningDB.createWithLocalStorage()

// Save a conversation
await db.saveConversation({
  title: 'Taco Ordering Practice',
  transcript: [
    { id: '1', speaker: 'assistant', text: '¡Hola!', timestamp: new Date() },
    { id: '2', speaker: 'user', text: 'Hola, quiero tacos', timestamp: new Date() }
  ],
  duration: 120,
  language: 'es',
  scenario: 'restaurant'
}, user)

// Track progress
await db.progress.addPracticeTime(user.id, 'es', 15)
await db.progress.trackVocabulary(user.id, 'es', ['hola', 'tacos', 'quiero'])
```

## 📋 Core API

### Conversations

```typescript
// Save conversation
const conversation = await db.conversations.save(conversationData, userId)

// Find conversations
const recent = await db.conversations.getRecent(userId, 'es', 5)
const byScenario = await db.conversations.getByScenario(userId, 'restaurant')

// Get statistics
const stats = await db.conversations.getStats(userId, 'es')
```

### Progress Tracking

```typescript
// Initialize progress
await db.progress.initialize(userId, 'es', 'beginner')

// Track vocabulary
await db.progress.trackVocabulary(userId, 'es', ['palabra1', 'palabra2'])

// Update skills
await db.progress.updateSkill(userId, 'es', 'pronunciation', 5)

// Get vocabulary stats
const vocabStats = await db.progress.getVocabularyStats(userId, 'es')
```

### Learner Profiles

```typescript
// Create profile
await db.profiles.create(userId, 'es', {
  level: 'beginner',
  goals: ['travel', 'conversation'],
  preferences: {
    learningStyle: 'visual',
    pace: 'normal',
    supportLevel: 'moderate'
  }
})

// Update preferences
await db.profiles.updatePreferences(userId, 'es', {
  pace: 'fast',
  supportLevel: 'minimal'
})

// Get recommendations
const recommendations = await db.profiles.getRecommendations(userId, 'es')
```

### Analytics

```typescript
// Save learning session
await db.analytics.saveSession({
  userId,
  type: 'conversation',
  duration: 300,
  language: 'es',
  scenario: 'restaurant',
  metricsCollected: {
    averageConfidence: 0.8,
    wordsSpoken: 45,
    mistakeCount: 3
  }
})

// Get analytics
const analytics = await db.analytics.getUserAnalytics(userId, 'es', 'month')
```

## 🔌 Storage Adapters

### Supabase Adapter

```typescript
const db = new LanguageLearningDB({
  database: {
    adapter: 'supabase',
    connection: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  }
})
```

Required Supabase tables:
- `conversations`
- `user_progress` 
- `learner_profiles`
- `learning_sessions`

### LocalStorage Adapter

```typescript
const db = new LanguageLearningDB({
  database: {
    adapter: 'localStorage'
  }
})
```

Perfect for:
- Guest mode functionality
- Offline applications
- Development/testing

### Firebase Adapter (Coming Soon)

```typescript
const db = new LanguageLearningDB({
  database: {
    adapter: 'firebase',
    connection: {
      projectId: 'your-project-id',
      apiKey: 'your-api-key'
    }
  }
})
```

## 🎨 Framework Integration

### React Hook

```typescript
import { useEffect, useState } from 'react'
import { LanguageLearningDB } from '@/lib/language-learning-db'

export function useLanguageLearningDB(user) {
  const [db] = useState(() => 
    user 
      ? LanguageLearningDB.createWithSupabase(supabaseConfig)
      : LanguageLearningDB.createWithLocalStorage()
  )

  return db
}

// Usage in component
function MyComponent() {
  const db = useLanguageLearningDB(user)
  
  const saveConversation = async (data) => {
    await db.saveConversation(data, user)
  }

  return <div>...</div>
}
```

### Vue Composable

```typescript
import { ref } from 'vue'
import { LanguageLearningDB } from '@/lib/language-learning-db'

export function useLanguageLearningDB(user) {
  const db = ref(
    user.value
      ? LanguageLearningDB.createWithSupabase(supabaseConfig)
      : LanguageLearningDB.createWithLocalStorage()
  )

  return { db }
}
```

## 📊 Data Types

### ConversationData

```typescript
interface ConversationData {
  title: string
  persona?: string // AI character name
  transcript: ConversationTranscript[]
  duration: number // seconds
  language: string // ISO code
  scenario?: string // learning scenario
  metadata?: Record<string, any>
}
```

### UserProgress

```typescript
interface UserProgress {
  userId: string
  language: string
  overallLevel: 'beginner' | 'intermediate' | 'advanced'
  totalMinutesPracticed: number
  conversationsCompleted: number
  vocabulary: VocabularyProgress[]
  skills: SkillProgress[]
  streak: number
  achievements: string[]
}
```

### LearnerProfile

```typescript
interface LearnerProfile {
  userId: string
  language: string
  level: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  preferences: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
    pace: 'slow' | 'normal' | 'fast'
    supportLevel: 'minimal' | 'moderate' | 'heavy'
    culturalContext: boolean
  }
  strugglingAreas: string[]
  masteredConcepts: string[]
  commonErrors: string[]
  adaptations: Record<string, any>
}
```

## 🔄 Migration & Export

### Export User Data

```typescript
import { exportData } from '@/lib/language-learning-db'

const userData = await exportData(db, userId, 'es')
// Returns: { conversations, progress, profile, sessions }
```

### Migrate Between Backends

```typescript
import { migrateData } from '@/lib/language-learning-db'

// Migrate from localStorage to Supabase
const guestDB = LanguageLearningDB.createWithLocalStorage()
const supabaseDB = LanguageLearningDB.createWithSupabase(config)

await migrateData(guestDB, supabaseDB, { userId: 'guest' })
```

## 🧪 Testing & Development

### Create Sample Data

```typescript
import { createSampleData } from '@/lib/language-learning-db'

const db = LanguageLearningDB.createInMemory()
await createSampleData(db, 'test-user')
```

### Health Checks

```typescript
const isHealthy = await db.health()
if (!isHealthy) {
  console.error('Database connection failed')
}
```

## 🚀 NPM Package Roadmap

### Phase 1: Core Functionality ✅
- [x] Basic CRUD operations
- [x] Supabase adapter
- [x] LocalStorage adapter
- [x] TypeScript types
- [x] Service architecture

### Phase 2: Enhanced Features
- [ ] Firebase adapter
- [ ] Prisma adapter
- [ ] Real-time sync
- [ ] Offline mode
- [ ] Data validation

### Phase 3: Advanced Analytics
- [ ] Learning insights
- [ ] Performance metrics
- [ ] Recommendation engine
- [ ] A/B testing support

### Phase 4: Enterprise Features
- [ ] Multi-tenant support
- [ ] Custom adapters
- [ ] Advanced security
- [ ] Audit logging

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📞 Support

- Documentation: [Link to docs]
- Issues: [Link to GitHub issues]
- Community: [Link to Discord/Slack]

---

**Built with ❤️ for the language learning community**