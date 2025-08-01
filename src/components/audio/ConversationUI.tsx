'use client'

import { useEffect, useRef, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot } from 'lucide-react'
import { cn, safeFormatTime } from '@/lib/utils'
import { ConversationTranscript } from '@/types'
import { ConversationEmptyState } from '@/components/shared'

interface ConversationUIProps {
  transcripts: ConversationTranscript[]
  isProcessing?: boolean
  currentSpeaker?: 'user' | 'assistant' | null
  isConnected?: boolean
}

// Memoized transcript item component to prevent unnecessary re-renders
const TranscriptItem = memo(({ transcript }: { transcript: ConversationTranscript }) => {
  const formattedTime = useMemo(() => safeFormatTime(transcript.timestamp), [transcript.timestamp])
  
  return (
    <motion.div
      key={transcript.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3",
        transcript.speaker === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {transcript.speaker === 'assistant' && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          transcript.speaker === 'user'
            ? "bg-green-500 text-white"
            : "bg-white text-gray-900 shadow-sm"
        )}
      >
        <p className="text-sm">{transcript.text}</p>
        <p className="text-xs mt-1 opacity-70">
          {formattedTime}
        </p>
      </div>

      {transcript.speaker === 'user' && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  )
})

TranscriptItem.displayName = 'TranscriptItem'

// Memoized speaking indicator component
const SpeakingIndicator = memo(({ currentSpeaker }: { currentSpeaker: 'user' | 'assistant' }) => {
  const dots = useMemo(() => [0, 1, 2], [])
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex gap-3",
        currentSpeaker === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {currentSpeaker === 'assistant' && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
      
      <div className={cn(
        "rounded-lg px-4 py-2",
        currentSpeaker === 'user'
          ? "bg-green-500"
          : "bg-white shadow-sm"
      )}>
        <div className="flex space-x-1">
          {dots.map((i) => (
            <motion.div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full",
                currentSpeaker === 'user' ? "bg-white" : "bg-gray-400"
              )}
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </div>

      {currentSpeaker === 'user' && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  )
})

SpeakingIndicator.displayName = 'SpeakingIndicator'

export const ConversationUI = memo(function ConversationUI({ 
  transcripts, 
  isProcessing = false,
  currentSpeaker,
  isConnected = false
}: ConversationUIProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Memoize the rendered transcript items to prevent unnecessary re-renders
  const renderedTranscripts = useMemo(() => {
    return transcripts.map((transcript) => (
      <TranscriptItem key={transcript.id} transcript={transcript} />
    ))
  }, [transcripts])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcripts])

  return (
    <div 
      ref={scrollRef}
      className="h-[400px] overflow-y-auto rounded-lg border bg-gray-50 p-4 space-y-3"
    >
      {transcripts.length === 0 ? (
        <ConversationEmptyState isConnected={isConnected} className="h-full" />
      ) : (
        <AnimatePresence initial={false}>
          {renderedTranscripts}
        </AnimatePresence>
      )}

      {/* Speaking indicator */}
      {currentSpeaker && (
        <SpeakingIndicator currentSpeaker={currentSpeaker} />
      )}
    </div>
  )
})