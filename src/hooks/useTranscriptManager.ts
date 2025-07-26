'use client'

import { useState, useCallback } from 'react'
import { ConversationTranscript } from '@/types'

export interface UseTranscriptManagerReturn {
  transcripts: ConversationTranscript[]
  currentSpeaker: string | null
  conversationStartTime: Date | null
  addTranscript: (role: 'user' | 'assistant', text: string) => void
  clearTranscripts: () => void
  setCurrentSpeaker: (speaker: string | null) => void
}

export function useTranscriptManager(): UseTranscriptManagerReturn {
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null)

  const addTranscript = useCallback((role: 'user' | 'assistant', text: string) => {
    const newTranscript: ConversationTranscript = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      speaker: role,
      text,
      timestamp: new Date()
    }

    setTranscripts(prev => {
      // Set conversation start time on first transcript
      if (prev.length === 0) {
        setConversationStartTime(new Date())
      }
      return [...prev, newTranscript]
    })

    // Briefly show current speaker
    setCurrentSpeaker(role)
    setTimeout(() => setCurrentSpeaker(null), 1000)
  }, [])

  const clearTranscripts = useCallback(() => {
    setTranscripts([])
    setCurrentSpeaker(null)
    setConversationStartTime(null)
  }, [])

  return {
    transcripts,
    currentSpeaker,
    conversationStartTime,
    addTranscript,
    clearTranscripts,
    setCurrentSpeaker
  }
}