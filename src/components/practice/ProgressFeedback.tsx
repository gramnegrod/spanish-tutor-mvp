/**
 * ProgressFeedback Component
 * 
 * Displays real-time comprehension feedback and adaptation notifications
 * during practice sessions. Shows color-coded confidence levels and 
 * mode switching notifications.
 */

import { ComprehensionFeedback } from '@/hooks/useConversationEngine'
import { AdaptationNotification } from '@/hooks/usePracticeAdaptation'

interface ProgressFeedbackProps {
  lastComprehensionFeedback: ComprehensionFeedback | null;
  showAdaptationNotification: AdaptationNotification | null;
}

export function ProgressFeedback({ 
  lastComprehensionFeedback, 
  showAdaptationNotification 
}: ProgressFeedbackProps) {
  return (
    <>
      {/* Real-time Comprehension Feedback */}
      {lastComprehensionFeedback && (
        <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
          lastComprehensionFeedback.level === 'excellent' ? 'bg-green-50 border-green-200 text-green-800' :
          lastComprehensionFeedback.level === 'good' ? 'bg-blue-50 border-blue-200 text-blue-800' :
          lastComprehensionFeedback.level === 'struggling' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          'bg-orange-50 border-orange-200 text-orange-800'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              lastComprehensionFeedback.level === 'excellent' ? 'bg-green-500' :
              lastComprehensionFeedback.level === 'good' ? 'bg-blue-500' :
              lastComprehensionFeedback.level === 'struggling' ? 'bg-yellow-500' :
              'bg-orange-500'
            }`} />
            <span className="text-sm font-medium">{lastComprehensionFeedback.message}</span>
          </div>
          <div className="mt-1 text-xs opacity-75">
            Confidence: {Math.round(lastComprehensionFeedback.confidence * 100)}%
          </div>
        </div>
      )}
      
      {/* Adaptation Notifications */}
      {showAdaptationNotification && (
        <div className={`p-3 rounded-lg border-2 transition-all duration-500 animate-pulse ${
          showAdaptationNotification.type === 'switched_to_helper' ? 'bg-blue-50 border-blue-300 text-blue-800' :
          showAdaptationNotification.type === 'switched_to_immersion' ? 'bg-purple-50 border-purple-300 text-purple-800' :
          showAdaptationNotification.type === 'building_confidence' ? 'bg-green-50 border-green-300 text-green-800' :
          'bg-yellow-50 border-yellow-300 text-yellow-800'
        }`}>
          <div className="flex items-center gap-2">
            <div className="text-lg">
              {showAdaptationNotification.type === 'switched_to_helper' ? '🤝' :
               showAdaptationNotification.type === 'switched_to_immersion' ? '🚀' :
               showAdaptationNotification.type === 'building_confidence' ? '📈' : '💪'}
            </div>
            <span className="text-sm font-medium">{showAdaptationNotification.message}</span>
          </div>
        </div>
      )}
    </>
  );
}