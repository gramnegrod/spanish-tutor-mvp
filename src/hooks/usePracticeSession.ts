'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { useConversationState, SessionStats, ComprehensionFeedback } from '@/hooks/useConversationState'
import { usePracticeAdaptation, AdaptationNotification, AdaptationProgress } from '@/hooks/usePracticeAdaptation'
import { useNPCLoader } from '@/hooks/useNPCLoader'
import { useSessionPersistence } from '@/hooks/useSessionPersistence'
import { useSessionAnalytics } from '@/hooks/useSessionAnalytics'
import { generateAdaptivePrompt, LearnerProfile } from '@/lib/pedagogical-system'
import type { ConversationTranscript } from '@/types'
import type { CostTracking, SessionInfo } from '@/services/openai-realtime/types'
import type { SpanishConversationAnalysis } from '@/lib/spanish-analysis/types'
import type { NPC } from '@/lib/npc-system/types'

// Types for interfaces that are not yet defined elsewhere
export interface UsePracticeSessionOptions {
  scenario: string
  npcName: string
  npcDescription: string
  destinationId: string
  npcId: string
  enableAuth?: boolean
  enableAdaptation?: boolean
  enableAnalysis?: boolean
  autoConnect?: boolean
  initialProfile?: Partial<LearnerProfile>
  customInstructions?: (profile: LearnerProfile) => string
}

export interface UsePracticeSessionReturn {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  connect: () => Promise<void>
  disconnect: () => void
  
  // Transcript management
  transcripts: ConversationTranscript[]
  currentSpeaker: 'user' | 'assistant' | null
  conversationStartTime: Date | null
  
  // Session management
  isAnalyzing: boolean
  showSummary: boolean
  handleEndConversation: () => Promise<void>
  handleRestart: () => void
  handleCloseSummary: () => void
  
  // Analytics
  sessionStats: SessionStats
  lastComprehensionFeedback: ComprehensionFeedback | null
  getFullSpanishAnalysis: () => SpanishConversationAnalysis | null
  costs: CostTracking | null
  
  // Learner profile
  learnerProfile: LearnerProfile
  
  // NPC data
  npc: NPC | null
  npcLoading: boolean
  npcError: string | null
  
  // Adaptation
  showAdaptationNotification: AdaptationNotification | null
  adaptationProgress: AdaptationProgress | null
  
  // Audio ref
  audioRef: React.RefObject<HTMLAudioElement | null>
  
  // Time warnings
  showTimeWarning: boolean
  timeWarningMinutes: number
  showSessionComplete: boolean
  showMaxSessions: boolean
  sessionInfo: SessionInfo | null
  extendSession: () => void
  dismissWarning: () => void
  handleSessionContinue: (extend: boolean) => void
  startFreshSession: () => void
}

export function usePracticeSession({
  scenario,
  npcName,
  npcDescription,
  destinationId,
  npcId,
  enableAuth = true,
  enableAdaptation = true,
  enableAnalysis = true,
  autoConnect = false,
  initialProfile = {},
  customInstructions
}: UsePracticeSessionOptions): UsePracticeSessionReturn {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [hasManuallyConnected, setHasManuallyConnected] = useState(false)
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>({
    level: 'beginner',
    comfortWithSlang: false,
    needsMoreEnglish: true,
    strugglingWords: [],
    masteredPhrases: [],
    ...initialProfile
  })
  
  // Initialize new hooks
  const { saveSession, loadProfile, saveProfile } = useSessionPersistence({ enableAuth })
  
  const { npc, isLoading: npcLoading, error: npcError, customPrompt } = useNPCLoader({
    destinationId,
    npcId,
    learnerProfile,
    scenario
  })
  
  // Initialize conversation state (combines transcript management and conversation engine)
  const conversationState = useConversationState({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    onSaveProfile: saveProfile,
    scenario: enableAnalysis ? scenario : undefined
  })
  
  // Extract needed values
  const {
    transcripts,
    currentSpeaker,
    conversationStartTime,
    addTranscript,
    clearConversation: clearTranscripts,
    setCurrentSpeaker,
    sessionStats,
    lastComprehensionFeedback,
    getFullSpanishAnalysis
  } = conversationState

  // Initialize session analytics
  const analytics = useSessionAnalytics({
    sessionStats,
    lastFeedback: lastComprehensionFeedback,
    getAnalysis: getFullSpanishAnalysis
  })
  
  // Generate AI instructions
  const generateInstructions = useCallback((profile: LearnerProfile) => {
    // First try to use the custom prompt from NPC loader
    if (customPrompt) {
      console.log('🎭 [PracticeSession] Using NPC custom prompt for:', npcName)
      console.log('🎭 [PracticeSession] Prompt preview:', customPrompt.substring(0, 200) + '...')
      return customPrompt
    }
    
    // Use custom instructions if provided
    if (customInstructions) {
      const instructions = customInstructions(profile)
      console.log('🎭 [PracticeSession] Using custom instructions for:', npcName)
      console.log('🎭 [PracticeSession] Instructions preview:', instructions.substring(0, 200) + '...')
      return instructions
    }
    
    console.log('⚠️ [PracticeSession] Falling back to default prompt for:', npcName)
    return generateAdaptivePrompt(npcName, npcDescription, profile)
  }, [npcName, npcDescription, customInstructions, customPrompt])
  
  // Keep a ref to the conversation state for callbacks
  const conversationStateRef = useRef(conversationState)
  useEffect(() => {
    conversationStateRef.current = conversationState
  }, [conversationState])
  
  // Handle transcript from OpenAI
  const handleTranscript = useCallback(async (role: 'user' | 'assistant', text: string) => {
    // The new addTranscript handles processing internally
    await conversationStateRef.current.addTranscript(role, text)
  }, [])
  
  // Initialize OpenAI Realtime
  const {
    isConnected,
    isConnecting,
    error,
    costs,
    showTimeWarning,
    timeWarningMinutes,
    showSessionComplete,
    sessionInfo,
    showMaxSessions,
    extendSession,
    handleSessionContinue,
    startFreshSession,
    dismissWarning,
    updateInstructions,
    connect: openAIConnect,
    disconnect: openAIDisconnect,
    audioRef
  } = useOpenAIRealtime({
    enableInputTranscription: true,
    inputAudioTranscription: {
      model: 'whisper-1',
      language: 'es'
    },
    instructions: generateInstructions(learnerProfile),
    voice: 'alloy', // TODO: Map NPC voices to realtime API voices
    autoConnect: autoConnect && !loading && (!enableAuth || !!user),
    turnDetection: {
      type: 'server_vad',
      threshold: 0.7,
      prefixPaddingMs: 500,
      silenceDurationMs: 800
    },
    onTranscript: handleTranscript
  })
  
  // Initialize adaptation system
  const adaptationSystem = usePracticeAdaptation({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    onInstructionsUpdate: updateInstructions,
    onSaveProfile: saveProfile,
    generateInstructions
  })
  
  // Auth redirect
  useEffect(() => {
    if (enableAuth && !loading && !user) {
      router.push('/login')
    }
  }, [enableAuth, user, loading, router])
  
  // Add ref to track previous instructions to prevent duplicate updates
  const previousInstructionsRef = useRef<string>('')

  // Update instructions when custom prompt or instructions change
  useEffect(() => {
    const newInstructions = generateInstructions(learnerProfile)
    
    // Only update if instructions have actually changed
    if (newInstructions !== previousInstructionsRef.current) {
      console.log('✅ [PracticeSession] Instructions changed, updating...')
      console.log('🔄 [PracticeSession] Previous instructions:', previousInstructionsRef.current.substring(0, 50) + '...')
      console.log('🔄 [PracticeSession] New instructions:', newInstructions.substring(0, 100) + '...')
      
      previousInstructionsRef.current = newInstructions
      updateInstructions(newInstructions)
      
      // Force update if already connected
      if (isConnected) {
        console.log('🔄 [PracticeSession] Already connected, forcing session update')
        // Small delay to ensure the update goes through
        setTimeout(() => {
          updateInstructions(newInstructions)
        }, 100)
      }
    } else {
      console.log('⏭️ [PracticeSession] Instructions unchanged, skipping update')
    }
  }, [customInstructions, customPrompt, learnerProfile, generateInstructions, isConnected]) // Added customPrompt to dependencies
  
  // Log initial instructions
  useEffect(() => {
    console.log('🎬 [PracticeSession] Initial render, customInstructions available:', !!customInstructions)
    console.log('🎬 [PracticeSession] Initial npcName:', npcName)
  }, [])
  
  // Load user profile on initialization
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profile = await loadProfile()
        if (profile) {
          setLearnerProfile(profile)
        }
      } catch (error) {
        console.error('[usePracticeSession] Failed to load profile:', error)
      }
    }
    
    if (user) {
      loadProfileData()
    }
  }, [user, loadProfile])
  
  // Connection handlers
  const connect = useCallback(async () => {
    if (enableAuth && !user) {
      console.error('[usePracticeSession] No user for connection')
      return
    }
    
    setHasManuallyConnected(true)
    
    try {
      await openAIConnect()
    } catch (err) {
      console.error('[usePracticeSession] Connect failed:', err)
      setHasManuallyConnected(false)
    }
  }, [enableAuth, user, openAIConnect])
  
  const disconnect = useCallback(() => {
    openAIDisconnect()
    setHasManuallyConnected(false)
  }, [openAIDisconnect])
  
  // Session handlers
  const handleEndConversation = useCallback(async () => {
    if (transcripts.length === 0) return
    
    disconnect()
    setIsAnalyzing(true)
    
    const duration = conversationStartTime 
      ? Math.floor((Date.now() - conversationStartTime.getTime()) / 1000)
      : 0
    
    try {
      // Transform transcripts to match expected format
      const transformedTranscripts = transcripts.map(t => ({
        id: t.id,
        speaker: t.speaker as 'user' | 'assistant' | 'system',
        text: t.text,
        timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp
      }))
      
      // Save session using persistence hook
      await saveSession({
        title: `${npcName} - ${new Date().toLocaleTimeString()}`,
        persona: npcName,
        transcript: transformedTranscripts,
        duration,
        language: 'es',
        scenario
      })
      
      setShowSummary(true)
    } catch (error) {
      console.error('[usePracticeSession] Failed to save conversation:', error)
      alert(`Session completed but analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }, [transcripts, conversationStartTime, disconnect, saveSession, npcName, scenario])
  
  const handleRestart = useCallback(() => {
    clearTranscripts()
    // Clear conversation resets the session
    if (enableAdaptation) {
      adaptationSystem.resetAdaptation()
    }
    startFreshSession()
  }, [clearTranscripts, adaptationSystem, enableAdaptation, startFreshSession])
  
  const handleCloseSummary = useCallback(() => {
    setShowSummary(false)
    router.push('/dashboard')
  }, [router])
  
  // Get current state
  // Session stats and analysis are already extracted from conversationState above
  const { showAdaptationNotification, getAdaptationProgress } = adaptationSystem
  const adaptationProgress = enableAdaptation ? getAdaptationProgress() : null
  
  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    
    // Transcript management
    transcripts,
    currentSpeaker: currentSpeaker as 'user' | 'assistant' | null,
    conversationStartTime,
    
    // Session management
    isAnalyzing,
    showSummary,
    handleEndConversation,
    handleRestart,
    handleCloseSummary,
    
    // Analytics
    sessionStats: analytics.sessionStats,
    lastComprehensionFeedback,
    getFullSpanishAnalysis,
    costs,
    
    // Learner profile
    learnerProfile,
    
    // NPC data
    npc,
    npcLoading,
    npcError,
    
    // Adaptation
    showAdaptationNotification,
    adaptationProgress,
    
    // Audio ref
    audioRef,
    
    // Time warnings
    showTimeWarning,
    timeWarningMinutes,
    showSessionComplete,
    showMaxSessions,
    sessionInfo,
    extendSession,
    dismissWarning,
    handleSessionContinue,
    startFreshSession
  }
}