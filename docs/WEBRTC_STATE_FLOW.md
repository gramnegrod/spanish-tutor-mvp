# WebRTC State Flow Analysis

## State Update Cascade

When a user speaks, here's the complete state update flow:

```
User Speaks
  │
  └──▶ WebRTC Audio Stream
       │
       └──▶ OpenAI Realtime API
            │
            └──▶ Transcript Event
                 │
                 ├──▶ useOpenAIRealtime.onTranscript()
                 │    │
                 │    └──▶ setStatus() ✓
                 │
                 └──▶ usePracticeSession.handleTranscript()
                      │
                      ├──▶ conversationEngine.processTranscript()
                      │    │
                      │    ├──▶ setConversationHistory() ✓
                      │    ├──▶ setSessionStats() ✓
                      │    ├──▶ setLastComprehensionFeedback() ✓
                      │    ├──▶ onProfileUpdate() → setLearnerProfile() ✓
                      │    └──▶ Spanish Analysis Processing
                      │
                      └──▶ transcriptManager.addTranscript()
                           │
                           ├──▶ setTranscripts() ✓
                           ├──▶ setCurrentSpeaker() ✓
                           └──▶ setConversationStartTime() ✓ (first time)
```

## State Updates Per User Speech

Minimum state updates triggered: **8-10**

1. `status` (useOpenAIRealtime)
2. `conversationHistory` (useConversationEngine)
3. `sessionStats` (useConversationEngine)
4. `lastComprehensionFeedback` (useConversationEngine)
5. `learnerProfile` (usePracticeSession)
6. `transcripts` (useTranscriptManager)
7. `currentSpeaker` (useTranscriptManager)
8. `conversationStartTime` (first transcript only)

Additional possible updates:
- `consecutiveSuccesses/Failures` (usePracticeAdaptation)
- `showAdaptationNotification` (usePracticeAdaptation)
- `costs` (useOpenAIRealtime)
- `completionChecklist` (practice pages)

## Re-render Propagation

```
PracticePage Component
  │
  ├── Re-renders on ANY state change
  │
  ├── Child Components (not memoized)
  │   ├── TranscriptDisplay
  │   ├── ConnectionStatus
  │   ├── SpanishFeedback
  │   ├── VocabularyProgress
  │   └── SessionStats
  │
  └── All re-render even if their data hasn't changed
```

## Problematic State Patterns

### 1. Object State with Spread Updates
```typescript
// This causes re-render even if values don't change
setSessionStats({
  ...sessionStats,
  totalResponses: sessionStats.totalResponses + 1
});
```

### 2. Cascading Updates
```typescript
// Profile update triggers multiple downstream updates
onProfileUpdate(newProfile)
  └──▶ setLearnerProfile()
       └──▶ useEffect triggers
            └──▶ updateInstructions()
                 └──▶ More state updates...
```

### 3. Unmemoized Callbacks
```typescript
// Created fresh on every render
const handleTranscript = async (role, text) => {
  // Processing logic
};
```

## Memory Growth Issues

1. **Transcript Array**: Grows unbounded
   - No pagination or virtualization
   - Each transcript is a new object
   - Never cleaned up during session

2. **Conversation History**: Duplicated in multiple hooks
   - `transcripts` in useTranscriptManager
   - `conversationHistory` in useConversationEngine
   - Both grow without bounds

3. **Event Listeners**: Potential memory leaks
   - Service creates new event handlers
   - Not always properly cleaned up
   - Closures capture state

## Performance Impact

### Per Transcript:
- 8-10 state updates
- Full component tree re-render
- Spanish analysis processing (100-200ms)
- DOM updates for transcript display

### Over 10-minute conversation:
- ~100 transcripts
- 800-1000 state updates
- Increasing memory usage
- Slower renders over time

## Optimization Opportunities

1. **Batch State Updates**
   ```typescript
   // Instead of multiple setState calls
   dispatch({ 
     type: 'TRANSCRIPT_PROCESSED',
     payload: { transcript, stats, feedback }
   });
   ```

2. **Memoize Components**
   ```typescript
   const TranscriptDisplay = React.memo(({ transcripts }) => {
     // Only re-renders if transcripts change
   });
   ```

3. **Virtualize Long Lists**
   ```typescript
   // Only render visible transcripts
   <VirtualList items={transcripts} />
   ```

4. **Stable References**
   ```typescript
   const handleTranscript = useCallback((role, text) => {
     // Stable function reference
   }, [dependencies]);
   ```