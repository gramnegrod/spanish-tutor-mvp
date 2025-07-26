# Spanish Tutor MVP Documentation

Welcome to the Spanish Tutor MVP documentation. This directory contains all project documentation organized by category.

## Table of Contents

### Project Overview
- [Project Summary](./PROJECT_SUMMARY.md) - Current project status and overview
- [Project Summary (2025-01-06)](./PROJECT_SUMMARY_2025_01_06.md) - Historical project summary
- [Notes](./NOTES.md) - General project notes and observations
- [Primer Spanish Tutor](./PrimerSpanishTutor.md) - Initial project primer

### Architecture Documentation
- [Navigation Analysis](./architecture/navigation-analysis.md) - Analysis of the application's navigation structure
- [Adaptive Learning Debug](./architecture/ADAPTIVE_LEARNING_DEBUG.md) - Technical details of the adaptive learning system implementation

### Guides and Research
- [Test Results](./guides/TEST_RESULTS.md) - Adaptive Practice Page test results and implementation details
- [Guest User Research](./guides/guest-user-research.md) - Research on implementing guest user functionality
- [Claude Integration Guide](./guides/CLAUDE.md) - Guide for Claude AI integration

### Planning Documents
- [Plan 1](./Plan1.md) - Initial planning document
- [Plan 1 Context Prompt](./Plan1ContextPrompt.md) - Context for Plan 1
- [Plan 2](./Plan2.md) - Second iteration planning
- [Plan 2b](./Plan2b.md) - Plan 2 revision
- [Plan 3](./Plan3.md) - Third iteration planning
- [Plan 3.5](./Plan35.md) - Intermediate planning update
- [Plan 4](./Plan4.md) - Fourth iteration planning
- [Plan Initial Prompt](./PlanInitialPrompt.md) - Initial planning prompt
- [Plan Prompt 3](./Planprompt3.md) - Third planning prompt
- [Plan Refactor](./Planrefactor.md) - Refactoring plan

### Technical Documentation
- [OpenAI Realtime Learnings](./openai-realtime-learnings.md) - Learnings from OpenAI Realtime API
- [OpenAI Communication](./openaicommunication.md) - OpenAI communication patterns
- [RAG with OpenAI](./RagwithOpenai.md) - Retrieval Augmented Generation implementation
- [NPCs](./npcs.md) - Non-player character system
- [Student Conversation Analysis](./StudentConversationAnalysis.md) - Analysis of student conversations
- [Test London Discovery](./test-london-discovery.md) - Test discovery documentation

### Advanced Learning Algorithms
- [Comprehension](./AdvancedLearningAlgorythms/comprehension.md) - Comprehension detection system
- [Future Personalization](./AdvancedLearningAlgorythms/FuturePersonalization.md) - Future personalization features
- [Spanish Analysis Integration](./AdvancedLearningAlgorythms/Spanish-Analysis-Integration.md) - Spanish language analysis
- [VAD Matters](./AdvancedLearningAlgorythms/VadMatters.md) - Voice Activity Detection importance

### API Documentation
*(Currently empty - API documentation will be added as the project develops)*

## Documentation Structure

```
docs/
├── README.md                 # This file - documentation index
├── PROJECT_SUMMARY.md        # Current project status
├── PROJECT_SUMMARY_2025_01_06.md  # Historical summary
├── NOTES.md                  # General notes
├── PrimerSpanishTutor.md    # Project primer
├── Plan*.md                  # Planning documents
├── *.md                      # Technical documentation
├── AdvancedLearningAlgorythms/  # Advanced learning system docs
│   ├── comprehension.md
│   ├── FuturePersonalization.md
│   ├── Spanish-Analysis-Integration.md
│   └── VadMatters.md
├── api/                      # API documentation (to be added)
├── architecture/             # System architecture documentation
│   ├── navigation-analysis.md
│   └── ADAPTIVE_LEARNING_DEBUG.md
└── guides/                   # How-to guides and research
    ├── TEST_RESULTS.md
    ├── guest-user-research.md
    └── CLAUDE.md
```

## Contributing to Documentation

When adding new documentation:
1. Place architectural and technical design documents in `/docs/architecture/`
2. Place how-to guides, tutorials, and research in `/docs/guides/`
3. Place API documentation in `/docs/api/`
4. Update this README.md file to include links to new documents