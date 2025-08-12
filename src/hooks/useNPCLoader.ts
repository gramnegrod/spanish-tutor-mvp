/**
 * useNPCLoader Hook
 * 
 * Loads NPC data and builds custom prompts for conversation sessions.
 * Extracted from the deleted useMultiDestinationSession hook.
 */

import { useState, useEffect, useMemo } from 'react'
import { loadNPC } from '@/lib/npc-system/dynamic-loader'
import { buildPrompt, addScenarioContext } from '@/lib/npc-system/npc-prompt-builder'
import { NPC, NPCPromptConfig } from '@/lib/npc-system/types'

interface LearnerProfile {
  level: 'beginner' | 'intermediate' | 'advanced'
  comfortWithSlang: boolean
  needsMoreEnglish: boolean
  strugglingWords: string[]
  masteredPhrases: string[]
}

interface UseNPCLoaderOptions {
  destinationId: string
  npcId: string
  learnerProfile?: LearnerProfile
  scenario?: string
  supportLevel?: 'HEAVY_SUPPORT' | 'MODERATE_SUPPORT' | 'LIGHT_SUPPORT' | 'IMMERSION'
}

interface UseNPCLoaderReturn {
  npc: NPC | null
  isLoading: boolean
  error: string | null
  customPrompt: string | null
}

export function useNPCLoader(options: UseNPCLoaderOptions): UseNPCLoaderReturn {
  const { destinationId, npcId, learnerProfile, scenario, supportLevel = 'HEAVY_SUPPORT' } = options
  
  const [npc, setNPC] = useState<NPC | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load NPC data
  useEffect(() => {
    if (!destinationId || !npcId) {
      setError('Missing destination ID or NPC ID')
      setIsLoading(false)
      return
    }

    const loadNPCData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const loadedNPC = await loadNPC(destinationId, npcId)
        
        if (!loadedNPC) {
          throw new Error(`NPC "${npcId}" not found in destination "${destinationId}"`)
        }
        
        setNPC(loadedNPC)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load NPC'
        console.error('[useNPCLoader] Error loading NPC:', errorMessage)
        setError(errorMessage)
        setNPC(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadNPCData()
  }, [destinationId, npcId])

  // Build custom prompt when NPC and profile are available
  const customPrompt = useMemo(() => {
    if (!npc || !learnerProfile) {
      return null
    }

    try {
      const promptConfig: NPCPromptConfig = {
        npc,
        learnerProfile,
        supportLevel
      }

      // Build base prompt with learner profile
      const basePrompt = buildPrompt(promptConfig)
      
      // Add scenario-specific context if scenario is provided
      const finalPrompt = scenario 
        ? addScenarioContext(basePrompt, scenario)
        : basePrompt

      return finalPrompt
    } catch (err) {
      console.error('[useNPCLoader] Error building prompt:', err)
      return null
    }
  }, [npc, learnerProfile, supportLevel, scenario])

  return {
    npc,
    isLoading,
    error,
    customPrompt
  }
}