# 🚀 Quick Sanity Check for NPM Module

## 1-Minute Test (As Another Developer)

### Step 1: Build the Module
```bash
cd /Users/rodneyfranklin/Development/personal/SpanishTutor/ClaudeSpanish/spanish-tutor-mvp/packages/openai-realtime-webrtc
npm run build
```

### Step 2: Start Your Test Server (in another terminal)
```bash
cd /Users/rodneyfranklin/Development/personal/VoiceNPMmoduletest
npm run server
```

### Step 3: Open the Test Page
Open this file in your browser:
```
file:///Users/rodneyfranklin/Development/personal/SpanishTutor/ClaudeSpanish/spanish-tutor-mvp/packages/openai-realtime-webrtc/quick-test.html
```

### Step 4: Test It!
1. Click **"Connect"** - Allow microphone when prompted
2. Either:
   - Click **"Say Hello"** to send text
   - Or just **speak naturally**
3. You should **hear the AI respond** through your speakers!

### What Success Looks Like:
- ✅ "Connected!" message appears
- ✅ Green status indicator
- ✅ "Audio track received!" in the log
- ✅ You hear AI voice responses
- ✅ Text transcripts appear in log

### If It Doesn't Work:
- Check console for errors (F12)
- Ensure server is running on port 3001
- Check .env has valid OPENAI_API_KEY
- Try hard refresh (Cmd+Shift+R)

## Alternative: Test as NPM Package

### Create a new test project:
```bash
mkdir openai-test && cd openai-test
npm init -y

# Install from local path
npm install ../SpanishTutor/ClaudeSpanish/spanish-tutor-mvp/packages/openai-realtime-webrtc

# Create test file
cat > test.js << 'EOF'
import { OpenAIRealtimeService } from '@openai-realtime/webrtc';

const service = new OpenAIRealtimeService({
  tokenEndpoint: 'http://localhost:3001/api/session'
});

service.on('audioTrackReceived', (track) => {
  console.log('Audio track received!');
  // In a real app, you'd play this
});

service.connect().then(() => {
  console.log('Connected! Module works!');
  service.sendText('Hello from NPM test!');
});
EOF

# Run it
node test.js
```

This gives you a real "developer experience" test of the NPM module!