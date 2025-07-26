/**
 * NPC Loader
 * Loads NPCs from JSON files for different destinations
 */

import { Destination, NPC, NPCLoadResult } from './types';

// Cache for loaded destinations
const destinationCache = new Map<string, Destination>();

/**
 * Load a destination's data from JSON
 */
export async function loadDestination(destinationId: string): Promise<Destination | null> {
  // Check cache first
  if (destinationCache.has(destinationId)) {
    return destinationCache.get(destinationId)!;
  }

  try {
    // Dynamic import of JSON files
    const data = await import(`@/data/destinations/${destinationId}.json`);
    const destination = data.default || data;
    
    // Cache the result
    destinationCache.set(destinationId, destination);
    
    return destination;
  } catch (error) {
    console.error(`Failed to load destination ${destinationId}:`, error);
    return null;
  }
}

/**
 * Get a specific NPC from a destination
 */
export async function getNPC(
  destinationId: string, 
  npcId: string
): Promise<NPCLoadResult | null> {
  const destination = await loadDestination(destinationId);
  
  if (!destination) {
    return null;
  }

  const npc = destination.npcs.find(n => n.id === npcId);
  
  if (!npc) {
    console.error(`NPC ${npcId} not found in destination ${destinationId}`);
    return null;
  }

  return { destination, npc };
}

/**
 * Get all NPCs for a destination
 */
export async function getAllNPCs(destinationId: string): Promise<NPC[]> {
  const destination = await loadDestination(destinationId);
  return destination?.npcs || [];
}

/**
 * Get available destinations
 */
export function getAvailableDestinations(): string[] {
  // For now, hardcoded. Later could scan directory
  return ['mexico-city', 'london'];
}

/**
 * Get NPCs by scenario type
 */
export async function getNPCsByScenario(
  destinationId: string,
  scenarioType: string
): Promise<NPC[]> {
  const npcs = await getAllNPCs(destinationId);
  return npcs.filter(npc => npc.scenario_type === scenarioType);
}

/**
 * Get a random NPC from a destination
 */
export async function getRandomNPC(destinationId: string): Promise<NPC | null> {
  const npcs = await getAllNPCs(destinationId);
  if (npcs.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * npcs.length);
  return npcs[randomIndex];
}

/**
 * Clear the cache (useful for development)
 */
export function clearCache(): void {
  destinationCache.clear();
}