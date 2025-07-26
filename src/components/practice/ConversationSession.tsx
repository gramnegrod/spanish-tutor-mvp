'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { ConversationUI } from '@/components/audio/ConversationUI'
import { SessionStatsDisplay } from '@/components/practice/SessionStats'
import { SessionCostDisplay } from '@/components/practice/SessionCostDisplay'
import { ConversationTranscript } from '@/types'
import type { SessionStats } from '@/hooks/useConversationEngine'

interface ConversationSessionProps {
  title?: string
  description?: string
  transcripts: ConversationTranscript[]
  isProcessing: boolean
  currentSpeaker: 'user' | 'assistant' | null
  isConnected?: boolean
  sessionStats?: SessionStats
  costs?: {
    totalCost: number
    audioInputSeconds: number
    audioOutputSeconds: number
  }
  isAnalyzing?: boolean
  onRestart: () => void
  onEnd: () => void
  className?: string
}

export function ConversationSession({
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
  const hasConversation = transcripts.length > 0

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
            onClick={onRestart}
            variant="outline"
            className="flex-1"
            disabled={!hasConversation || isAnalyzing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
          <Button 
            onClick={onEnd}
            className="flex-1"
            disabled={!hasConversation || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'End & Analyze'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}