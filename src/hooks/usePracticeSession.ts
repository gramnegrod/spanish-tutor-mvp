'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { useConversationState } from '@/hooks/useConversationState'
import { usePracticeAdaptation, AdaptationNotification } from '@/hooks/usePracticeAdaptation'
import { generateAdaptivePrompt, LearnerProfile } from '@/lib/pedagogical-system'
import { LanguageLearningDB } from '@/lib/language-learning-db'
import type { ConversationTranscript } from '@/types'

export interface UsePracticeSessionOptions {
  scenario: string
  npcName: string
  npcDescription: string
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
  sessionStats: any
  lastComprehensionFeedback: any
  getFullSpanishAnalysis: () => any
  costs: any
  
  // Learner profile
  learnerProfile: LearnerProfile
  
  // Adaptation
  showAdaptationNotification: AdaptationNotification | null
  adaptationProgress: any
  
  // Audio ref
  audioRef: React.RefObject<HTMLAudioElement | null>
  
  // Time warnings
  showTimeWarning: boolean
  timeWarningMinutes: number
  showSessionComplete: boolean
  showMaxSessions: boolean
  sessionInfo: any
  extendSession: () => void
  dismissWarning: () => void
  handleSessionContinue: (extend: boolean) => void
  startFreshSession: () => void
}

export function usePracticeSession({
  scenario,
  npcName,
  npcDescription,
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
  
  // We'll define saveUserAdaptations after DB initialization to avoid circular dependency
  const saveUserAdaptationsRef = useRef<((profile: LearnerProfile) => Promise<void>) | null>(null)
  
  // Initialize conversation state (combines transcript management and conversation engine)
  const conversationState = useConversationState({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    onSaveProfile: saveUserAdaptationsRef.current || undefined,
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
  
  // Initialize Language Learning DB
  const db = useMemo(() => {
    if (typeof window === 'undefined') return null
    
    if (enableAuth && user) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseKey) {
        return LanguageLearningDB.createWithSupabase({ url: supabaseUrl, apiKey: supabaseKey })
      }
    }
    
    // Use localStorage for guest mode
    return LanguageLearningDB.createWithLocalStorage()
  }, [enableAuth, user])
  
  // Save profile to database
  const saveUserAdaptations = useCallback(async (profile: LearnerProfile) => {
    if (!db) return
    if (enableAuth && !user) return
    
    try {
      const userId = user?.id || 'guest'
      await db.profiles.update(userId, 'es', {
        level: profile.level,
        strugglingAreas: profile.strugglingWords,
        masteredConcepts: profile.masteredPhrases,
        preferences: {
          learningStyle: 'mixed',
          pace: 'normal',
          supportLevel: profile.needsMoreEnglish ? 'heavy' : 'moderate',
          culturalContext: profile.comfortWithSlang
        }
      })
    } catch (error) {
      console.error('[usePracticeSession] Failed to save adaptations:', error)
    }
  }, [db, enableAuth, user])
  
  // Set the ref after the function is defined
  useEffect(() => {
    saveUserAdaptationsRef.current = saveUserAdaptations
  }, [saveUserAdaptations])
  
  // Generate AI instructions
  const generateInstructions = useCallback((profile: LearnerProfile) => {
    // Use custom instructions if provided, otherwise use default
    if (customInstructions) {
      const instructions = customInstructions(profile)
      console.log('🎭 [PracticeSession] Using custom instructions for:', npcName)
      console.log('🎭 [PracticeSession] Instructions preview:', instructions.substring(0, 200) + '...')
      return instructions
    }
    console.log('⚠️ [PracticeSession] Falling back to default prompt for:', npcName)
    return generateAdaptivePrompt(npcName, npcDescription, profile)
  }, [npcName, npcDescription, customInstructions])
  
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
    voice: 'alloy',
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
    onSaveProfile: saveUserAdaptations,
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

  // Update instructions when custom instructions change
  useEffect(() => {
    if (customInstructions) {
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
    }
  }, [customInstructions, learnerProfile, generateInstructions, isConnected]) // Removed updateInstructions from dependencies
  
  // Log initial instructions
  useEffect(() => {
    console.log('🎬 [PracticeSession] Initial render, customInstructions available:', !!customInstructions)
    console.log('🎬 [PracticeSession] Initial npcName:', npcName)
  }, [])
  
  // Load user adaptations
  useEffect(() => {
    if (!db || !user) return
    
    const loadAdaptations = async () => {
      try {
        const profile = await db.profiles.get(user.id, 'es')
        if (profile) {
          setLearnerProfile({
            level: profile.level as 'beginner' | 'intermediate' | 'advanced',
            comfortWithSlang: profile.preferences?.culturalContext || false,
            needsMoreEnglish: profile.preferences?.supportLevel === 'heavy',
            strugglingWords: profile.strugglingAreas || [],
            masteredPhrases: profile.masteredConcepts || []
          })
        }
      } catch (error) {
        console.error('[usePracticeSession] Failed to load adaptations:', error)
      }
    }
    
    loadAdaptations()
  }, [db, user])
  
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
      if (db) {
        const userId = (enableAuth && user) ? user.id : 'guest'
        
        // Transform transcripts to match expected format
        // We trust that transcripts are valid since we filter at the source
        const transformedTranscripts = transcripts.map(t => ({
          id: t.id,
          speaker: t.speaker as 'user' | 'assistant' | 'system',
          text: t.text,
          timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp
        }))
        
        // Save conversation
        await db.saveConversation({
          title: `${npcName} - ${new Date().toLocaleTimeString()}`,
          persona: npcName,
          transcript: transformedTranscripts,
          duration,
          language: 'es',
          scenario
        }, { id: userId, email: userId })
        
        // Update progress
        await db.progress.update(userId, 'es', {
          totalMinutesPracticed: Math.ceil(duration / 60),
          conversationsCompleted: 1
        })
      }
      
      setShowSummary(true)
    } catch (error) {
      console.error('[usePracticeSession] Failed to save conversation:', error)
      console.error('[usePracticeSession] Error details:', {
        error,
        db: !!db,
        user: user?.id || 'guest',
        transcripts: transcripts.length,
        enableAuth
      })
      alert(`Session completed but analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }, [transcripts, conversationStartTime, disconnect, db, enableAuth, user, npcName, scenario])
  
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
    sessionStats,
    lastComprehensionFeedback,
    getFullSpanishAnalysis,
    costs,
    
    // Learner profile
    learnerProfile,
    
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