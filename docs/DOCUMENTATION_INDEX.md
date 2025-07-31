# Spanish Tutor MVP - Documentation Index

This index provides quick access to all documentation for the Spanish Tutor MVP application.

## 📚 Core Documentation

### Architecture & Design
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Comprehensive architectural documentation covering the 3-layer design, hook simplification, and service consolidation
- **[Project Structure](./guides/DEVELOPER_GUIDE.md#architecture-overview)** - Overview of directory organization and data flow

### Development Guides
- **[DEVELOPER_GUIDE.md](./guides/DEVELOPER_GUIDE.md)** - Complete guide for developers including setup, workflow, and best practices
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Step-by-step guide for migrating from the old 5-layer to new 3-layer architecture
- **[README.md](../README.md)** - Quick start guide and project overview

### Performance & Monitoring
- **[PERFORMANCE_MONITORING_GUIDE.md](../PERFORMANCE_MONITORING_GUIDE.md)** - Comprehensive guide to the performance monitoring system
- **[Performance Dashboard](./guides/DEVELOPER_GUIDE.md#debugging-tips)** - How to use the built-in performance dashboard

### Troubleshooting
- **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** - Common issues and solutions for development and production
- **[Debug Tools](./guides/DEVELOPER_GUIDE.md#debugging-tips)** - Available debugging utilities and techniques

## 🪝 Hook Documentation

### Core Hooks
- **[useConversationState](./hooks/useConversationState.md)** - Unified state management hook combining transcript and analysis functionality
- **[useOpenAIRealtime](../src/hooks/useOpenAIRealtime.ts)** - WebRTC integration for OpenAI Realtime API
- **[usePracticeSession](../src/hooks/usePracticeSession.ts)** - High-level orchestration hook for practice pages
- **[usePerformanceMonitor](../src/hooks/usePerformanceMonitor.ts)** - Performance tracking and optimization hook

## 🧩 Component Documentation

### Practice Components
- **[PracticeLayout](../src/components/practice/PracticeLayout.tsx)** - Main layout wrapper for practice pages
- **[SpanishAnalyticsDashboard](../src/components/practice/SpanishAnalyticsDashboard.tsx)** - Real-time Spanish learning analytics
- **[ConversationSession](../src/components/practice/ConversationSession.tsx)** - Transcript display and session management
- **[VoiceControl](../src/components/practice/VoiceControl.tsx)** - Voice recording interface

### UI Components
- **[Component Library](../src/components/ui/)** - Reusable UI components
- **[Image Optimization Guide](../src/components/ui/IMAGE_OPTIMIZATION_GUIDE.md)** - Best practices for images

## 📦 Service Documentation

### OpenAI Realtime Service
- **[Service README](../src/services/README.md)** - OpenAI Realtime service documentation
- **[Service Architecture](../src/services/openai-realtime/)** - Modular service implementation

### Storage System
- **[Language Learning DB](../src/lib/language-learning-db/README.md)** - Storage abstraction layer documentation
- **[Database Schema](../prisma/schema.prisma)** - Prisma database schema

## 🧪 Testing Documentation

### Test Guides
- **[Testing Strategy](./guides/DEVELOPER_GUIDE.md#testing-strategy)** - Overview of testing approach
- **[Test Results](./guides/TEST_RESULTS.md)** - Latest test coverage and results

### Test Files
- Integration Tests: `src/__tests__/`
- Hook Tests: `src/hooks/__tests__/`
- Component Tests: `src/components/**/__tests__/`

## 📊 Spanish Analysis System

### Documentation
- **[Spanish Analysis](../src/lib/spanish-analysis/)** - Core Spanish language analysis engine
- **[Mexican Vocabulary](../src/lib/spanish-analysis/mexican-vocabulary.ts)** - Scenario-specific vocabulary data
- **[Pedagogical System](../src/lib/pedagogical-system.ts)** - Adaptive learning algorithms

## 🚀 Deployment & Operations

### Setup Guides
- **[Environment Setup](../README.md#setup-instructions)** - Initial setup instructions
- **[Database Setup](../docs/supabase-setup.sql)** - Database initialization scripts

### Configuration
- **[Environment Variables](../README.md#environment-variables)** - Required environment configuration
- **[OpenAI Presets](../src/config/openai-presets.ts)** - Voice and model configurations

## 📈 Architecture Benefits

### Key Improvements
1. **Simplified Architecture**: 5 layers → 3 layers (40% reduction)
2. **Performance**: 8-10 re-renders → 2-3 re-renders per interaction
3. **Code Reduction**: 77% less code for new practice pages
4. **Maintainability**: Modular services ready for NPM extraction

### Migration Benefits
- Easier debugging with clearer data flow
- Better TypeScript support
- Unified state management
- Built-in performance monitoring

## 🔗 Quick Links

### Common Tasks
- [Creating a New Practice Scenario](./guides/DEVELOPER_GUIDE.md#creating-a-new-practice-scenario)
- [Adding Spanish Vocabulary](./guides/DEVELOPER_GUIDE.md#adding-spanish-analysis-features)
- [Performance Debugging](../TROUBLESHOOTING.md#performance-issues)
- [WebRTC Troubleshooting](../TROUBLESHOOTING.md#webrtcaudio-issues)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Supabase Documentation](https://supabase.com/docs)
- [React Performance](https://react.dev/learn/render-and-commit)

## 📝 Documentation Standards

When adding new documentation:
1. Use clear, descriptive headings
2. Include code examples
3. Add to this index
4. Keep documentation close to code
5. Update when making changes

## 🤝 Contributing

See [DEVELOPER_GUIDE.md](./guides/DEVELOPER_GUIDE.md#development-workflow) for contribution guidelines and coding standards.