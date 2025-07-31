# Developer Guide - Spanish Tutor MVP

This guide provides comprehensive information for developers working on the Spanish Tutor application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Architecture Overview](#architecture-overview)
4. [Common Development Tasks](#common-development-tasks)
5. [Testing Strategy](#testing-strategy)
6. [Performance Guidelines](#performance-guidelines)
7. [Code Style & Best Practices](#code-style--best-practices)
8. [Debugging Tips](#debugging-tips)

## Getting Started

### Prerequisites

- Node.js 18+ (check with `node --version`)
- npm 8+ (check with `npm --version`)
- PostgreSQL 14+ or Docker
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

### Initial Setup

1. **Clone and install:**
```bash
git clone [repository-url]
cd spanish-tutor-mvp
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. **Database setup:**
```bash
# Using Docker (recommended)
docker-compose up -d

# Or use existing PostgreSQL
# Update DATABASE_URL in .env.local
```

4. **Initialize database:**
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed  # Optional: add sample data
```

5. **Start development:**
```bash
npm run dev
# Open http://localhost:3000
```

### VS Code Configuration

Create `.vscode/settings.json`:
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Development Workflow

### Branch Strategy

```bash
main
├── develop
│   ├── feature/add-french-module
│   ├── bugfix/fix-audio-delay
│   └── perf/optimize-rerenders
```

### Typical Workflow

1. **Create feature branch:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

2. **Make changes:**
```bash
# Code your feature
npm run dev  # Test locally
npm run type-check  # Check TypeScript
npm test  # Run tests
```

3. **Commit with conventional commits:**
```bash
git add .
git commit -m "feat: add restaurant scenario"
# or
git commit -m "fix: resolve audio sync issue"
# or
git commit -m "perf: optimize Spanish analysis"
```

4. **Push and create PR:**
```bash
git push -u origin feature/your-feature-name
# Create PR on GitHub
```

### Pre-commit Checks

The project uses husky for pre-commit hooks:
- TypeScript checking
- ESLint validation
- Prettier formatting
- Unit test execution

## Architecture Overview

### 3-Layer Architecture

```
┌─────────────────────────────────┐
│      Page Components            │  Layer 1: UI
├─────────────────────────────────┤
│      usePracticeSession         │  Layer 2: Orchestration
├─────────────────────────────────┤
│  useConversationState           │  Layer 3: Core Logic
│  + OpenAIRealtimeService        │
└─────────────────────────────────┘
```

### Key Directories

```
src/
├── app/              # Next.js pages and API routes
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Core business logic
├── services/        # External service integrations
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

### Data Flow

```
User Action → Hook → Service → State Update → UI Re-render
     ↓                             ↓
  Storage ← ← ← ← ← ← ← Analysis
```

## Common Development Tasks

### Creating a New Practice Scenario

1. **Create the page component:**
```typescript
// src/app/practice-[scenario]/page.tsx
'use client'

import { usePracticeSession } from '@/hooks/usePracticeSession'
import { PracticeLayout } from '@/components/practice/PracticeLayout'
// ... other imports

export default function Practice[Scenario]Page() {
  const session = usePracticeSession({
    scenario: 'your_scenario',
    npcName: 'Character Name',
    npcDescription: 'character description',
    enableAuth: true,
    enableAdaptation: true,
    enableAnalysis: true
  })
  
  return (
    <PracticeLayout
      title="Scenario Practice"
      npcName={session.npcName}
      scenario={session.scenario}
    >
      <audio ref={session.audioRef} autoPlay hidden />
      <SpanishAnalyticsDashboard {...session} />
      <ConversationSession {...session} />
      <VoiceControl {...session} />
      <SessionModals {...session} />
    </PracticeLayout>
  )
}
```

2. **Add vocabulary data:**
```typescript
// src/lib/spanish-analysis/mexican-vocabulary.ts
export const scenarioVocabulary = {
  // ... existing scenarios
  your_scenario: {
    essential: ['word1', 'word2'],
    common: ['phrase1', 'phrase2'],
    expressions: ['expression1']
  }
}
```

3. **Add to navigation:**
```typescript
// src/components/navigation/ScenarioList.tsx
const scenarios = [
  // ... existing
  { id: 'your_scenario', name: 'Your Scenario', icon: '🎯' }
]
```

### Adding a New Hook

1. **Create hook file:**
```typescript
// src/hooks/useYourHook.ts
import { useState, useCallback, useEffect } from 'react'

export interface UseYourHookOptions {
  // Define options
}

export interface UseYourHookReturn {
  // Define return type
}

export function useYourHook(options: UseYourHookOptions): UseYourHookReturn {
  // Add performance monitoring
  const performanceMonitor = usePerformanceMonitor({
    componentName: 'useYourHook',
    enableConsoleLogging: true
  })
  
  // Hook implementation
  
  return {
    // Return values
  }
}
```

2. **Add tests:**
```typescript
// src/hooks/__tests__/useYourHook.test.tsx
import { renderHook, act } from '@testing-library/react'
import { useYourHook } from '../useYourHook'

describe('useYourHook', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useYourHook({}))
    expect(result.current).toBeDefined()
  })
  
  // More tests...
})
```

### Implementing a New Component

1. **Create component:**
```typescript
// src/components/category/YourComponent.tsx
import React from 'react'
import { cn } from '@/lib/utils'

export interface YourComponentProps {
  className?: string
  // Other props
}

export function YourComponent({ className, ...props }: YourComponentProps) {
  return (
    <div className={cn('your-default-styles', className)}>
      {/* Component content */}
    </div>
  )
}
```

2. **Add story (optional):**
```typescript
// src/components/category/YourComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { YourComponent } from './YourComponent'

const meta: Meta<typeof YourComponent> = {
  title: 'Category/YourComponent',
  component: YourComponent,
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // Default props
  }
}
```

### Adding Spanish Analysis Features

1. **Extend vocabulary:**
```typescript
// src/lib/spanish-analysis/types.ts
export interface ExtendedAnalysis {
  // Add new analysis types
  culturalContext?: string[]
  registerAnalysis?: 'formal' | 'informal' | 'neutral'
}
```

2. **Implement analyzer:**
```typescript
// src/lib/spanish-analysis/extended-analyzer.ts
export function analyzeRegister(text: string): 'formal' | 'informal' | 'neutral' {
  // Implementation
}
```

3. **Integrate with hook:**
```typescript
// Update useConversationState to include new analysis
```

## Testing Strategy

### Test Types

1. **Unit Tests** - Individual functions and hooks
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Full user flows (Playwright)
4. **Performance Tests** - Render and operation timing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific file
npm test -- useConversationState.test.ts

# E2E tests
npm run test:e2e
```

### Writing Good Tests

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  })
  
  // Group related tests
  describe('when user is authenticated', () => {
    it('should display user profile', () => {
      // Arrange
      const user = { name: 'Test User' }
      
      // Act
      const { getByText } = render(<Component user={user} />)
      
      // Assert
      expect(getByText('Test User')).toBeInTheDocument()
    })
  })
  
  // Test edge cases
  it('should handle empty state gracefully', () => {
    // Test implementation
  })
})
```

## Performance Guidelines

### React Optimization

1. **Use React.memo for pure components:**
```typescript
export const PureComponent = React.memo(({ prop1, prop2 }) => {
  return <div>{/* content */}</div>
})
```

2. **Memoize expensive computations:**
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(input)
}, [input])
```

3. **Use callbacks for stable references:**
```typescript
const handleClick = useCallback(() => {
  // Handle click
}, [dependency])
```

### State Management

1. **Batch state updates:**
```typescript
// React 18 automatically batches these
setState1(value1)
setState2(value2)
setState3(value3)
```

2. **Use functional updates:**
```typescript
setState(prev => ({ ...prev, newValue }))
```

3. **Avoid unnecessary state:**
```typescript
// Derive from existing state instead
const isComplete = todos.every(todo => todo.done)
// Not: const [isComplete, setIsComplete] = useState(false)
```

### Bundle Optimization

1. **Use dynamic imports:**
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />
})
```

2. **Optimize images:**
```typescript
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={400}
  height={300}
  loading="lazy"
/>
```

## Code Style & Best Practices

### TypeScript

1. **Prefer interfaces over types for objects:**
```typescript
// Good
interface UserProfile {
  id: string
  name: string
}

// Use type for unions/intersections
type Status = 'idle' | 'loading' | 'error'
```

2. **Use strict typing:**
```typescript
// Avoid 'any'
function process(data: unknown) {
  // Type guard
  if (isUserProfile(data)) {
    // Now typed as UserProfile
  }
}
```

3. **Export types separately:**
```typescript
// types.ts
export interface Config { }
export type Status = 'active' | 'inactive'

// component.tsx
import type { Config, Status } from './types'
```

### React Patterns

1. **Custom hooks for logic:**
```typescript
// Extract complex logic to hooks
function useUserData(userId: string) {
  const [data, setData] = useState()
  const [loading, setLoading] = useState(true)
  
  // Logic here
  
  return { data, loading }
}
```

2. **Composition over inheritance:**
```typescript
// Use composition
function Layout({ header, children, footer }) {
  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
    </>
  )
}
```

3. **Error boundaries:**
```typescript
// Wrap features in error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <FeatureComponent />
</ErrorBoundary>
```

### File Organization

```typescript
// component-folder/
// ├── index.ts           (exports)
// ├── Component.tsx      (main component)
// ├── Component.test.tsx (tests)
// ├── Component.stories.tsx (storybook)
// ├── types.ts          (local types)
// └── utils.ts          (local utilities)
```

## Debugging Tips

### Console Debugging

```typescript
// Structured logging
console.group('Component: UserProfile')
console.log('Props:', props)
console.log('State:', state)
console.groupEnd()

// Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

### React DevTools

1. **Search components:** Use the search bar to find components quickly
2. **Inspect props:** Click components to see current props/state
3. **Track updates:** Enable "Highlight updates" to see re-renders
4. **Profiler:** Record interactions to find performance issues

### Network Debugging

```typescript
// Log API calls
const response = await fetch(url, {
  ...options,
  headers: {
    ...options.headers,
    'X-Debug-Request-Id': crypto.randomUUID()
  }
})

console.log(`API Call [${response.headers.get('X-Debug-Request-Id')}]:`, {
  url,
  status: response.status,
  timing: performance.now() - startTime
})
```

### Performance Debugging

```typescript
// Use Performance Dashboard
// Available at the bottom-right in development

// Or manual timing
console.time('expensive-operation')
await expensiveOperation()
console.timeEnd('expensive-operation')

// Memory profiling
if ('memory' in performance) {
  console.log('Memory:', performance.memory)
}
```

### Common Issues

1. **Infinite loops:**
   - Check useEffect dependencies
   - Look for setState in render

2. **Memory leaks:**
   - Clean up timeouts/intervals
   - Remove event listeners
   - Cancel async operations

3. **Stale closures:**
   - Use refs for latest values
   - Check dependency arrays

## Resources

### Internal Documentation

- [Architecture Guide](../../ARCHITECTURE.md)
- [Performance Guide](../../PERFORMANCE_MONITORING_GUIDE.md)
- [Migration Guide](../../MIGRATION_GUIDE.md)
- [Troubleshooting](../../TROUBLESHOOTING.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Getting Help

1. Check existing documentation
2. Search closed issues on GitHub
3. Ask in team chat with:
   - Clear problem description
   - What you've tried
   - Relevant code snippets
   - Error messages

Remember: Good documentation and clean code help everyone on the team!