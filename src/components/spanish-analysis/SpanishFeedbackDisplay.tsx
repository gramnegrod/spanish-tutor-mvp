import { ComprehensionFeedback } from '@/hooks/useConversationState'
import { Card, CardContent } from '@/components/ui/card'
import { Award, TrendingUp, MessageCircle } from 'lucide-react'

interface SpanishFeedbackDisplayProps {
  feedback: ComprehensionFeedback
}

export function SpanishFeedbackDisplay({ feedback }: SpanishFeedbackDisplayProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 border-green-300 text-green-800'
      case 'good': return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'struggling': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'confused': return 'bg-red-100 border-red-300 text-red-800'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const hasSpanishContent = (feedback.spanishWords?.length || 0) > 0 || 
                           (feedback.mexicanExpressions?.length || 0) > 0

  return (
    <Card className={`mb-4 border-2 ${getLevelColor(feedback.level)} animate-in slide-in-from-bottom duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {feedback.level === 'excellent' && <Award className="w-5 h-5" />}
            {feedback.level === 'good' && <TrendingUp className="w-5 h-5" />}
            {(feedback.level === 'struggling' || feedback.level === 'confused') && 
              <MessageCircle className="w-5 h-5" />}
          </div>
          
          <div className="flex-1">
            <p className="font-medium">{feedback.message}</p>
            
            {hasSpanishContent && (
              <div className="mt-2 space-y-2">
                {feedback.spanishWords && feedback.spanishWords.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">Spanish words:</span>
                    {feedback.spanishWords.map((word, i) => (
                      <span key={i} className="px-2 py-1 bg-white/50 rounded text-xs">
                        {word}
                      </span>
                    ))}
                  </div>
                )}
                
                {feedback.mexicanExpressions && feedback.mexicanExpressions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">🇲🇽 Mexican:</span>
                    {feedback.mexicanExpressions.map((expr, i) => (
                      <span key={i} className="px-2 py-1 bg-green-600/20 rounded text-xs font-medium">
                        {expr}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {feedback.culturalNotes && feedback.culturalNotes.length > 0 && (
              <div className="mt-2 text-xs space-y-1">
                {feedback.culturalNotes.map((note, i) => (
                  <p key={i} className="italic">{note}</p>
                ))}
              </div>
            )}
            
            <div className="mt-2 text-xs opacity-75">
              Confidence: {Math.round(feedback.confidence * 100)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}