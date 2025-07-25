# Changelog

Simple change log for this experimental module.

⚠️ **Remember**: This is a simple module for experiments, not production use.

## [4.0.1] - 2025-01-24

### Fixed
- Token endpoint now correctly uses POST method instead of GET
- Added sampleRate: 24000 to audio constraints to match OpenAI requirements

## [4.0.2] - 2025-01-25

### Fixed
- Bundled eventemitter3 dependency for standalone browser usage
- Added browser.js bundle that works without build tools
- Module now works in plain HTML files without bundlers

### Added
- Browser-ready IIFE bundle at dist/browser.js
- Global `OpenAIRealtimeWebRTC` object for browser usage

## [4.0.0] - 2025-01-23

### Breaking Changes
- **WebRTC-Only Architecture**: Completely removed WebSocket support to focus exclusively on WebRTC
- **Removed Deprecated Events**: Eliminated `audioData` and `audioCompleted` events from type definitions
- **Simplified API Surface**: Removed all WebSocket-related configuration options
- **Direct WebRTC Focus**: Library now aligns with OpenAI's official WebRTC implementation pattern

### Changed
- **Updated TypeScript Definitions**: Removed deprecated event types from interfaces
- **Cleaner API**: Focused exclusively on WebRTC peer-to-peer connections
- **Updated Documentation**: README now emphasizes WebRTC benefits and patterns
- **Package Description**: Updated to reflect WebRTC-focused implementation

### Improved
- **Type Safety**: Cleaned up TypeScript definitions for better type checking
- **Documentation Clarity**: Clear WebRTC vs WebSocket distinction
- **Example Alignment**: Examples now match OpenAI's official WebRTC patterns

### Migration Guide
- Remove any WebSocket-related configuration
- Update event listeners to remove `audioData` handlers
- Audio is now handled exclusively through WebRTC audio tracks
- See README for detailed migration instructions

## [3.0.0] - 2025-01-22

### Breaking Changes
- **Complete API Redesign**: Simplified from 15+ classes to just 3 core modules
- **Removed SessionManager**: Session management is now integrated into `OpenAIRealtimeService`
- **Removed EventBus**: Events are now handled directly by the service
- **New Service API**: Single service class handles all functionality
- **React Hook Changes**: `useRealtime` hook now returns a simpler, more intuitive API

### Added
- **OpenAIRealtimeService**: New unified service class that handles all WebRTC and Realtime API interactions
- **AudioManager Export**: Audio processing can now be imported separately via `@openai-realtime/webrtc/audio`
- **Better TypeScript Support**: Improved type exports and declarations
- **Tree-shaking Support**: Added `sideEffects: false` for better bundling
- **Bundle Size Monitoring**: Added size-limit to track and optimize bundle sizes
- **Source Maps**: All builds now include source maps for easier debugging

### Changed
- **Smaller Bundle Size**: Reduced by ~40% through better code organization and tree-shaking
- **Faster Build Times**: Optimized Rollup configuration with parallel builds
- **Better Error Messages**: More descriptive errors with actionable solutions
- **Improved Documentation**: Clearer examples and better inline documentation
- **Modern Module Exports**: Proper ESM/CJS dual package with optimized exports

### Optimizations
- **Automatic Reconnection**: Built-in reconnection logic with exponential backoff
- **Memory Management**: Better cleanup of audio resources and event listeners
- **Performance**: Optimized audio processing pipeline
- **Bundle Optimization**: Terser configuration for smaller production builds

### Migration Guide

#### Before (v2.x):
```typescript
import { SessionManager, EventBus } from '@openai-realtime/webrtc';

const eventBus = new EventBus();
const sessionManager = new SessionManager(eventBus, { 
  tokenEndpoint: '/api/token' 
});

await sessionManager.initialize();
eventBus.on('audio.level', (level) => console.log(level));
```

#### After (v3.0):
```typescript
import { OpenAIRealtimeService } from '@openai-realtime/webrtc';

const service = new OpenAIRealtimeService({
  tokenEndpoint: '/api/token'
});

await service.connect();
service.on('audioLevel', (level) => console.log(level));
```

See the [Migration Guide](./docs/MIGRATION.md) for detailed upgrade instructions.

### Credits
- Simplified architecture inspired by community feedback
- Performance optimizations based on real-world usage patterns
- Special thanks to all contributors and early adopters

## [2.0.0] - Previous Release
- Initial public release with full WebRTC support
- Multi-class architecture with SessionManager, EventBus, etc.