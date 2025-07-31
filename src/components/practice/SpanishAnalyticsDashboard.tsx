'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Award } from 'lucide-react'
import { VocabularyProgressBar } from '@/components/spanish-analysis/VocabularyProgressBar'
import { SpanishFeedbackDisplay } from '@/components/spanish-analysis/SpanishFeedbackDisplay'
import type { SessionStats, ComprehensionFeedback } from '@/hooks/useConversationState'
import type { SpanishConversationAnalysis } from '@/lib/spanish-analysis'

interface SpanishAnalyticsDashboardProps {
  scenario: string
  analysis: SpanishConversationAnalysis | null
  sessionStats: SessionStats
  lastFeedback?: ComprehensionFeedback | null
  className?: string
}

export function SpanishAnalyticsDashboard({
  scenario,
  analysis,
  sessionStats,
  lastFeedback,
  className = ''
}: SpanishAnalyticsDashboardProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Real-time Feedback */}
      {lastFeedback && (
        <SpanishFeedbackDisplay feedback={lastFeedback} />
      )}

      {/* Analytics Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Vocabulary Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Vocabulary Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VocabularyProgressBar
              scenario={scenario}
              analysis={analysis}
              sessionStats={sessionStats}
            />
          </CardContent>
        </Card>

        {/* Mexican Expressions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4" />
              Mexican Spanish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sessionStats.mexicanExpressionsUsed}
            </div>
            <div className="text-xs text-gray-600">expressions used</div>
            {analysis?.mexicanExpressions.slice(-3).map((expr, i) => (
              <div key={i} className="text-xs mt-1 text-green-700">
                "{expr}" ✨
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Session Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Exchanges:</span>
                <span className="font-medium">{sessionStats.totalResponses}</span>
              </div>
              <div className="flex justify-between">
                <span>Spanish Words:</span>
                <span className="font-medium">{sessionStats.spanishWordsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-medium">
                  {Math.round(sessionStats.averageConfidence * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}