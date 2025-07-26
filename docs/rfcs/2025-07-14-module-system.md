# RFC: Modular Learning System for Spanish Tutor MVP

**RFC Number**: 2025-07-14-module-system  
**Author(s)**: Rodney Franklin  
**Status**: Draft  
**Created**: July 14, 2025  
**Last Updated**: July 14, 2025

## Problem

Our Spanish Tutor MVP currently offers only a single learning path where users can freely choose any practice scenario. This creates several issues:

1. **Decision Paralysis**: New users see 11+ scenarios and don't know where to start, leading to suboptimal learning paths and potential frustration.

2. **Lack of Structure**: Without guided progression, users may jump to advanced scenarios before mastering basics, hindering their learning progress.

3. **Limited Expandability**: Adding new learning modes (news discussions, grammar lessons, book club) requires significant architectural changes to the current monolithic practice system.

4. **No Learning Path Differentiation**: All users get the same experience regardless of their goals (tourist phrases vs. business Spanish vs. academic study).

## Background/Context

### Current System Architecture
- Single practice mode with 11 NPCs/scenarios
- All scenarios equally accessible from day one
- Phase 2 refactoring achieved 77% code reduction
- Shared components: `usePracticeSession` hook, modular UI components
- Database fully migrated to Supabase

### User Feedback Insights
- Users enjoy the real-time analysis feature during conversations
- Some users feel overwhelmed by choice
- Requests for more structured learning paths
- Interest in additional learning modes beyond conversation practice

### Related Decisions
- Phase 2 Component Consolidation (COMPLETE) - established modular component architecture
- Spanish Analysis Module - created reusable analysis system
- Engineering Playbook adoption - emphasis on modular, testable code

### Technical Constraints
- Must maintain backward compatibility with existing practice pages
- Need to preserve guest mode functionality
- Should leverage existing hooks and components
- NPM-ready module extraction is a future goal

## Proposal

Create a modular learning system that presents different learning experiences as distinct modules, allowing users to choose their preferred learning style while providing structure and progression within each module.

### Technical Approach

1. **Module Registry System**
```typescript
interface LearningModule {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'all' | 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  features: {
    progressive: boolean
    adaptive: boolean
    social: boolean
    offline: boolean
  }
  getStartScreen(): ReactComponent
  getUserProgress(userId: string): ModuleProgress
  canAccess(userProfile: LearnerProfile): boolean
}
```

2. **Core Module Infrastructure**
```
/src/lib/modules/
├── core/
│   ├── ModuleRegistry.ts
│   ├── ModuleInterface.ts
│   ├── ModuleProgressTracker.ts
│   └── types.ts
├── free-practice/
│   └── (current practice system)
├── guided-journey/
│   └── (new progressive system)
└── [future modules]/
```

3. **Database Schema Extension**
```sql
CREATE TABLE module_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  module_id TEXT NOT NULL,
  module_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);
```

### Implementation Phases

**Phase 4A: Module Infrastructure (Week 1)**
- Create core module system and interfaces
- Implement module registry
- Add database migrations for module progress
- Create shared progress tracking

**Phase 4B: Wrap Existing System (Week 1)**
- Package current practice system as "Free Practice" module
- Maintain all existing functionality
- No breaking changes to current URLs

**Phase 4C: Guided Journey Module (Week 2)**
- Implement progressive scenario system
- Add unlock mechanics (70% comprehension, 5+ vocabulary words)
- Create difficulty scaling (Level 1-5 with ⭐ indicators)
- Design journey visualization components

**Phase 4D: Module Selection Dashboard (Week 3)**
- Create new `/modules` route
- Design module selection UI
- Update main dashboard with module access
- Implement progress visualization

## Implications

### Pros
- **Better User Experience**: Clear learning paths reduce decision fatigue
- **Improved Learning Outcomes**: Structured progression ensures proper skill building
- **Future Expansion**: Easy to add new modules (news, grammar, book club)
- **A/B Testing**: Can test different module approaches with user subsets
- **Monetization Options**: Premium modules possible in future
- **Code Reusability**: Modules can share components and services

### Cons
- **Added Complexity**: Module system adds abstraction layer
- **Migration Effort**: Need to wrap existing code in module interface
- **User Education**: Need to explain new module concept to existing users
- **Testing Overhead**: Each module needs independent testing

### Risks
- **Risk**: Over-engineering the module interface
  - **Mitigation**: Start simple, iterate based on actual needs
  
- **Risk**: Breaking existing user workflows
  - **Mitigation**: Keep all current URLs working, gradual migration

- **Risk**: Performance impact from module abstraction
  - **Mitigation**: Lazy load modules, optimize bundle splitting

### Impact on PHI or Compliance
No impact on PHI or compliance. Module system only affects application structure, not data handling.

### Resource Requirements
- **Engineering effort**: 6-8 engineer-weeks
- **Timeline**: 3 weeks for core implementation
- **Dependencies**: None external; builds on existing Phase 2 architecture

## Open Questions

1. Should modules share vocabulary progress, or track separately?
   - Shared: Better continuity across learning experiences
   - Separate: Cleaner data model, allows specialized tracking

2. Should we implement a "recommended module" system based on user performance?
   - Could guide users to most appropriate next steps
   - Might add complexity to MVP

3. How should module access work for guest users?
   - Full access to maintain current guest experience?
   - Limited to encourage signup?

4. Should the Guided Journey start with the existing 11 scenarios or a curated subset?
   - Full set: More content immediately
   - Subset: More focused learning experience

5. Do we need module-level analytics from day one?
   - Usage patterns would be valuable
   - Could be added in Phase 5

## Decision

**Decision**: [Pending]  
**Decided by**: [To be determined]  
**Date**: [To be determined]

---

## Appendix

### Future Module Concepts

1. **Daily News Module**
   - 30-second Spanish news clips
   - AI commentator discussion
   - Current events vocabulary

2. **Grammar Coach Module**
   - Conversational grammar lessons
   - Interactive exercises via chat
   - Focus on practical usage

3. **Book Club Module**
   - Short stories and poems
   - Literary discussion with AI
   - Cultural context exploration

4. **Business Spanish Module**
   - Professional scenarios
   - Email/document practice
   - Industry-specific vocabulary

### Alternative Approaches Considered

1. **Skill Trees**: Gaming-style progression with branching paths
   - Rejected: Too complex for MVP, might overwhelm users

2. **Linear Course Structure**: Traditional lesson-by-lesson approach
   - Rejected: Too rigid, doesn't leverage conversational AI strengths

3. **AI-Driven Adaptive Path**: Fully automated progression
   - Rejected: Removes user agency, harder to understand progress

### Success Metrics
- User engagement time per module
- Module completion rates
- Cross-module progression patterns
- User satisfaction scores
- Feature adoption rate