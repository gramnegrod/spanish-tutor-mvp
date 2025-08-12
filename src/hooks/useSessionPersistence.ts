'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LanguageLearningDB } from '@/lib/language-learning-db'
import { generateAdaptivePrompt, LearnerProfile } from '@/lib/pedagogical-system'
import type { ConversationTranscript } from '@/types'

interface SessionData {
  title: string
  persona: string
  transcript: Array<{
    id: string
    speaker: 'user' | 'assistant' | 'system'
    text: string
    timestamp: string
  }>
  duration: number
  language: string
  scenario: string
}

interface UseSessionPersistenceOptions {
  enableAuth?: boolean
}

interface UseSessionPersistenceReturn {
  saveSession: (sessionData: SessionData) => Promise<void>
  loadProfile: () => Promise<LearnerProfile | null>
  saveProfile: (profile: LearnerProfile) => Promise<void>
  isReady: boolean
}

export function useSessionPersistence({
  enableAuth = true
}: UseSessionPersistenceOptions = {}): UseSessionPersistenceReturn {
  const { user } = useAuth()
  const [isReady, setIsReady] = useState(false)

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

  // Set ready state when DB is initialized
  useEffect(() => {
    setIsReady(!!db)
  }, [db])

  // Save session to database
  const saveSession = useCallback(async (sessionData: SessionData) => {
    if (!db) throw new Error('Database not initialized')
    if (enableAuth && !user) throw new Error('User not authenticated')
    
    const userId = (enableAuth && user) ? user.id : 'guest'
    
    try {
      // Save conversation
      await db.saveConversation({
        title: sessionData.title,
        persona: sessionData.persona,
        transcript: sessionData.transcript,
        duration: sessionData.duration,
        language: sessionData.language,
        scenario: sessionData.scenario
      }, { id: userId, email: userId })
      
      // Update progress
      await db.progress.update(userId, sessionData.language, {
        totalMinutesPracticed: Math.ceil(sessionData.duration / 60),
        conversationsCompleted: 1
      })
    } catch (error) {
      console.error('[useSessionPersistence] Failed to save session:', error)
      throw error
    }
  }, [db, enableAuth, user])

  // Load user profile from database
  const loadProfile = useCallback(async (): Promise<LearnerProfile | null> => {
    if (!db || !user) return null
    
    try {
      const profile = await db.profiles.get(user.id, 'es')
      if (profile) {
        return {
          level: profile.level as 'beginner' | 'intermediate' | 'advanced',
          comfortWithSlang: profile.preferences?.culturalContext || false,
          needsMoreEnglish: profile.preferences?.supportLevel === 'heavy',
          strugglingWords: profile.strugglingAreas || [],
          masteredPhrases: profile.masteredConcepts || []
        }
      }
      return null
    } catch (error) {
      console.error('[useSessionPersistence] Failed to load profile:', error)
      return null
    }
  }, [db, user])

  // Save user profile to database
  const saveProfile = useCallback(async (profile: LearnerProfile) => {
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
      console.error('[useSessionPersistence] Failed to save profile:', error)
      throw error
    }
  }, [db, enableAuth, user])

  return {
    saveSession,
    loadProfile,
    saveProfile,
    isReady
  }
}