import { ModuleProgressTracker } from '@/lib/modules/core/ModuleProgressTracker';
import { 
  journeyConfig, 
  type JourneyScenario, 
  type ScenarioPerformance,
  type JourneyProgress,
  type JourneyStatistics,
  type DifficultySettings,
  type SupportLevel,
  type ConversationMetrics
} from '../journey-config';

export class ProgressionService {
  private progressTracker: ModuleProgressTracker;
  private readonly STORAGE_KEY = 'guided_journey_progress';
  private readonly STREAK_KEY = 'guided_journey_streak';

  constructor() {
    this.progressTracker = new ModuleProgressTracker();
  }

  async loadUserProgress(userId: string): Promise<JourneyProgress> {
    try {
      if (userId === 'guest') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : this.createInitialProgress();
      }

      const progress = await this.progressTracker.getModuleProgress(userId, 'guided-journey');
      return progress?.data || this.createInitialProgress();
    } catch (error) {
      console.error('Error loading progress:', error);
      return this.createInitialProgress();
    }
  }

  async saveProgress(userId: string, progress: JourneyProgress): Promise<void> {
    try {
      if (userId === 'guest') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
        return;
      }

      await this.progressTracker.updateProgress(userId, 'guided-journey', {
        data: progress,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      throw new Error('Failed to save progress');
    }
  }

  async updateScenarioProgress(
    userId: string, 
    scenarioId: string, 
    performance: ScenarioPerformance
  ): Promise<void> {
    const progress = await this.loadUserProgress(userId);
    
    progress.completedScenarios[scenarioId] = {
      completedAt: new Date().toISOString(),
      performance,
      attempts: (progress.completedScenarios[scenarioId]?.attempts || 0) + 1
    };

    progress.lastActivityDate = new Date().toISOString();
    progress.totalConversations++;

    // Update streak
    await this.updateStreakData(userId);

    // Check for achievements
    this.checkAchievements(progress, performance);

    await this.saveProgress(userId, progress);
  }

  async checkScenarioUnlock(userId: string, scenarioId: string): Promise<boolean> {
    const progress = await this.loadUserProgress(userId);
    const scenario = this.findScenario(scenarioId);
    
    if (!scenario) return false;

    // First scenario is always unlocked
    if (scenario.order === 1) return true;

    // Check prerequisites
    if (scenario.prerequisites.length === 0) return true;

    return scenario.prerequisites.every(prereqId => {
      const completion = progress.completedScenarios[prereqId];
      return completion && completion.performance.score >= 70;
    });
  }

  async unlockNextScenario(userId: string, completedScenarioId: string): Promise<string | null> {
    const progress = await this.loadUserProgress(userId);
    const completedScenario = this.findScenario(completedScenarioId);
    
    if (!completedScenario) return null;

    // Find scenarios that have this as prerequisite
    const nextScenarios = journeyConfig.categories
      .flatMap(cat => cat.scenarios)
      .filter(scenario => 
        scenario.prerequisites.includes(completedScenarioId) &&
        !progress.completedScenarios[scenario.id]
      )
      .sort((a, b) => a.order - b.order);

    if (nextScenarios.length > 0) {
      const nextId = nextScenarios[0].id;
      progress.unlockedScenarios.push(nextId);
      await this.saveProgress(userId, progress);
      return nextId;
    }

    return null;
  }

  async getAvailableScenarios(userId: string): Promise<JourneyScenario[]> {
    const progress = await this.loadUserProgress(userId);
    const allScenarios = journeyConfig.categories.flatMap(cat => cat.scenarios);

    return allScenarios.filter(scenario => 
      this.isScenarioAvailable(scenario, progress)
    );
  }

  calculatePerformanceScore(metrics: ConversationMetrics): ScenarioPerformance {
    const fluencyScore = this.calculateFluencyScore(metrics);
    const accuracyScore = this.calculateAccuracyScore(metrics);
    const engagementScore = this.calculateEngagementScore(metrics);

    const overallScore = Math.round(
      (fluencyScore * 0.4) + (accuracyScore * 0.4) + (engagementScore * 0.2)
    );

    return {
      score: overallScore,
      fluency: fluencyScore,
      accuracy: accuracyScore,
      engagement: engagementScore,
      duration: metrics.duration,
      mistakes: metrics.mistakes || 0
    };
  }

  async updateStreakData(userId: string): Promise<void> {
    try {
      const streakKey = userId === 'guest' ? this.STREAK_KEY : `${this.STREAK_KEY}_${userId}`;
      const today = new Date().toDateString();
      
      const streakData = this.getStreakData(streakKey);
      const lastActivity = new Date(streakData.lastActivityDate).toDateString();

      if (lastActivity === today) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActivity === yesterday.toDateString()) {
        streakData.currentStreak++;
      } else {
        streakData.currentStreak = 1;
      }

      streakData.longestStreak = Math.max(streakData.currentStreak, streakData.longestStreak);
      streakData.lastActivityDate = today;

      localStorage.setItem(streakKey, JSON.stringify(streakData));
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }

  async getJourneyStats(userId: string): Promise<JourneyStatistics> {
    const progress = await this.loadUserProgress(userId);
    const streakData = this.getStreakData(
      userId === 'guest' ? this.STREAK_KEY : `${this.STREAK_KEY}_${userId}`
    );

    const completedCount = Object.keys(progress.completedScenarios).length;
    const totalScenarios = journeyConfig.categories
      .reduce((sum, cat) => sum + cat.scenarios.length, 0);

    const avgScore = this.calculateAverageScore(progress);
    const totalTime = this.calculateTotalTime(progress);

    return {
      totalScenarios,
      completedScenarios: completedCount,
      averageScore: avgScore,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      totalConversations: progress.totalConversations,
      totalTimeSpent: totalTime,
      achievements: progress.achievements
    };
  }

  adjustDifficulty(scenarioId: string, userPerformance: ScenarioPerformance): DifficultySettings {
    const baseSettings = this.getBaseDifficultySettings(scenarioId);
    
    if (userPerformance.score >= 90) {
      return {
        speechSpeed: Math.min(baseSettings.speechSpeed + 0.1, 1.2),
        supportLevel: 'minimal' as SupportLevel,
        hintsEnabled: false
      };
    } else if (userPerformance.score >= 70) {
      return baseSettings;
    } else {
      return {
        speechSpeed: Math.max(baseSettings.speechSpeed - 0.1, 0.6),
        supportLevel: 'full' as SupportLevel,
        hintsEnabled: true
      };
    }
  }

  getSpeechSpeed(level: number): number {
    const speeds = [0.6, 0.7, 0.8, 0.9, 1.0];
    return speeds[Math.min(level - 1, speeds.length - 1)];
  }

  getSupportLevel(level: number): SupportLevel {
    if (level <= 2) return 'full';
    if (level <= 4) return 'moderate';
    return 'minimal';
  }

  // Private helper methods
  private createInitialProgress(): JourneyProgress {
    return {
      userId: '',
      currentScenarioId: journeyConfig.categories[0].scenarios[0].id,
      completedScenarios: {},
      unlockedScenarios: [journeyConfig.categories[0].scenarios[0].id],
      achievements: [],
      totalConversations: 0,
      lastActivityDate: new Date().toISOString()
    };
  }

  private findScenario(scenarioId: string): JourneyScenario | undefined {
    return journeyConfig.categories
      .flatMap(cat => cat.scenarios)
      .find(s => s.id === scenarioId);
  }

  private isScenarioAvailable(scenario: JourneyScenario, progress: JourneyProgress): boolean {
    if (scenario.order === 1) return true;
    if (progress.unlockedScenarios.includes(scenario.id)) return true;
    
    return scenario.prerequisites.every(prereqId => {
      const completion = progress.completedScenarios[prereqId];
      return completion && completion.performance.score >= 70;
    });
  }

  private calculateFluencyScore(metrics: ConversationMetrics): number {
    const responseTimeScore = Math.max(0, 100 - (metrics.avgResponseTime || 0) * 10);
    const flowScore = metrics.conversationFlow || 70;
    return Math.round((responseTimeScore + flowScore) / 2);
  }

  private calculateAccuracyScore(metrics: ConversationMetrics): number {
    const mistakesPenalty = (metrics.mistakes || 0) * 5;
    return Math.max(0, 100 - mistakesPenalty);
  }

  private calculateEngagementScore(metrics: ConversationMetrics): number {
    const turnScore = Math.min(100, (metrics.totalTurns || 0) * 10);
    const durationScore = Math.min(100, (metrics.duration / 60) * 20);
    return Math.round((turnScore + durationScore) / 2);
  }

  private getStreakData(key: string): any {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: ''
    };
  }

  private calculateAverageScore(progress: JourneyProgress): number {
    const scores = Object.values(progress.completedScenarios)
      .map(c => c.performance.score);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  private calculateTotalTime(progress: JourneyProgress): number {
    return Object.values(progress.completedScenarios)
      .reduce((total, c) => total + c.performance.duration, 0);
  }

  private getBaseDifficultySettings(scenarioId: string): DifficultySettings {
    const scenario = this.findScenario(scenarioId);
    const level = scenario?.difficulty || 1;
    
    return {
      speechSpeed: this.getSpeechSpeed(level),
      supportLevel: this.getSupportLevel(level),
      hintsEnabled: level <= 3
    };
  }

  private checkAchievements(progress: JourneyProgress, performance: ScenarioPerformance): void {
    if (performance.score === 100 && !progress.achievements.includes('perfect_score')) {
      progress.achievements.push('perfect_score');
    }
    
    if (Object.keys(progress.completedScenarios).length === 5 && 
        !progress.achievements.includes('first_five')) {
      progress.achievements.push('first_five');
    }
  }
}