# Simple Examples

Basic examples showing how to use this simple WebRTC module. These are for learning and experimentation only.

⚠️ **Remember**: This is NOT a production library - just simple examples for prototypes.

## 📁 Examples Overview

### 1. Simple Chat (`simple-chat/`)
**What it demonstrates:**
- Minimal setup required for basic voice chat
- Vanilla JavaScript implementation
- No build tools or frameworks needed
- Basic connection management
- Simple message display

**Perfect for:**
- Quick prototypes
- Learning the basics
- Embedding in existing applications
- Minimal dependencies

**How to run:**
```bash
# Just open the HTML file in your browser
open simple-chat/index.html
```

### 2. Voice Assistant (`voice-assistant/`)
**What it demonstrates:**
- Wake word activation ("Hey Assistant")
- Continuous conversation mode
- Voice command processing
- Visual feedback for different states
- Advanced audio processing

**Perfect for:**
- Building Alexa/Siri-like interfaces
- Hands-free applications
- Voice-controlled systems
- Interactive kiosks

**How to run:**
```bash
# Open the HTML file in your browser
open voice-assistant/index.html
```

### 3. Audio Visualization (`audio-visualization/`)
**What it demonstrates:**
- Real-time audio waveform display
- Frequency spectrum analysis
- Multiple visualization modes
- Audio level monitoring
- Custom visual effects

**Perfect for:**
- Audio analysis applications
- Music visualization
- Speech therapy tools
- Audio debugging

**How to run:**
```bash
# Open the HTML file in your browser
open audio-visualization/index.html
```

### 4. React App (`react-app/`)
**What it demonstrates:**
- Basic React integration
- Simple TypeScript usage
- Basic React hook usage

**Perfect for:**
- Learning React integration
- Simple prototypes

**How to run:**
```bash
cd react-app
npm install
npm run dev
# Open http://localhost:3000
```

## 🎯 Which Example Should You Use?

All examples are simple demonstrations. Pick whichever helps you learn:
- **Simple Chat** - Bare minimum to get started
- **Voice Assistant** - Basic wake word example
- **Audio Visualization** - Simple audio display
- **React App** - Basic React integration

## 📝 Code Snippets

### Basic Connection (from Simple Chat)
```javascript
const client = new RealtimeClient({
  apiKey: 'your-api-key',
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy'
});

await client.connect();
```

### Wake Word Detection (from Voice Assistant)
```javascript
const assistant = new VoiceAssistant({
  wakeWord: 'Hey Assistant',
  continuous: true,
  onWakeWordDetected: () => {
    console.log('Listening for command...');
  }
});
```

### Audio Visualization (from Audio Visualization)
```javascript
visualizer.on('audioData', (data) => {
  drawWaveform(data.waveform, canvas);
  updateFrequencyBars(data.frequency);
});
```

### React Hook Usage (from React App)
```typescript
const { 
  isConnected, 
  messages, 
  connect, 
  disconnect 
} = useRealtimeChat();
```

## 🔧 Customization Tips

1. **Styling**: All examples use standard CSS that can be easily modified
2. **API Configuration**: Update model, voice, and other settings in the connection config
3. **Event Handlers**: Add custom handlers for specific events
4. **UI Components**: Examples use modular components that can be reused

## 🐛 Remember

These are simple examples for learning. They have minimal error handling and are not suitable for production use. Build your own robust solution for real applications!