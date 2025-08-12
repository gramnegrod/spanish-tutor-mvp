/**
 * Hooks Index
 * 
 * Central export point for all custom hooks and their types.
 * Provides clean imports throughout the application.
 */

// Main practice session hook
export { 
  usePracticeSession,
  type UsePracticeSessionOptions,
  type UsePracticeSessionReturn 
} from './usePracticeSession'

// Adaptation system
export { 
  usePracticeAdaptation,
  type AdaptationProgress,
  type AdaptationNotification,
  type AdaptationOptions,
  type UsePracticeAdaptationReturn 
} from './usePracticeAdaptation'

// Conversation state management
export { 
  useConversationState,
  type SessionStats,
  type ComprehensionFeedback 
} from './useConversationState'

// OpenAI Realtime integration
export { 
  useOpenAIRealtime 
} from './useOpenAIRealtime'

// NPC data loading
export { 
  useNPCLoader 
} from './useNPCLoader'

// Session persistence
export { 
  useSessionPersistence 
} from './useSessionPersistence'

// Session analytics
export { 
  useSessionAnalytics 
} from './useSessionAnalytics'