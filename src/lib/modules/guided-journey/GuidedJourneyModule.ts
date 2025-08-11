import { 
  LearningModule, 
  ModuleConfiguration, 
  ModuleDifficulty, 
  ModuleFeatures,
  ModuleStatus,
  ModuleAnalytics,
  ModuleSession
} from '../core/types'
import { journeyScenarios, getUnlockedScenarios, JourneyProgress } from './journey-config'
import { ProgressionService } from './services/ProgressionService'

export class GuidedJourneyModule implements LearningModule {
  public readonly id = 'guided-journey'
  public readonly name = 'Guided Journey'
  public readonly description = 'Follow a structured path through Mexico City, unlocking scenarios as you progress'
  public readonly icon = '🗺️'
  public readonly supportedDifficulties = [ModuleDifficulty.BEGINNER, ModuleDifficulty.INTERMEDIATE, ModuleDifficulty.ADVANCED]
  public readonly defaultDifficulty = ModuleDifficulty.BEGINNER
  
  public readonly features: ModuleFeatures = {
    progressive: true,    // Scenarios unlock in sequence
    adaptive: true,       // Difficulty adjusts to performance
    social: false,        // No social features yet
    offline: true         // Works in guest mode
  }

  private progressionService: ProgressionService
  private status: ModuleStatus = ModuleStatus.INACTIVE
  private currentSession: ModuleSession | null = null
  private configuration: ModuleConfiguration = {
    difficulty: ModuleDifficulty.BEGINNER,
    sessionDuration: 20,
    enableHints: true,
    enableAudio: true,
    customSettings: {}
  }

  constructor() {
    this.progressionService = new ProgressionService()
  }

  async initialize(config?: Partial<ModuleConfiguration>): Promise<void> {
    try {
      this.status = ModuleStatus.LOADING
      
      if (config) {
        this.configuration = { ...this.configuration, ...config }
      }

      // Initialize progression service
      // In a real implementation, this might load saved progress
      this.status = ModuleStatus.READY
    } catch (error) {
      this.status = ModuleStatus.ERROR
      console.error('Failed to initialize Guided Journey module:', error)
      throw error
    }
  }

  async start(session: ModuleSession): Promise<void> {
    if (this.status !== ModuleStatus.READY) {
      throw new Error('Module must be initialized before starting')
    }
    
    this.status = ModuleStatus.ACTIVE
    this.currentSession = session
    
    // Load user progress
    const userId = session.userId || 'guest'
    const progress = await this.progressionService.loadUserProgress(userId)
    
    // Store progress for access by components
    // TODO: Need a way to pass this data to components
  }

  pause(): void {
    // Save current progress state
    console.log('Pausing Guided Journey module')
  }

  resume(): void {
    if (this.status === ModuleStatus.ACTIVE) {
      console.log('Resuming Guided Journey module')
    }
  }

  async end(): Promise<ModuleAnalytics> {
    // Save final progress
    this.status = ModuleStatus.READY
    console.log('Ending Guided Journey module')
    
    // Return analytics
    return {
      totalSessions: 1,
      avgSessionDuration: this.currentSession ? (Date.now() - this.currentSession.startTime.getTime()) / 1000 / 60 : 0, // in minutes
      completionRate: this.currentSession?.progress || 0,
      errorRate: 0,
      featureUsage: {
        'scenarios_completed': 1
      }
    }
  }

  cleanup(): void {
    // Clean up any resources
    this.status = ModuleStatus.INACTIVE
  }

  // Module-specific methods

  async getStartScreen(): Promise<any> {
    return {
      component: 'GuidedJourneyDashboard',
      props: {
        scenarios: journeyScenarios,
        moduleId: this.id,
        features: this.features
      }
    }
  }

  configure(config: Partial<ModuleConfiguration>): void {
    this.configuration = { ...this.configuration, ...config }
  }

  getConfiguration(): ModuleConfiguration {
    return { ...this.configuration }
  }

  // Helper methods for journey management

  async getUserProgress(userId: string): Promise<JourneyProgress> {
    return this.progressionService.loadUserProgress(userId)
  }

  async getAvailableScenarios(userId: string) {
    return this.progressionService.getAvailableScenarios(userId)
  }

  async completeScenario(userId: string, scenarioId: string, performance: any) {
    return this.progressionService.updateScenarioProgress(userId, scenarioId, performance)
  }

  async getJourneyStats(userId: string) {
    return this.progressionService.getJourneyStats(userId)
  }

  // Get the practice route for a scenario
  getPracticeRoute(scenarioId: string, isAuthenticated: boolean): string {
    const baseRoute = '/practice-v2'
    const scenario = journeyScenarios.find(s => s.id === scenarioId)
    
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    // Map scenario to practice page parameters
    const params = new URLSearchParams({
      scenario: scenarioId,
      npc: scenario.npcName,
      location: scenario.location,
      guided: 'true' // Indicates this is from guided journey
    })

    return `${baseRoute}?${params.toString()}`
  }
}

// Export singleton instance
export const guidedJourneyModule = new GuidedJourneyModule()