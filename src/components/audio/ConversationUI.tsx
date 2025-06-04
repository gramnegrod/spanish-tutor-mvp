'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot } from 'lucide-react'
import { cn, safeFormatTime } from '@/lib/utils'
import { ConversationTranscript } from '@/types'

interface ConversationUIProps {
  transcripts: ConversationTranscript[]
  isProcessing?: boolean
  currentSpeaker?: 'user' | 'assistant' | null
}

export function ConversationUI({ 
  transcripts, 
  isProcessing = false,
  currentSpeaker 
}: ConversationUIProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

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
      <AnimatePresence initial={false}>
        {transcripts.map((transcript) => (
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
                {safeFormatTime(transcript.timestamp)}
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
        ))}
      </AnimatePresence>

      {/* Speaking indicator */}
      {currentSpeaker && (
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
              {[0, 1, 2].map((i) => (
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
      )}
    </div>
  )
}