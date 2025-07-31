/**
 * SessionStats Component
 * 
 * Displays live session statistics including exchanges, success rate,
 * streaks, and improvement trends. Shows different layouts for authenticated
 * and guest modes.
 */

import { memo, useMemo } from 'react'
import { SessionStats } from '@/hooks/useConversationState'

interface SessionStatsProps {
  sessionStats: SessionStats;
  compact?: boolean;
}

export const SessionStatsDisplay = memo(function SessionStatsDisplay({ 
  sessionStats, 
  compact = false 
}: SessionStatsProps) {
  // Memoize calculations to prevent unnecessary recalculations
  const successRate = useMemo(() => 
    Math.round((sessionStats.goodResponses / sessionStats.totalResponses) * 100), 
    [sessionStats.goodResponses, sessionStats.totalResponses]
  );

  const confidencePercentage = useMemo(() => 
    Math.round(sessionStats.averageConfidence * 100), 
    [sessionStats.averageConfidence]
  );

  const confidenceStyle = useMemo(() => ({
    className: sessionStats.averageConfidence > 0.7 ? 'text-green-600' :
               sessionStats.averageConfidence > 0.5 ? 'text-yellow-600' :
               'text-orange-600',
    barClassName: sessionStats.averageConfidence > 0.7 ? 'bg-green-500' :
                  sessionStats.averageConfidence > 0.5 ? 'bg-yellow-500' :
                  'bg-orange-500',
    width: `${sessionStats.averageConfidence * 100}%`
  }), [sessionStats.averageConfidence]);

  const improvementTrendContent = useMemo(() => {
    if (sessionStats.improvementTrend === 'neutral') return null;
    
    return {
      className: sessionStats.improvementTrend === 'improving' ? 'text-green-600' : 'text-yellow-600',
      text: sessionStats.improvementTrend === 'improving' ? '📈 Improving!' : '💪 Keep practicing!'
    };
  }, [sessionStats.improvementTrend]);

  if (sessionStats.totalResponses === 0) {
    return null;
  }

  if (compact) {
    // Compact version for voice control cards
    return (
      <div className="p-2 bg-gray-50 rounded">
        <div className="text-xs font-medium mb-2">📊 Live Session Stats</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-blue-600">{sessionStats.totalResponses}</div>
            <div className="text-gray-600">Exchanges</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">{successRate}%</div>
            <div className="text-gray-600">Success</div>
          </div>
        </div>
        {sessionStats.streakCount > 2 && (
          <div className="text-xs text-green-600 mt-1 font-medium text-center">
            🔥 {sessionStats.streakCount} streak!
          </div>
        )}
        {improvementTrendContent && (
          <div className={`text-xs mt-1 font-medium text-center ${improvementTrendContent.className}`}>
            {improvementTrendContent.text}
          </div>
        )}
      </div>
    );
  }

  // Full version for conversation cards
  return (
    <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          🗣️ Conversation Quality
        </div>
        <div className={`text-sm font-bold ${confidenceStyle.className}`}>
          {confidencePercentage}%
        </div>
      </div>
      <div className="mt-1 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${confidenceStyle.barClassName}`}
          style={{ width: confidenceStyle.width }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{sessionStats.goodResponses} good</span>
        <span>{sessionStats.strugglingResponses} need practice</span>
      </div>
    </div>
  );
})