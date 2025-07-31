/**
 * ProgressFeedback Component
 * 
 * Displays real-time comprehension feedback and adaptation notifications
 * during practice sessions. Shows color-coded confidence levels and 
 * mode switching notifications.
 */

import { memo, useMemo } from 'react'
import { ComprehensionFeedback } from '@/hooks/useConversationState'
import { AdaptationNotification } from '@/hooks/usePracticeAdaptation'

interface ProgressFeedbackProps {
  lastComprehensionFeedback: ComprehensionFeedback | null;
  showAdaptationNotification: AdaptationNotification | null;
}

// Memoized comprehension feedback component
const ComprehensionFeedbackDisplay = memo(({ feedback }: { feedback: ComprehensionFeedback }) => {
  const feedbackStyle = useMemo(() => {
    const baseClasses = 'p-3 rounded-lg border-2 transition-all duration-300'
    const levelClasses = {
      excellent: 'bg-green-50 border-green-200 text-green-800',
      good: 'bg-blue-50 border-blue-200 text-blue-800',
      struggling: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      confused: 'bg-orange-50 border-orange-200 text-orange-800'
    }
    return `${baseClasses} ${levelClasses[feedback.level] || levelClasses.confused}`
  }, [feedback.level])

  const dotColor = useMemo(() => {
    const colors = {
      excellent: 'bg-green-500',
      good: 'bg-blue-500',
      struggling: 'bg-yellow-500',
      confused: 'bg-orange-500'
    }
    return colors[feedback.level] || colors.confused
  }, [feedback.level])

  const confidencePercentage = useMemo(() => 
    Math.round(feedback.confidence * 100), 
    [feedback.confidence]
  )

  return (
    <div className={feedbackStyle}>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${dotColor}`} />
        <span className="text-sm font-medium">{feedback.message}</span>
      </div>
      <div className="mt-1 text-xs opacity-75">
        Confidence: {confidencePercentage}%
      </div>
    </div>
  )
})

ComprehensionFeedbackDisplay.displayName = 'ComprehensionFeedbackDisplay'

// Memoized adaptation notification component
const AdaptationNotificationDisplay = memo(({ notification }: { notification: AdaptationNotification }) => {
  const notificationStyle = useMemo(() => {
    const baseClasses = 'p-3 rounded-lg border-2 transition-all duration-500 animate-pulse'
    const typeClasses = {
      switched_to_helper: 'bg-blue-50 border-blue-300 text-blue-800',
      switched_to_immersion: 'bg-purple-50 border-purple-300 text-purple-800',
      building_confidence: 'bg-green-50 border-green-300 text-green-800',
      default: 'bg-yellow-50 border-yellow-300 text-yellow-800'
    }
    return `${baseClasses} ${typeClasses[notification.type] || typeClasses.default}`
  }, [notification.type])

  const emoji = useMemo(() => {
    const emojis = {
      switched_to_helper: '🤝',
      switched_to_immersion: '🚀',
      building_confidence: '📈',
      default: '💪'
    }
    return emojis[notification.type] || emojis.default
  }, [notification.type])

  return (
    <div className={notificationStyle}>
      <div className="flex items-center gap-2">
        <div className="text-lg">{emoji}</div>
        <span className="text-sm font-medium">{notification.message}</span>
      </div>
    </div>
  )
})

AdaptationNotificationDisplay.displayName = 'AdaptationNotificationDisplay'

export const ProgressFeedback = memo(function ProgressFeedback({ 
  lastComprehensionFeedback, 
  showAdaptationNotification 
}: ProgressFeedbackProps) {
  return (
    <>
      {/* Real-time Comprehension Feedback */}
      {lastComprehensionFeedback && (
        <ComprehensionFeedbackDisplay feedback={lastComprehensionFeedback} />
      )}
      
      {/* Adaptation Notifications */}
      {showAdaptationNotification && (
        <AdaptationNotificationDisplay notification={showAdaptationNotification} />
      )}
    </>
  );
})