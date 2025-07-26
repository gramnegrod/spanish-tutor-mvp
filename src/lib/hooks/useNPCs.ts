import useSWR, { preload } from 'swr';
import { NPC } from '@/lib/npc-system/types';
import { cacheKeys } from '../swr-config';

// Import the existing dynamic loader functions
import { 
  loadNPCsForDestination as _loadNPCsForDestination,
  loadNPC as _loadNPC 
} from '@/lib/npc-system/dynamic-loader';

/**
 * Hook to load NPCs for a destination with SWR caching
 */
export function useNPCsForDestination(destinationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    destinationId ? `npcs-${destinationId}` : null,
    async () => {
      if (!destinationId) return [];
      return await _loadNPCsForDestination(destinationId);
    },
    {
      // NPCs don't change often, cache for 30 minutes
      dedupingInterval: 30 * 60 * 1000,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  
  return {
    npcs: data || [],
    error,
    isLoading,
    revalidate: mutate,
  };
}

/**
 * Hook to load a single NPC with SWR caching
 */
export function useNPC(destinationId: string | null, npcId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    destinationId && npcId ? `npc-${destinationId}-${npcId}` : null,
    async () => {
      if (!destinationId || !npcId) return null;
      return await _loadNPC(destinationId, npcId);
    },
    {
      // Single NPC data, cache for 30 minutes
      dedupingInterval: 30 * 60 * 1000,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  
  return {
    npc: data || null,
    error,
    isLoading,
    revalidate: mutate,
  };
}

/**
 * Hook to preload NPCs for better performance
 */
export function useNPCPreloader() {
  const preloadDestination = (destinationId: string) => {
    // Trigger SWR to cache the data
    preload(
      `npcs-${destinationId}`,
      async () => await _loadNPCsForDestination(destinationId)
    );
  };
  
  const preloadNPC = (destinationId: string, npcId: string) => {
    // Trigger SWR to cache the data
    preload(
      `npc-${destinationId}-${npcId}`,
      async () => await _loadNPC(destinationId, npcId)
    );
  };
  
  return {
    preloadDestination,
    preloadNPC,
  };
}