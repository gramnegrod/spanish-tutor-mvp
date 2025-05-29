'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AudioProcessor } from '@/lib/audio-utils'

interface VoiceRecorderProps {
  onAudioData: (data: ArrayBuffer) => void
  onRecordingStart?: () => void
  onRecordingEnd?: () => void
  isConnected: boolean
  isProcessing?: boolean
}

export function VoiceRecorder({
  onAudioData,
  onRecordingStart,
  onRecordingEnd,
  isConnected,
  isProcessing = false
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioProcessorRef = useRef<AudioProcessor | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    audioProcessorRef.current = new AudioProcessor()
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setAudioLevel(average / 255)

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
  }, [isRecording])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
          
          // Process and send audio in real-time
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          try {
            const pcmData = await audioProcessorRef.current!.blobToPCM16(audioBlob)
            onAudioData(pcmData)
          } catch (error) {
            console.error('Failed to process audio:', error)
          }
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        setAudioLevel(0)
      }

      mediaRecorder.start(100) // Send data every 100ms
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      onRecordingStart?.()
      updateAudioLevel()
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please check your permissions.')
    }
  }, [onAudioData, onRecordingStart, updateAudioLevel])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      onRecordingEnd?.()
    }
  }, [onRecordingEnd])

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isConnected || isProcessing}
          size="lg"
          className={cn(
            "h-20 w-20 rounded-full transition-all",
            isRecording 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-green-500 hover:bg-green-600"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : isRecording ? (
            <MicOff className="h-8 w-8 text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>

        {/* Audio level indicator */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-400"
            animate={{
              scale: 1 + audioLevel * 0.5,
              opacity: 0.3 + audioLevel * 0.7
            }}
            transition={{ duration: 0.1 }}
          />
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          {!isConnected 
            ? "Connecting to server..." 
            : isProcessing 
            ? "Processing..."
            : isRecording 
            ? "Listening... Click to stop" 
            : "Click to start speaking"}
        </p>
      </div>
    </div>
  )
}