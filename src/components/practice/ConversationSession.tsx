'use client'

import React, { useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { ConversationUI } from '@/components/audio/ConversationUI'
import { SessionStatsDisplay } from '@/components/practice/SessionStats'
import { SessionCostDisplay } from '@/components/practice/SessionCostDisplay'
import { ConversationTranscript } from '@/types'
import type { SessionStats } from '@/hooks/useConversationState'
import type { CostTracking } from '@/services/openai-realtime/types'

interface ConversationSessionProps {
  title?: string
  description?: string
  transcripts: ConversationTranscript[]
  isProcessing: boolean
  currentSpeaker: 'user' | 'assistant' | null
  isConnected?: boolean
  sessionStats?: SessionStats
  costs?: CostTracking | null
  isAnalyzing?: boolean
  onRestart: () => void
  onEnd: () => void
  className?: string
}

export const ConversationSession = memo(function ConversationSession({
  title = "Conversation",
  description,
  transcripts,
  isProcessing,
  currentSpeaker,
  isConnected = false,
  sessionStats,
  costs,
  isAnalyzing = false,
  onRestart,
  onEnd,
  className = ''
}: ConversationSessionProps) {
  // Memoize derived values
  const hasConversation = useMemo(() => transcripts.length > 0, [transcripts.length])
  
  // Memoize button states to prevent unnecessary re-renders
  const buttonDisabled = useMemo(() => !hasConversation || isAnalyzing, [hasConversation, isAnalyzing])
  
  // Memoize event handlers to prevent child re-renders
  const handleRestart = useCallback(() => {
    onRestart()
  }, [onRestart])
  
  const handleEnd = useCallback(() => {
    onEnd()
  }, [onEnd])

  // Memoize button content for end button
  const endButtonContent = useMemo(() => {
    if (isAnalyzing) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Analyzing...
        </>
      )
    }
    return 'End & Analyze'
  }, [isAnalyzing])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ConversationUI 
          transcripts={transcripts}
          isProcessing={isProcessing}
          currentSpeaker={currentSpeaker}
          isConnected={isConnected}
        />
        
        {/* Live Session Stats */}
        {isConnected && sessionStats && (
          <SessionStatsDisplay sessionStats={sessionStats} />
        )}
        
        {/* Cost Display */}
        {costs && (
          <SessionCostDisplay 
            totalCost={costs.totalCost}
            audioInputSeconds={costs.audioInputSeconds}
            audioOutputSeconds={costs.audioOutputSeconds}
            className="mt-4"
          />
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button 
            onClick={handleRestart}
            variant="outline"
            className="flex-1"
            disabled={buttonDisabled}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
          <Button 
            onClick={handleEnd}
            className="flex-1"
            disabled={buttonDisabled}
          >
            {endButtonContent}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})