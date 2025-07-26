/**
 * Dynamic NPC Data Loader
 * Loads NPC data on-demand to reduce bundle size
 */

import { NPC } from './types'
import { getAllNPCs } from './index'

// Cache for loaded NPCs
const npcCache = new Map<string, NPC[]>()

/**
 * Dynamically load NPCs for a specific destination
 */
export async function loadNPCsForDestination(destinationId: string): Promise<NPC[]> {
  // Check cache first
  if (npcCache.has(destinationId)) {
    return npcCache.get(destinationId)!
  }

  try {
    // Load NPCs for the specific destination
    const npcs = await getAllNPCs(destinationId)
    
    // Cache the result
    npcCache.set(destinationId, npcs)
    return npcs
    
  } catch (error) {
    console.error(`Failed to load NPCs for ${destinationId}:`, error)
    return []
  }
}

/**
 * Load a single NPC by ID and destination
 */
export async function loadNPC(destinationId: string, npcId: string): Promise<NPC | null> {
  const npcs = await loadNPCsForDestination(destinationId)
  return npcs.find(npc => npc.id === npcId) || null
}

/**
 * Preload NPCs for a destination (useful for prefetching)
 */
export function preloadNPCsForDestination(destinationId: string): void {
  // Fire and forget - just populate the cache
  loadNPCsForDestination(destinationId).catch(console.error)
}

/**
 * Clear the NPC cache (useful for memory management)
 */
export function clearNPCCache(): void {
  npcCache.clear()
}