# Troubleshooting Guide - Spanish Tutor MVP

This guide helps developers diagnose and fix common issues in the Spanish Tutor application.

## Table of Contents

1. [Performance Issues](#performance-issues)
2. [WebRTC/Audio Issues](#webrtcaudio-issues)
3. [State Management Issues](#state-management-issues)
4. [Spanish Analysis Issues](#spanish-analysis-issues)
5. [Authentication Issues](#authentication-issues)
6. [Database Issues](#database-issues)
7. [Build & Deployment Issues](#build--deployment-issues)
8. [Debugging Tools](#debugging-tools)

## Performance Issues

### Problem: High Re-render Count (8-10 per interaction)

**Symptoms:**
- Sluggish UI response
- Performance dashboard shows >5 re-renders per interaction
- Console warnings about excessive re-renders

**Diagnosis:**
```typescript
// Add to your component
import { useRenderCounter } from '@/hooks/usePerformanceMonitor';

function YourComponent() {
  const renderCounter = useRenderCounter('YourComponent', true);
  console.log(`Render count: ${renderCounter.renderCount}`);
}
```

**Solutions:**

1. **Check hook dependencies:**
```typescript
// Bad - recreates function every render
const handleClick = () => { /* ... */ };

// Good - memoized function
const handleClick = useCallback(() => { /* ... */ }, []);
```

2. **Use React DevTools Profiler:**
- Install React DevTools extension
- Open Profiler tab
- Record interaction
- Check "Ranked" view for expensive components

3. **Implement React.memo:**
```typescript
// For pure components
export default React.memo(YourComponent);

// With custom comparison
export default React.memo(YourComponent, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});
```

4. **Check for state updates in loops:**
```typescript
// Bad - multiple state updates
items.forEach(item => {
  setCount(prev => prev + 1);  // Causes re-render each time
});

// Good - batch updates
setCount(prev => prev + items.length);  // Single re-render
```

### Problem: Slow Spanish Analysis

**Symptoms:**
- Analysis operations >50ms in performance monitor
- UI freezes during transcript processing

**Diagnosis:**
```typescript
// Check performance dashboard
// Look for "spanishAnalysis" operation times
```

**Solutions:**

1. **Limit conversation history:**
```typescript
// Only analyze recent messages
const recentHistory = conversationHistory.slice(-10);
const analysis = analyzeConversation(recentHistory);
```

2. **Implement debouncing:**
```typescript
const debouncedAnalysis = useMemo(
  () => debounce((text) => analyzeSpanishText(text), 300),
  []
);
```

3. **Cache analysis results:**
```typescript
const analysisCache = useRef(new Map());

const getCachedAnalysis = (text) => {
  if (analysisCache.current.has(text)) {
    return analysisCache.current.get(text);
  }
  const result = analyzeSpanishText(text);
  analysisCache.current.set(text, result);
  return result;
};
```

### Problem: Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- Browser becomes sluggish after extended use
- Performance dashboard shows memory growth

**Solutions:**

1. **Clean up event listeners:**
```typescript
useEffect(() => {
  const handler = (e) => { /* ... */ };
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);
```

2. **Clear conversation history:**
```typescript
// Add maximum transcript limit
const MAX_TRANSCRIPTS = 100;

if (transcripts.length > MAX_TRANSCRIPTS) {
  setTranscripts(prev => prev.slice(-50));
}
```

3. **Dispose of resources:**
```typescript
useEffect(() => {
  return () => {
    // Clean up on unmount
    conversation.clearConversation();
    service.disconnect();
  };
}, []);
```

## WebRTC/Audio Issues

### Problem: Microphone Not Working

**Symptoms:**
- "Microphone access denied" error
- No audio input detected
- Speaking indicator not showing

**Diagnosis:**
```typescript
// Check browser permissions
navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log('Mic permission:', result.state));
```

**Solutions:**

1. **Check browser permissions:**
   - Click padlock icon in address bar
   - Ensure microphone is allowed
   - Try incognito mode to rule out extensions

2. **Debug audio stream:**
```typescript
// Test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('Got audio stream:', stream.getAudioTracks());
    // Don't forget to stop the stream
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('Mic error:', err));
```

3. **Check audio constraints:**
```typescript
// Try different constraints
const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 24000
  }
};
```

### Problem: No Audio Output

**Symptoms:**
- Assistant responses not audible
- Audio element not playing
- Console shows "Autoplay blocked"

**Solutions:**

1. **Handle autoplay policy:**
```typescript
// Ensure user interaction before audio
const handleConnect = async () => {
  // User click allows autoplay
  await audioRef.current?.play();
  await service.connect();
};
```

2. **Check audio element:**
```typescript
<audio 
  ref={audioRef} 
  autoPlay 
  playsInline  // Important for iOS
/>
```

3. **Debug audio stream:**
```typescript
// Monitor audio element
audioRef.current?.addEventListener('error', (e) => {
  console.error('Audio error:', e);
});
```

### Problem: WebRTC Connection Fails

**Symptoms:**
- "Failed to connect" error
- Connection timeout
- No response from OpenAI

**Solutions:**

1. **Check API key:**
```typescript
// Verify in server endpoint
console.log('API key present:', !!process.env.OPENAI_API_KEY);
console.log('API key starts with:', process.env.OPENAI_API_KEY?.substring(0, 7));
```

2. **Debug connection flow:**
```typescript
// Add logging to service
service.on('statusUpdate', (status) => {
  console.log('Connection status:', status);
});
```

3. **Check network:**
   - Ensure not behind restrictive firewall
   - Try different network
   - Check browser console for CORS errors

## State Management Issues

### Problem: State Not Updating

**Symptoms:**
- UI not reflecting state changes
- Callbacks not firing
- Stale data in components

**Solutions:**

1. **Check closure issues:**
```typescript
// Bad - stale closure
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count);  // Always logs initial value
  }, 1000);
}, []);  // Missing dependency

// Good
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count);  // Current value
  }, 1000);
  return () => clearInterval(interval);
}, [count]);  // Correct dependency
```

2. **Use functional updates:**
```typescript
// When updating based on previous state
setCount(prevCount => prevCount + 1);
// Not: setCount(count + 1);
```

3. **Debug with useWhyDidYouUpdate:**
```typescript
import { useWhyDidYouUpdate } from '@/hooks/usePerformanceMonitor';

useWhyDidYouUpdate('MyComponent', props);
// Logs which props changed
```

### Problem: Profile Not Persisting

**Symptoms:**
- Profile resets on page refresh
- Progress not saved
- Guest mode not working

**Solutions:**

1. **Check storage adapter:**
```typescript
// Verify storage is working
const storage = window.localStorage.getItem('learner_profile');
console.log('Stored profile:', storage);
```

2. **Ensure save callback provided:**
```typescript
const conversation = useConversationState({
  learnerProfile,
  onProfileUpdate: setLearnerProfile,
  onSaveProfile: async (profile) => {
    await lldb.profiles.updateProfile(userId, profile);
  }
});
```

3. **Debug storage operations:**
```typescript
// Enable LLDB logging
window.LLDB_DEBUG = true;
```

## Spanish Analysis Issues

### Problem: Vocabulary Not Detected

**Symptoms:**
- Spanish words not highlighted
- Mexican expressions missed
- Essential vocabulary showing 0%

**Solutions:**

1. **Check scenario configuration:**
```typescript
// Ensure scenario matches available data
const VALID_SCENARIOS = [
  'taco_vendor', 'restaurant', 'hotel_checkin',
  'taxi_ride', 'market', 'mexico_city_adventure'
];
```

2. **Debug analyzer:**
```typescript
// Test analyzer directly
import { analyzeSpanishText } from '@/lib/spanish-analysis';

const result = analyzeSpanishText(
  'Hola, ¿cómo estás?',
  'restaurant',
  'beginner'
);
console.log('Analysis result:', result);
```

3. **Check vocabulary data:**
```typescript
// Verify vocabulary loaded
import { scenarioVocabulary } from '@/lib/spanish-analysis/mexican-vocabulary';
console.log('Available scenarios:', Object.keys(scenarioVocabulary));
```

### Problem: Incorrect Comprehension Scoring

**Symptoms:**
- Confidence scores seem wrong
- Good responses marked as struggling
- Feedback doesn't match performance

**Solutions:**

1. **Adjust detection thresholds:**
```typescript
// In pedagogical-system.ts
const COMPREHENSION_THRESHOLDS = {
  GOOD: 0.6,      // Adjust if too strict
  STRUGGLING: 0.3  // Adjust if too lenient
};
```

2. **Debug comprehension detection:**
```typescript
import { detectComprehension } from '@/lib/pedagogical-system';

const result = detectComprehension('your test text');
console.log('Comprehension:', result);
```

## Authentication Issues

### Problem: Login Not Working

**Symptoms:**
- "Invalid credentials" error
- Redirect loops
- Session not persisting

**Solutions:**

1. **Check environment variables:**
```bash
# Verify .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

2. **Debug auth flow:**
```typescript
// Add to pages/api/auth/[...nextauth].ts
callbacks: {
  async signIn({ user, account, profile }) {
    console.log('Sign in attempt:', { user, account });
    return true;
  }
}
```

3. **Clear auth cookies:**
```javascript
// In browser console
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

### Problem: Guest Mode Issues

**Symptoms:**
- Guest mode not saving progress
- Profile lost on refresh
- Features disabled in guest mode

**Solutions:**

1. **Check localStorage:**
```typescript
// Verify guest profile saved
const guestProfile = localStorage.getItem('guest_learner_profile');
console.log('Guest profile:', guestProfile);
```

2. **Enable guest features:**
```typescript
const session = usePracticeSession({
  enableAuth: false,  // Allow guest mode
  enableAnalysis: true,  // Still track progress
  enableAdaptation: true  // Still adapt to level
});
```

## Database Issues

### Problem: Supabase Connection Failed

**Symptoms:**
- "Failed to fetch" errors
- No data loading
- Timeout errors

**Solutions:**

1. **Check connection string:**
```bash
# Verify DATABASE_URL format
postgresql://user:password@host:port/database?schema=public
```

2. **Test connection:**
```typescript
// Debug Supabase client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

console.log('Connection test:', { data, error });
```

3. **Check RLS policies:**
```sql
-- Ensure policies allow access
SELECT * FROM pg_policies WHERE tablename = 'conversations';
```

### Problem: Data Not Saving

**Symptoms:**
- Conversations disappear
- Progress resets
- No error messages

**Solutions:**

1. **Enable error logging:**
```typescript
// Wrap database calls
try {
  await lldb.conversations.saveConversation(conversationData);
} catch (error) {
  console.error('Save failed:', error);
  // Show user-friendly error
}
```

2. **Check data format:**
```typescript
// Validate before saving
const isValid = validateConversationData(data);
if (!isValid) {
  console.error('Invalid data format:', data);
}
```

## Build & Deployment Issues

### Problem: Build Fails

**Symptoms:**
- TypeScript errors
- Module not found
- Build timeout

**Solutions:**

1. **Clear cache and rebuild:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

2. **Check TypeScript errors:**
```bash
npx tsc --noEmit
```

3. **Verify imports:**
```typescript
// Use absolute imports
import { something } from '@/lib/module';
// Not: import { something } from '../../../lib/module';
```

### Problem: Production Errors

**Symptoms:**
- Works locally but not deployed
- Environment variables missing
- API routes 404

**Solutions:**

1. **Check environment variables:**
   - Ensure all vars set in production
   - No quotes in .env files
   - Restart after changes

2. **Debug production build:**
```bash
npm run build
npm start  # Test production locally
```

3. **Check API routes:**
```typescript
// Ensure correct exports
export async function GET(request: Request) { }
export async function POST(request: Request) { }
```

## Debugging Tools

### Performance Dashboard

Access at `/` (bottom-right corner in development):
- Monitor re-renders
- Track operation times
- View memory usage
- Get optimization suggestions

### Browser DevTools

1. **Console debugging:**
```typescript
// Enable verbose logging
localStorage.setItem('debug', 'app:*');
```

2. **Network tab:**
   - Check API calls
   - Monitor WebSocket messages
   - Verify response times

3. **React DevTools:**
   - Component tree
   - Props inspection
   - Profiler for performance

### Debug Utilities

```typescript
// Add to any component
import { DevOnly } from '@/components/debug/DevOnly';

<DevOnly>
  <pre>{JSON.stringify(state, null, 2)}</pre>
</DevOnly>
```

### Logging Levels

```typescript
// Set in browser console
window.LOG_LEVEL = 'debug';  // 'error' | 'warn' | 'info' | 'debug'
```

## Getting Help

If these solutions don't resolve your issue:

1. **Check existing issues:** [GitHub Issues](#)
2. **Review documentation:** 
   - [Architecture Guide](./ARCHITECTURE.md)
   - [Performance Guide](./PERFORMANCE_MONITORING_GUIDE.md)
   - [Migration Guide](./MIGRATION_GUIDE.md)
3. **Create detailed bug report:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information
   - Console errors
   - Network requests

Remember: Most issues have simple solutions. Start with the basics before diving deep!