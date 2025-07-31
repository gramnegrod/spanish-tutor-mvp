# useConversationState Hook Documentation

## Overview

The `useConversationState` hook is a unified state management solution that combines transcript management and conversation analysis functionality. This hook represents a major architectural improvement, consolidating what was previously spread across multiple hooks into a single, performant solution.

## Purpose

This hook serves as the central state manager for all conversation-related data in the Spanish Tutor application, handling:
- Transcript storage and management
- Real-time Spanish language analysis
- Session statistics tracking
- Performance feedback generation
- Learner profile updates

## Architecture Benefits

### Before (5 separate hooks)
```
useTranscriptManager → useConversationEngine → useSpanishAnalysis → useSessionStats → useFeedback
```

### After (1 unified hook)
```
useConversationState (handles all conversation state and analysis)
```

## API Reference

### Hook Signature

```typescript
function useConversationState(options: ConversationStateOptions): UseConversationStateReturn
```

### Options

```typescript
interface ConversationStateOptions {
  learnerProfile: LearnerProfile;           // Current learner's profile
  onProfileUpdate: (profile: LearnerProfile) => void;  // Profile update callback
  onSaveProfile?: (profile: LearnerProfile) => Promise<void>;  // Optional save callback
  scenario?: string;                        // Learning scenario (default: 'taco_vendor')
}
```

### Return Value

```typescript
interface UseConversationStateReturn {
  // State
  transcripts: ConversationTranscript[];    // Array of conversation transcripts
  currentSpeaker: string | null;            // Currently speaking ('user' | 'assistant' | null)
  conversationStartTime: Date | null;       // When conversation began
  sessionStats: SessionStats;               // Session performance metrics
  lastComprehensionFeedback: ComprehensionFeedback | null;  // Latest feedback
  conversationHistory: ConversationTurn[];  // Structured conversation for analysis
  currentSpanishAnalysis: SpanishConversationAnalysis | null;  // Current analysis
  
  // Methods
  addTranscript: (role: 'user' | 'assistant', text: string) => Promise<void>;
  clearConversation: () => void;
  setCurrentSpeaker: (speaker: string | null) => void;
  getFullSpanishAnalysis: () => SpanishConversationAnalysis | null;
  getDatabaseAnalysis: () => any;
  
  // Utilities
  spanishAnalyzer: any;  // Spanish analyzer instance
}
```

## Usage Examples

### Basic Usage

```typescript
import { useConversationState } from '@/hooks/useConversationState';

function ConversationComponent() {
  const [learnerProfile, setLearnerProfile] = useState(defaultProfile);
  
  const conversation = useConversationState({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    scenario: 'restaurant'
  });
  
  // Add a transcript
  const handleUserSpeech = async (text: string) => {
    await conversation.addTranscript('user', text);
  };
  
  // Display transcripts
  return (
    <div>
      {conversation.transcripts.map(transcript => (
        <div key={transcript.id}>
          <span>{transcript.speaker}: {transcript.text}</span>
        </div>
      ))}
    </div>
  );
}
```

### With Performance Monitoring

```typescript
function PerformantConversation() {
  const conversation = useConversationState({
    learnerProfile,
    onProfileUpdate: updateProfile,
    onSaveProfile: async (profile) => {
      // Save to database
      await saveProfileToDatabase(profile);
    }
  });
  
  // Access performance metrics
  console.log('Session Stats:', conversation.sessionStats);
  console.log('Spanish Words Used:', conversation.sessionStats.spanishWordsUsed);
  console.log('Improvement Trend:', conversation.sessionStats.improvementTrend);
}
```

### Advanced Spanish Analysis

```typescript
function SpanishAnalysisComponent() {
  const conversation = useConversationState({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    scenario: 'market'
  });
  
  // Get comprehensive analysis
  const analysis = conversation.getFullSpanishAnalysis();
  
  if (analysis) {
    console.log('Vocabulary Coverage:', analysis.vocabularyCoverage);
    console.log('Mexican Expressions:', analysis.mexicanExpressions);
    console.log('Grammar Patterns:', analysis.grammarPatterns);
  }
  
  // Get database-ready analysis
  const dbAnalysis = conversation.getDatabaseAnalysis();
  // Save to database...
}
```

## Key Features

### 1. Automatic Spanish Analysis

The hook automatically analyzes Spanish content in real-time:

```typescript
// When user speaks
await conversation.addTranscript('user', 'Quiero dos tacos por favor');

// Automatically generates:
// - Spanish word detection
// - Mexican expression identification
// - Grammar pattern analysis
// - Comprehension scoring
// - Real-time feedback
```

### 2. Performance Optimization

Built-in performance monitoring tracks expensive operations:

```typescript
// Internally tracked operations:
// - spanishAnalysis: ~20-50ms
// - essentialVocabCheck: ~10-30ms
// - sessionStatsUpdate: ~5-10ms
// - fullSpanishAnalysis: ~30-80ms
```

### 3. Session Statistics

Comprehensive metrics updated in real-time:

```typescript
interface SessionStats {
  totalResponses: number;
  goodResponses: number;
  strugglingResponses: number;
  averageConfidence: number;
  improvementTrend: 'improving' | 'declining' | 'neutral';
  streakCount: number;
  lastFewConfidences: number[];
  // Spanish-specific stats
  spanishWordsUsed: number;
  mexicanExpressionsUsed: number;
  essentialVocabCoverage: number;
  grammarAccuracy: number;
}
```

### 4. Comprehension Feedback

Real-time feedback with cultural context:

```typescript
interface ComprehensionFeedback {
  level: 'excellent' | 'good' | 'struggling' | 'confused';
  message: string;
  confidence: number;
  timestamp: Date;
  spanishWords?: string[];
  mexicanExpressions?: string[];
  culturalNotes?: string[];
}
```

## Implementation Details

### State Management

The hook uses React's built-in state management with careful optimization:

```typescript
// Batched state updates for performance
const addTranscript = useCallback(async (role, text) => {
  // All related state updates happen together
  // React 18 automatically batches these updates
  setTranscripts(prev => [...prev, newTranscript]);
  setSessionStats(prev => calculateNewStats(prev));
  setLastComprehensionFeedback(generateFeedback());
}, [dependencies]);
```

### Memoization Strategy

Expensive computations are memoized:

```typescript
// Spanish analyzer creation (expensive)
const spanishAnalyzer = useMemo(() => 
  createAnalyzerFromProfile(learnerProfile, scenario), 
  [learnerProfile, scenario]
);

// Full analysis computation (expensive)
const getFullSpanishAnalysis = useCallback(() => {
  if (conversationHistory.length === 0) return null;
  return spanishAnalyzer.analyzeConversation(conversationHistory, context);
}, [conversationHistory, spanishAnalyzer]);
```

### Performance Monitoring

The hook includes built-in performance tracking:

```typescript
const performanceMonitor = usePerformanceMonitor({
  componentName: 'useConversationState',
  enableConsoleLogging: true,
  logThreshold: 20,
  trackMemory: true
});

// Tracks operations like:
performanceMonitor.trackOperation('processTranscript', () => {
  // Processing logic
});
```

## Best Practices

### 1. Profile Management

Always provide both update and save callbacks:

```typescript
const conversation = useConversationState({
  learnerProfile,
  onProfileUpdate: setLearnerProfile,  // Local state update
  onSaveProfile: saveToDatabase        // Persistent storage
});
```

### 2. Scenario Selection

Choose appropriate scenarios for context:

```typescript
// Available scenarios:
// 'taco_vendor', 'restaurant', 'hotel_checkin', 
// 'taxi_ride', 'market', 'mexico_city_adventure'

const conversation = useConversationState({
  learnerProfile,
  onProfileUpdate: setLearnerProfile,
  scenario: 'restaurant'  // Provides context-appropriate vocabulary
});
```

### 3. Memory Management

Clear conversations when appropriate:

```typescript
// Clear all conversation data
useEffect(() => {
  return () => {
    conversation.clearConversation();
  };
}, []);
```

### 4. Error Handling

Handle transcript processing errors:

```typescript
try {
  await conversation.addTranscript('user', userSpeech);
} catch (error) {
  console.error('Failed to process transcript:', error);
  // Show user-friendly error
}
```

## Migration Guide

### From Separate Hooks

```typescript
// Before
const transcripts = useTranscriptManager();
const engine = useConversationEngine(transcripts);
const analysis = useSpanishAnalysis(engine);

// After
const conversation = useConversationState({
  learnerProfile,
  onProfileUpdate: setLearnerProfile
});
// All functionality is now in one hook
```

### Accessing Nested Data

```typescript
// Before
const stats = engine.sessionStats;
const analysis = spanishAnalysis.currentAnalysis;

// After
const stats = conversation.sessionStats;
const analysis = conversation.currentSpanishAnalysis;
```

## Performance Considerations

1. **Re-render Optimization**: The hook minimizes re-renders through batched updates
2. **Memory Usage**: Transcripts are stored efficiently with automatic cleanup
3. **Computation Caching**: Spanish analysis results are cached when possible
4. **Lazy Evaluation**: Full analysis is computed only when requested

## Future Enhancements

1. **WebWorker Integration**: Move Spanish analysis to background thread
2. **Incremental Analysis**: Analyze as user speaks instead of on completion
3. **Predictive Feedback**: Anticipate user struggles based on patterns
4. **Multi-language Support**: Extend beyond Spanish to other languages

## Troubleshooting

### High Re-render Count

If experiencing excessive re-renders:
1. Check if callbacks are wrapped in `useCallback`
2. Verify dependency arrays are correct
3. Use performance dashboard to identify triggers

### Slow Spanish Analysis

If analysis is taking too long:
1. Check conversation history length
2. Consider implementing pagination
3. Use performance monitor to identify bottlenecks

### Memory Leaks

If memory usage increases over time:
1. Ensure `clearConversation` is called when appropriate
2. Check for circular references in callbacks
3. Monitor with performance dashboard

## Related Documentation

- [Architecture Overview](../ARCHITECTURE.md)
- [Performance Monitoring Guide](../../PERFORMANCE_MONITORING_GUIDE.md)
- [Spanish Analysis System](../lib/spanish-analysis/README.md)
- [usePracticeSession Hook](./usePracticeSession.md)