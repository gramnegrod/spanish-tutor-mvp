import {
  LearningModule,
  ModuleDifficulty,
  ModuleFeatures,
  ModuleConfiguration,
  ModuleSession,
  ModuleAnalytics,
  ModuleProgress
} from '../core/types';
import { learningScenarios, getScenarioById } from '@/config/learning-scenarios';
import type { LearningScenario, ConversationRecord } from '@/types/adaptive-learning';

interface FreePracticeConfig extends ModuleConfiguration {
  scenarioId?: string;
  scenarioOrder?: string[];
  trackProgress?: boolean;
}

interface FreePracticeSession extends ModuleSession {
  scenarioId: string;
  scenarioTitle: string;
  conversationId?: string;
}

export class FreePracticeModule implements LearningModule {
  // Basic properties
  readonly id = 'free-practice';
  readonly name = 'Free Practice';
  readonly description = 'Choose any scenario and practice at your own pace';
  readonly icon = '💬';
  
  // Difficulty support - all levels supported
  readonly supportedDifficulties = [
    ModuleDifficulty.ALL,
    ModuleDifficulty.BEGINNER,
    ModuleDifficulty.INTERMEDIATE,
    ModuleDifficulty.ADVANCED
  ];
  readonly defaultDifficulty = ModuleDifficulty.ALL;
  
  // Features
  readonly features: ModuleFeatures = {
    progressive: false,  // User chooses scenarios
    adaptive: true,      // Uses existing adaptation system
    social: false,       // No social features for now
    offline: true        // Supports guest mode
  };
  
  // Private state
  private configuration: FreePracticeConfig = {
    difficulty: ModuleDifficulty.ALL,
    sessionDuration: 10,
    enableHints: true,
    enableAudio: true,
    trackProgress: true,
    customSettings: {}
  };
  
  private currentSession: FreePracticeSession | null = null;
  private sessionStartTime: Date | null = null;
  private completedScenarios: Set<string> = new Set();
  private conversationData: Map<string, ConversationRecord[]> = new Map();
  
  // Lifecycle methods
  async initialize(config: ModuleConfiguration): Promise<void> {
    this.configuration = { ...this.configuration, ...config };
    
    // Load previous progress if available
    if (typeof window !== 'undefined' && this.configuration.trackProgress) {
      const saved = localStorage.getItem('free-practice-progress');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          this.completedScenarios = new Set(data.completedScenarios || []);
        } catch (e) {
          console.error('Failed to load practice progress:', e);
        }
      }
    }
  }
  
  async start(session: ModuleSession): Promise<void> {
    const practiceSession = session as FreePracticeSession;
    
    if (!practiceSession.scenarioId) {
      throw new Error('Scenario ID is required for free practice');
    }
    
    const scenario = getScenarioById(practiceSession.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${practiceSession.scenarioId} not found`);
    }
    
    this.currentSession = {
      ...practiceSession,
      scenarioTitle: scenario.title
    };
    this.sessionStartTime = new Date();
  }
  
  pause(): void {
    // In free practice, pausing is handled by the practice components
    // This is mainly for tracking time
    if (this.currentSession && this.sessionStartTime) {
      const elapsed = Date.now() - this.sessionStartTime.getTime();
      this.currentSession.progress = Math.min(100, (elapsed / (1000 * 60 * 10)) * 100);
    }
  }
  
  resume(): void {
    // Resume tracking
    if (this.currentSession && !this.sessionStartTime) {
      this.sessionStartTime = new Date();
    }
  }
  
  async end(): Promise<ModuleAnalytics> {
    if (!this.currentSession || !this.sessionStartTime) {
      throw new Error('No active session to end');
    }
    
    // Mark scenario as completed
    this.completedScenarios.add(this.currentSession.scenarioId);
    
    // Save progress
    if (this.configuration.trackProgress) {
      this.saveProgress();
    }
    
    // Calculate analytics
    const duration = Date.now() - this.sessionStartTime.getTime();
    const analytics: ModuleAnalytics = {
      totalSessions: this.completedScenarios.size,
      avgSessionDuration: duration / 1000 / 60, // in minutes
      completionRate: this.calculateCompletionRate(),
      errorRate: 0, // Would need integration with conversation analysis
      featureUsage: {
        scenarios_completed: this.completedScenarios.size,
        adaptive_enabled: this.configuration.customSettings?.enableAdaptation ? 1 : 0,
        audio_enabled: this.configuration.enableAudio ? 1 : 0
      }
    };
    
    // Clean up
    this.currentSession = null;
    this.sessionStartTime = null;
    
    return analytics;
  }
  
  // Configuration methods
  configure(config: Partial<FreePracticeConfig>): void {
    this.configuration = { ...this.configuration, ...config };
  }
  
  getConfiguration(): FreePracticeConfig {
    return { ...this.configuration };
  }
  
  // Free Practice specific methods
  getAvailableScenarios(difficulty?: string): LearningScenario[] {
    if (!difficulty || difficulty === ModuleDifficulty.ALL) {
      return learningScenarios;
    }
    
    return learningScenarios.filter(s => s.difficulty === difficulty);
  }
  
  getScenarioProgress(scenarioId: string): number {
    return this.completedScenarios.has(scenarioId) ? 100 : 0;
  }
  
  getOverallProgress(): ModuleProgress {
    const totalScenarios = learningScenarios.length;
    const completed = this.completedScenarios.size;
    
    return {
      userId: 'guest', // Would be replaced with actual user ID
      moduleId: this.id,
      level: this.configuration.difficulty as ModuleDifficulty,
      completedSessions: completed,
      totalTimeSpent: 0, // Would need to track this
      lastAccessed: new Date(),
      achievements: Array.from(this.completedScenarios),
      currentStreak: 0
    };
  }
  
  // Helper methods
  private calculateCompletionRate(): number {
    const total = learningScenarios.length;
    const completed = this.completedScenarios.size;
    return total > 0 ? (completed / total) * 100 : 0;
  }
  
  private saveProgress(): void {
    if (typeof window !== 'undefined') {
      const data = {
        completedScenarios: Array.from(this.completedScenarios),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('free-practice-progress', JSON.stringify(data));
    }
  }
  
  // Integration helpers for React components
  getStartScreen(): any {
    // This would return component props or configuration
    // that the React component can use to render the scenario list
    return {
      scenarios: this.getAvailableScenarios(this.configuration.difficulty as string),
      completedScenarios: Array.from(this.completedScenarios),
      configuration: this.configuration
    };
  }
  
  getPracticeRoute(scenarioId: string, isAuthenticated: boolean): string {
    // Return the appropriate route based on auth status
    return isAuthenticated 
      ? `/practice?scenario=${scenarioId}` 
      : `/practice-no-auth?scenario=${scenarioId}`;
  }
}

// Export a singleton instance
export const freePracticeModule = new FreePracticeModule();