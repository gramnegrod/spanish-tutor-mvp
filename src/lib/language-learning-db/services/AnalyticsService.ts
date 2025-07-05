/**
 * Analytics Service
 * 
 * Handles learning analytics and session metrics
 */

import type {
  StorageAdapter,
  LearningSession,
  SessionMetrics,
  ProgressQuery
} from '../types'

export class AnalyticsService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Save learning session
   */
  async saveSession(session: LearningSession): Promise<LearningSession> {
    return this.adapter.saveSession(session)
  }

  /**
   * Get session metrics for analysis
   */
  async getMetrics(query: ProgressQuery): Promise<SessionMetrics[]> {
    return this.adapter.getSessionMetrics(query)
  }

  /**
   * Create session from conversation data
   */
  async createSessionFromConversation(
    userId: string,
    conversationId: string,
    duration: number,
    language: string,
    scenario?: string,
    customMetrics?: Partial<SessionMetrics>
  ): Promise<LearningSession> {
    const session: LearningSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      conversationId,
      type: 'conversation',
      duration,
      language,
      scenario,
      metricsCollected: {
        wordsSpoken: 0,
        averageConfidence: 0,
        mistakeCount: 0,
        helpRequests: 0,
        completionRate: 1.0,
        engagementScore: 0.8,
        ...customMetrics
      },
      startedAt: new Date(Date.now() - duration * 1000).toISOString(),
      completedAt: new Date().toISOString()
    }

    return this.saveSession(session)
  }

  /**
   * Get user analytics summary
   */
  async getUserAnalytics(
    userId: string,
    language?: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    totalSessions: number
    totalDuration: number
    averageSessionLength: number
    averageConfidence: number
    improvementTrend: 'improving' | 'stable' | 'declining'
    strongAreas: string[]
    weakAreas: string[]
  }> {
    const metrics = await this.getMetrics({
      userId,
      language,
      timeframe
    })

    if (metrics.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageSessionLength: 0,
        averageConfidence: 0,
        improvementTrend: 'stable',
        strongAreas: [],
        weakAreas: []
      }
    }

    const totalSessions = metrics.length
    const totalDuration = metrics.reduce((sum, m) => sum + (m.sessionDuration || 0), 0)
    const averageSessionLength = totalDuration / totalSessions
    const averageConfidence = metrics.reduce((sum, m) => sum + m.averageConfidence, 0) / totalSessions

    // Analyze trend (compare first half vs second half)
    const midpoint = Math.floor(metrics.length / 2)
    const firstHalf = metrics.slice(0, midpoint)
    const secondHalf = metrics.slice(midpoint)

    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.averageConfidence, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.averageConfidence, 0) / secondHalf.length

    let improvementTrend: 'improving' | 'stable' | 'declining'
    const confidenceDiff = secondHalfAvg - firstHalfAvg
    if (confidenceDiff > 0.1) {
      improvementTrend = 'improving'
    } else if (confidenceDiff < -0.1) {
      improvementTrend = 'declining'
    } else {
      improvementTrend = 'stable'
    }

    // Analyze strong/weak areas (simplified)
    const strongAreas = ['vocabulary'] // Placeholder - would analyze specific skills
    const weakAreas = ['pronunciation'] // Placeholder - would analyze error patterns

    return {
      totalSessions,
      totalDuration,
      averageSessionLength,
      averageConfidence,
      improvementTrend,
      strongAreas,
      weakAreas
    }
  }

  /**
   * Get learning insights
   */
  async getLearningInsights(
    userId: string,
    language: string
  ): Promise<{
    mostPracticedScenarios: Array<{ scenario: string; count: number }>
    peakPerformanceTime: string
    averageSessionQuality: number
    recommendedNextSteps: string[]
  }> {
    const metrics = await this.getMetrics({
      userId,
      language,
      timeframe: 'month'
    })

    // Count scenarios (simplified - would need actual scenario data)
    const scenarioCounts: Record<string, number> = {}
    const mostPracticedScenarios = Object.entries(scenarioCounts)
      .map(([scenario, count]) => ({ scenario, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Analyze performance by time (placeholder)
    const peakPerformanceTime = '10:00 AM' // Would analyze actual session times

    const averageSessionQuality = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.engagementScore, 0) / metrics.length
      : 0

    const recommendedNextSteps = [
      'Practice more advanced vocabulary',
      'Focus on pronunciation exercises',
      'Try new conversation scenarios'
    ]

    return {
      mostPracticedScenarios,
      peakPerformanceTime,
      averageSessionQuality,
      recommendedNextSteps
    }
  }

  /**
   * Track custom metric
   */
  async trackCustomMetric(
    sessionId: string,
    metricName: string,
    value: number | string | boolean
  ): Promise<void> {
    // Implementation would depend on adapter capabilities
    console.log(`Tracking custom metric: ${metricName} = ${value} for session ${sessionId}`)
  }

  /**
   * Generate learning report
   */
  async generateReport(
    userId: string,
    language: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    summary: string
    achievements: string[]
    goals: string[]
    recommendations: string[]
  }> {
    const analytics = await this.getUserAnalytics(userId, language, timeframe)
    const insights = await this.getLearningInsights(userId, language)

    const summary = `In the past ${timeframe}, you completed ${analytics.totalSessions} sessions with an average confidence of ${Math.round(analytics.averageConfidence * 100)}%. Your performance is ${analytics.improvementTrend}.`

    const achievements = []
    if (analytics.totalSessions >= 20) {
      achievements.push('Consistent Learner - 20+ sessions completed')
    }
    if (analytics.averageConfidence >= 0.8) {
      achievements.push('High Confidence - Averaging 80%+ confidence')
    }

    const goals = [
      'Maintain daily practice streak',
      'Improve weak areas: ' + analytics.weakAreas.join(', '),
      'Try advanced conversation scenarios'
    ]

    const recommendations = insights.recommendedNextSteps

    return {
      summary,
      achievements,
      goals,
      recommendations
    }
  }
}