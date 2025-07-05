import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SpanishConversationAnalysis } from '@/lib/spanish-analysis'
import { SessionStats } from '@/hooks/useConversationEngine'
import { Trophy, TrendingUp, Award, Target, Clock } from 'lucide-react'
import { safeFormatTime } from '@/lib/utils'

interface SessionSummaryWithAnalysisProps {
  analysis: SpanishConversationAnalysis | null
  sessionStats: SessionStats
  duration: number
  onClose: () => void
}

export function SessionSummaryWithAnalysis({ 
  analysis, 
  sessionStats, 
  duration, 
  onClose 
}: SessionSummaryWithAnalysisProps) {
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
        <Card className={`border-2 ${sessionStats.essentialVocabCoverage >= 0.25 ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
          <CardContent className="p-6 text-center">
            <Target className={`w-12 h-12 mx-auto mb-3 ${sessionStats.essentialVocabCoverage >= 0.25 ? 'text-green-500' : 'text-yellow-500'}`} />
            <div className="text-4xl font-bold mb-2">
              {Math.round(sessionStats.essentialVocabCoverage * 100)}%
            </div>
            <div className="text-lg font-medium mb-2">Essential Vocabulary Coverage</div>
            <div className={`text-sm font-medium ${sessionStats.essentialVocabCoverage >= 0.25 ? 'text-green-700' : 'text-yellow-700'}`}>
              {sessionStats.essentialVocabCoverage >= 0.25 
                ? '🎉 Goal Achieved! (Target: 25%+)'
                : `Keep going! (Target: 25%, You: ${Math.round(sessionStats.essentialVocabCoverage * 100)}%)`
              }
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
              🎯 VOCABULARY COVERAGE: {Math.round(sessionStats.essentialVocabCoverage * 100)}% (Target: 25%)
              {sessionStats.essentialVocabCoverage >= 0.25 ? ' ✅ GOAL ACHIEVED!' : ' ⏳ Keep practicing!'}
              <br />
              ⏱️  PRACTICE TIME: {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')} minutes
              <br />
              🗣️  SPANISH WORDS: {sessionStats.spanishWordsUsed}
              <br />
              🇲🇽 MEXICAN EXPRESSIONS: {sessionStats.mexicanExpressionsUsed}
              <br />
              📊 SUCCESS RATE: {sessionStats.totalResponses > 0 ? Math.round((sessionStats.goodResponses / sessionStats.totalResponses) * 100) : 0}%
              <br />
              💪 CONFIDENCE: {Math.round(sessionStats.averageConfidence * 100)}%
              <br />
              🔥 STREAK: {sessionStats.streakCount}
              {analysis && analysis.wordsUsed.length > 0 && (
                <>
                  <br />
                  <br />
                  📝 WORDS USED: {analysis.wordsUsed.map(w => w.word).join(', ')}
                </>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              💡 Tip: You can select and copy this summary to share your progress!
            </p>
          </CardContent>
        </Card>

        {/* Secondary Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</div>
              <div className="text-sm text-gray-600">Practice Time</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{sessionStats.spanishWordsUsed}</div>
              <div className="text-sm text-gray-600">Spanish Words Used</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{sessionStats.mexicanExpressionsUsed}</div>
              <div className="text-sm text-gray-600">Mexican Expressions</div>
            </CardContent>
          </Card>
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
              
              {/* Words Used */}
              {analysis.wordsUsed.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Spanish Words You Used:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.wordsUsed.map((word, i) => (
                      <span 
                        key={i} 
                        className={`px-3 py-1 rounded-full text-sm ${
                          word.isMexicanSpecific 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {word.word}
                        {word.isMexicanSpecific && ' 🇲🇽'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cultural Achievements */}
              {analysis.culturalMarkers.length > 0 && (
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
              )}

              {/* Areas for Practice */}
              {analysis.strugglesDetected.length > 0 && (
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
              )}

            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {analysis && analysis.recommendedFocus.length > 0 && (
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
        )}

        {/* Action Button */}
        <div className="text-center">
          <Button size="lg" onClick={onClose}>
            Continue Learning
          </Button>
        </div>

      </div>
    </div>
  )
}