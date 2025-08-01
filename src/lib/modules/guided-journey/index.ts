// Main module export
export { guidedJourneyModule, GuidedJourneyModule } from './GuidedJourneyModule'

// Configuration exports
export { journeyScenarios, journeyConfig } from './journey-config'
export type { 
  JourneyScenario, 
  JourneyProgress, 
  UnlockCriteria,
  ScenarioPerformance,
  JourneyStatistics,
  DifficultySettings,
  SupportLevel,
  ConversationMetrics
} from './journey-config'

// Service exports
export { ProgressionService } from './services/ProgressionService'

// Component exports
export { JourneyMap } from './components/JourneyMap'
export { ScenarioCard } from './components/ScenarioCard'

// Re-export commonly used types
export { ModuleDifficulty } from '../core/types'