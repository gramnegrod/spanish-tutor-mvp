/**
 * Multi-Destination Practice Session Hook
 * Extended version of usePracticeSession that works with the NPC system
 */

import { useState, useEffect, useCallback } from 'react';
import { usePracticeSession } from './usePracticeSession';
import { buildPrompt, addScenarioContext } from '@/lib/npc-system';
import { loadNPC } from '@/lib/npc-system/dynamic-loader';
import { NPC, NPCLoadResult, Destination } from '@/lib/npc-system/types';
import { LearnerProfile } from '@/lib/pedagogical-system';

export interface UseMultiDestinationSessionOptions {
  destinationId: string;
  npcId: string;
  mode?: 'single' | 'adventure';
  enableAuth?: boolean;
  enableAdaptation?: boolean;
  enableAnalysis?: boolean;
  autoConnect?: boolean;
  initialProfile?: Partial<LearnerProfile>;
  adventureId?: string | null;
  scenarioId?: string | null;
}

export interface UseMultiDestinationSessionReturn extends Omit<ReturnType<typeof usePracticeSession>, 'error'> {
  npc: NPC | null;
  destinationId: string;
  isLoading: boolean;
  error: Error | null;
}

export function useMultiDestinationSession(
  options: UseMultiDestinationSessionOptions
): UseMultiDestinationSessionReturn {
  const {
    destinationId,
    npcId,
    mode = 'single',
    enableAuth = true,
    enableAdaptation = true,
    enableAnalysis = true,
    autoConnect = false,
    initialProfile
  } = options;

  const [npcData, setNpcData] = useState<NPCLoadResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Load NPC data
  useEffect(() => {
    async function loadNPCData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Dynamically load NPC data
        const npc = await loadNPC(destinationId, npcId);
        
        if (!npc) {
          setError(new Error(`NPC ${npcId} not found in ${destinationId}`));
          return;
        }
        
        // Create a simple destination object since we're not using the full system
        const destination: Destination = {
          id: destinationId,
          city: destinationId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: '',
          npcs: [npc]
        };
        
        const result = { destination, npc };
        
        console.log('🎯 [MultiDestination] Loaded NPC:', {
          id: result.npc.id,
          name: result.npc.name,
          role: result.npc.role,
          persona: result.npc.persona_prompt?.substring(0, 100) + '...'
        });
        
        setNpcData(result);
        
        // Build the prompt
        const prompt = buildPrompt({
          npc: result.npc,
          learnerProfile: initialProfile as any,
          supportLevel: 'MODERATE_SUPPORT'
        });
        
        // Add scenario context if available
        const finalPrompt = result.npc.scenario_type 
          ? addScenarioContext(prompt, result.npc.scenario_type)
          : prompt;
          
        setCustomPrompt(finalPrompt);
        
      } catch (err) {
        setError(new Error(`Failed to load NPC: ${err}`));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadNPCData();
  }, [destinationId, npcId, initialProfile]);

  // Use the base practice session hook with NPC data
  const session = usePracticeSession({
    scenario: npcData?.npc.scenario_type || 'general',
    npcName: npcData?.npc.name || 'Assistant',
    npcDescription: npcData?.npc.backstory || '',
    enableAuth,
    enableAdaptation,
    enableAnalysis,
    autoConnect,
    initialProfile,
    customInstructions: customPrompt ? (profile) => {
      // Rebuild prompt with current profile to maintain NPC personality during adaptation
      if (!npcData) return customPrompt;
      
      const supportLevel = profile.needsMoreEnglish ? 'HEAVY_SUPPORT' : 'MODERATE_SUPPORT';
      console.log('🎭 [MultiDestination] Rebuilding prompt for', npcData.npc.name, 'with', supportLevel);
      
      const freshPrompt = buildPrompt({
        npc: npcData.npc,
        learnerProfile: profile,
        supportLevel
      });
      
      return npcData.npc.scenario_type 
        ? addScenarioContext(freshPrompt, npcData.npc.scenario_type)
        : freshPrompt;
    } : undefined
  });

  return {
    ...session,
    npc: npcData?.npc || null,
    destinationId,
    isLoading,
    error: error || session.error
  };
}

/**
 * Hook for adventure mode with multiple NPCs
 */
export function useAdventureSession(
  destinationId: string,
  options?: Partial<UseMultiDestinationSessionOptions>
) {
  const [currentNpcIndex, setCurrentNpcIndex] = useState(0);
  const [completedNpcs, setCompletedNpcs] = useState<string[]>([]);
  const [adventureNpcs, setAdventureNpcs] = useState<NPC[]>([]);

  // Load all NPCs for the destination
  useEffect(() => {
    async function loadAdventure() {
      try {
        const { getAllNPCs } = await import('@/lib/npc-system');
        const npcs = await getAllNPCs(destinationId);
        
        // Sort by order if available
        const sortedNpcs = npcs.sort((a, b) => (a.order || 0) - (b.order || 0));
        setAdventureNpcs(sortedNpcs);
      } catch (err) {
        console.error('Failed to load adventure NPCs:', err);
      }
    }
    
    loadAdventure();
  }, [destinationId]);

  const currentNpc = adventureNpcs[currentNpcIndex];
  
  const session = useMultiDestinationSession({
    destinationId,
    npcId: currentNpc?.id || '',
    mode: 'adventure',
    ...options
  });

  const goToNextNpc = useCallback(() => {
    if (currentNpc) {
      setCompletedNpcs(prev => [...prev, currentNpc.id]);
    }
    
    if (currentNpcIndex < adventureNpcs.length - 1) {
      setCurrentNpcIndex(prev => prev + 1);
    }
  }, [currentNpc, currentNpcIndex, adventureNpcs.length]);

  const goToPreviousNpc = useCallback(() => {
    if (currentNpcIndex > 0) {
      setCurrentNpcIndex(prev => prev - 1);
    }
  }, [currentNpcIndex]);

  const goToNpc = useCallback((index: number) => {
    if (index >= 0 && index < adventureNpcs.length) {
      setCurrentNpcIndex(index);
    }
  }, [adventureNpcs.length]);

  return {
    ...session,
    adventureNpcs,
    currentNpcIndex,
    completedNpcs,
    isLastNpc: currentNpcIndex === adventureNpcs.length - 1,
    isFirstNpc: currentNpcIndex === 0,
    progress: adventureNpcs.length > 0 ? (currentNpcIndex + 1) / adventureNpcs.length : 0,
    goToNextNpc,
    goToPreviousNpc,
    goToNpc
  };
}