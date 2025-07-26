/**
 * NPC System
 * Unified system for loading and managing NPCs across destinations
 */

export * from './types';
export * from './npc-loader';
export * from './npc-prompt-builder';
export * from './vocabulary-extractor';

// Re-export commonly used functions for convenience
export { 
  loadDestination,
  getNPC,
  getAllNPCs,
  getAvailableDestinations 
} from './npc-loader';

export { 
  buildPrompt,
  addScenarioContext 
} from './npc-prompt-builder';

export { 
  extractFromNPC,
  extractFromDestination,
  getScenarioVocabulary 
} from './vocabulary-extractor';