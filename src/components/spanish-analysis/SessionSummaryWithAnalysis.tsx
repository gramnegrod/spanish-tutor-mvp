import { memo, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SpanishConversationAnalysis } from '@/lib/spanish-analysis'
import { SessionStats } from '@/hooks/useConversationState'
import { Trophy, TrendingUp, Award, Target, Clock } from 'lucide-react'

interface SessionSummaryWithAnalysisProps {
  analysis: SpanishConversationAnalysis | null
  sessionStats: SessionStats
  duration: number
  onClose: () => void
}

// Memoized word badge component
const WordBadge = memo(({ word, isMexicanSpecific }: { 
  word: string
  isMexicanSpecific?: boolean 
}) => (
  <span 
    className={`px-3 py-1 rounded-full text-sm ${
      isMexicanSpecific 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-blue-100 text-blue-800 border border-blue-200'
    }`}
  >
    {word}
    {isMexicanSpecific && ' 🇲🇽'}
  </span>
))

WordBadge.displayName = 'WordBadge'

// Memoized metric card component
const MetricCard = memo(({ 
  icon: Icon, 
  value, 
  label, 
  iconColor 
}: { 
  icon: React.ComponentType<{ className?: string }>
  value: string
  label: string
  iconColor: string
}) => (
  <Card>
    <CardContent className="p-4 text-center">
      <Icon className={`w-8 h-8 ${iconColor} mx-auto mb-2`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </CardContent>
  </Card>
))

MetricCard.displayName = 'MetricCard'

export const SessionSummaryWithAnalysis = memo(function SessionSummaryWithAnalysis({ 
  analysis, 
  sessionStats, 
  duration, 
  onClose 
}: SessionSummaryWithAnalysisProps) {
  // Memoize expensive calculations
  const vocabularyCoverage = useMemo(() => 
    Math.round(sessionStats.essentialVocabCoverage * 100), 
    [sessionStats.essentialVocabCoverage]
  )

  const isGoalAchieved = useMemo(() => 
    sessionStats.essentialVocabCoverage >= 0.25, 
    [sessionStats.essentialVocabCoverage]
  )

  const formattedDuration = useMemo(() => 
    `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`, 
    [duration]
  )

  const successRate = useMemo(() => 
    sessionStats.totalResponses > 0 
      ? Math.round((sessionStats.goodResponses / sessionStats.totalResponses) * 100) 
      : 0, 
    [sessionStats.goodResponses, sessionStats.totalResponses]
  )

  const confidencePercentage = useMemo(() => 
    Math.round(sessionStats.averageConfidence * 100), 
    [sessionStats.averageConfidence]
  )

  // Memoize vocabulary achievement card styles
  const vocabularyCardStyle = useMemo(() => ({
    cardClass: `border-2 ${isGoalAchieved ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`,
    iconClass: `w-12 h-12 mx-auto mb-3 ${isGoalAchieved ? 'text-green-500' : 'text-yellow-500'}`,
    statusClass: `text-sm font-medium ${isGoalAchieved ? 'text-green-700' : 'text-yellow-700'}`,
    statusText: isGoalAchieved 
      ? '🎉 Goal Achieved! (Target: 25%+)'
      : `Keep going! (Target: 25%, You: ${vocabularyCoverage}%)`
  }), [isGoalAchieved, vocabularyCoverage])

  // Memoize copy-friendly summary text
  const summaryText = useMemo(() => {
    const wordsUsedText = analysis && analysis.wordsUsed.length > 0 
      ? `\n\n📝 WORDS USED: ${analysis.wordsUsed.map(w => w.word).join(', ')}` 
      : ''
    
    return `🎯 VOCABULARY COVERAGE: ${vocabularyCoverage}% (Target: 25%)${isGoalAchieved ? ' ✅ GOAL ACHIEVED!' : ' ⏳ Keep practicing!'}\n⏱️  PRACTICE TIME: ${formattedDuration} minutes\n🗣️  SPANISH WORDS: ${sessionStats.spanishWordsUsed}\n🇲🇽 MEXICAN EXPRESSIONS: ${sessionStats.mexicanExpressionsUsed}\n📊 SUCCESS RATE: ${successRate}%\n💪 CONFIDENCE: ${confidencePercentage}%\n🔥 STREAK: ${sessionStats.streakCount}${wordsUsedText}`
  }, [vocabularyCoverage, isGoalAchieved, formattedDuration, sessionStats, successRate, confidencePercentage, analysis])

  // Memoize words used section
  const wordsUsedSection = useMemo(() => {
    if (!analysis || analysis.wordsUsed.length === 0) return null
    
    return (
      <div>
        <h4 className="font-medium mb-2">Spanish Words You Used:</h4>
        <div className="flex flex-wrap gap-2">
          {analysis.wordsUsed.map((word, i) => (
            <WordBadge 
              key={i} 
              word={word.word} 
              isMexicanSpecific={word.isMexicanSpecific} 
            />
          ))}
        </div>
      </div>
    )
  }, [analysis])

  // Memoize cultural achievements section
  const culturalAchievementsSection = useMemo(() => {
    if (!analysis || analysis.culturalMarkers.length === 0) return null
    
    return (
      <div>
        <h4 className="font-medium mb-2">Cultural Achievements:</h4>
        <div className="space-y-2">
          {analysis.culturalMarkers.slice(0, 3).map((marker, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div className="text-sm">
                Used "{marker.expression}" - {marker.type.replace('_', ' ')}
                {marker.explanation && (
                  <p className="text-xs text-gray-600 mt-1">{marker.explanation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }, [analysis])

  // Memoize practice areas section
  const practiceAreasSection = useMemo(() => {
    if (!analysis || analysis.strugglesDetected.length === 0) return null
    
    return (
      <div>
        <h4 className="font-medium mb-2">Areas to Practice:</h4>
        <div className="space-y-1">
          {analysis.strugglesDetected.slice(0, 3).map((struggle, i) => (
            <div key={i} className="text-sm text-gray-700">
              • {struggle.suggestions[0]}
            </div>
          ))}
        </div>
      </div>
    )
  }, [analysis])

  // Memoize recommendations section
  const recommendationsSection = useMemo(() => {
    if (!analysis || analysis.recommendedFocus.length === 0) return null
    
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.recommendedFocus.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">{i + 1}.</span>
                <div>
                  <p className="font-medium text-blue-800">{rec.focus}</p>
                  <p className="text-sm text-blue-700">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }, [analysis])

  // Memoize event handler
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">¡Excelente Trabajo!</h1>
          <p className="text-gray-600">Here's your Spanish learning summary</p>
        </div>

        {/* Vocabulary Achievement - Primary Focus */}
        <Card className={vocabularyCardStyle.cardClass}>
          <CardContent className="p-6 text-center">
            <Target className={vocabularyCardStyle.iconClass} />
            <div className="text-4xl font-bold mb-2">
              {vocabularyCoverage}%
            </div>
            <div className="text-lg font-medium mb-2">Essential Vocabulary Coverage</div>
            <div className={vocabularyCardStyle.statusClass}>
              {vocabularyCardStyle.statusText}
            </div>
          </CardContent>
        </Card>

        {/* Copy-Friendly Session Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Session Summary (Copy-Friendly)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded border font-mono text-sm select-all">
              {summaryText}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              💡 Tip: You can select and copy this summary to share your progress!
            </p>
          </CardContent>
        </Card>

        {/* Secondary Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <MetricCard 
            icon={Clock} 
            value={formattedDuration} 
            label="Practice Time" 
            iconColor="text-blue-500" 
          />
          <MetricCard 
            icon={TrendingUp} 
            value={sessionStats.spanishWordsUsed.toString()} 
            label="Spanish Words Used" 
            iconColor="text-green-500" 
          />
          <MetricCard 
            icon={Award} 
            value={sessionStats.mexicanExpressionsUsed.toString()} 
            label="Mexican Expressions" 
            iconColor="text-purple-500" 
          />
        </div>

        {/* Vocabulary Analysis */}
        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Vocabulary Mastery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {wordsUsedSection}
              {culturalAchievementsSection}
              {practiceAreasSection}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendationsSection}

        {/* Action Button */}
        <div className="text-center">
          <Button size="lg" onClick={handleClose}>
            Continue Learning
          </Button>
        </div>

      </div>
    </div>
  )
})