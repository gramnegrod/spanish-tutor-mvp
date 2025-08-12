/**
 * useSessionAnalytics Hook
 * 
 * Provides a clean interface for session analytics and tracking.
 * Works with useConversationState to provide focused analytics functionality.
 */

import { useCallback, useMemo } from 'react'
import { SessionStats, ComprehensionFeedback } from './useConversationState'
import { SpanishConversationAnalysis } from '@/lib/spanish-analysis'

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface SessionAnalyticsOptions {
  sessionStats: SessionStats;
  lastFeedback: ComprehensionFeedback | null;
  getAnalysis: () => SpanishConversationAnalysis | null;
  onEvent?: (event: AnalyticsEvent) => void;
}

export interface UseSessionAnalyticsReturn {
  sessionStats: SessionStats;
  lastFeedback: ComprehensionFeedback | null;
  trackEvent: (event: string, properties?: Record<string, any>) => void;
  getAnalysis: () => SpanishConversationAnalysis | null;
}

export function useSessionAnalytics(options: SessionAnalyticsOptions): UseSessionAnalyticsReturn {
  const { sessionStats, lastFeedback, getAnalysis, onEvent } = options;

  // Track analytics events
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionStats: {
          totalResponses: sessionStats.totalResponses,
          averageConfidence: sessionStats.averageConfidence,
          improvementTrend: sessionStats.improvementTrend,
          spanishWordsUsed: sessionStats.spanishWordsUsed,
          mexicanExpressionsUsed: sessionStats.mexicanExpressionsUsed
        }
      },
      timestamp: new Date()
    };

    console.log('[SessionAnalytics] Event tracked:', analyticsEvent);
    
    if (onEvent) {
      onEvent(analyticsEvent);
    }
  }, [sessionStats, onEvent]);

  // Enhanced analytics with computed insights
  const enhancedSessionStats = useMemo(() => ({
    ...sessionStats,
    // Computed metrics
    successRate: sessionStats.totalResponses > 0 
      ? sessionStats.goodResponses / sessionStats.totalResponses 
      : 0,
    vocabularyDiversity: sessionStats.spanishWordsUsed + sessionStats.mexicanExpressionsUsed,
    culturalEngagement: sessionStats.mexicanExpressionsUsed / Math.max(sessionStats.totalResponses, 1),
    isImproving: sessionStats.improvementTrend === 'improving'
  }), [sessionStats]);

  return {
    sessionStats: enhancedSessionStats,
    lastFeedback,
    trackEvent,
    getAnalysis
  };
}