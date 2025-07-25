# React TypeScript Example

A production-ready React application demonstrating the OpenAI Realtime WebRTC library with TypeScript.

## Features

- 🎯 Full TypeScript support with type safety
- 🎨 Modern, responsive UI with CSS modules
- 🔊 Real-time audio visualization
- 💬 Message history with timestamps
- 🔌 Connection status monitoring
- 📊 Audio quality indicators
- 🎙️ Voice activity detection
- ⚡ Optimized performance with React hooks

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

4. Enter your OpenAI API key and click Connect

## Project Structure

```
src/
├── components/         # React components
│   ├── AudioControls   # Audio monitoring and visualization
│   ├── ConnectionPanel # API key input and connection management
│   ├── ConversationView # Message display and history
│   └── StatusBar       # Connection status and metrics
├── hooks/             # Custom React hooks
│   └── useRealtimeChat # Main hook for realtime functionality
├── App.tsx            # Main application component
├── App.css            # Application styles
└── main.tsx           # Application entry point
```

## Key Components

### ConnectionPanel
Handles API key input and connection management. Shows current configuration and connection status.

### ConversationView
Displays the conversation history with proper formatting for user, assistant, and system messages.

### AudioControls
Provides real-time audio visualization and quality indicators. Shows speaking/listening status.

### StatusBar
Displays connection status, message count, and latency information.

## Custom Hook

The `useRealtimeChat` hook encapsulates all the realtime logic:
- Connection management
- Message handling
- Audio level monitoring
- Error handling
- State management

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Customization

You can customize the application by:
- Modifying the color scheme in CSS files
- Adjusting the audio visualization in AudioControls
- Adding new message types in ConversationView
- Extending the useRealtimeChat hook with additional features