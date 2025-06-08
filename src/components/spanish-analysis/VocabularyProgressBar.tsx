import { SpanishConversationAnalysis } from '@/lib/spanish-analysis'
import { SessionStats } from '@/hooks/useConversationEngine'
import { Progress } from '@/components/ui/progress'

interface VocabularyProgressBarProps {
  scenario: string
  analysis: SpanishConversationAnalysis | null
  sessionStats: SessionStats
}

export function VocabularyProgressBar({ scenario, analysis, sessionStats }: VocabularyProgressBarProps) {
  const coverage = sessionStats.essentialVocabCoverage * 100
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 50) return 'bg-blue-500'
    if (percentage >= 25) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span>Essential Vocab</span>
        <span className="font-medium">{Math.round(coverage)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getProgressColor(coverage)}`}
          style={{ width: `${coverage}%` }}
        />
      </div>
      
      {analysis && analysis.sessionMetrics && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Total Words:</span>
            <span className="font-medium">{analysis.sessionMetrics.totalSpanishWords}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Unique Words:</span>
            <span className="font-medium">{analysis.sessionMetrics.uniqueSpanishWords}</span>
          </div>
          {analysis.sessionMetrics.grammarAccuracy > 0 && (
            <div className="flex justify-between text-xs">
              <span>Grammar:</span>
              <span className="font-medium">
                {Math.round((1 - analysis.sessionMetrics.grammarErrorRate) * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}