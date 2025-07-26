/**
 * NPC System Types
 * Standardized types for multi-destination practice scenarios
 */

export interface Destination {
  id: string;
  generated_at?: string;
  city: string;
  dates?: string;
  description: string;
  npcs: NPC[];
  vocabulary_categories?: VocabularyCategories;
}

export interface NPC {
  id: string;
  role: string;
  name: string;
  location?: string;
  voice?: string;
  persona_prompt: string;
  backstory: string;
  personality?: string;
  quirks?: string[];
  vocabulary_focus?: string[];
  prices_hours?: string;
  tour_guide_story?: string;
  current_events_2025?: string;
  sample_qa?: string;
  scenario_type?: string;
  learning_goals?: string[];
  
  // For compatibility with existing system
  order?: number;
  title?: string;
  minimumSuccessRate?: number;
  estimatedDuration?: number;
}

export interface VocabularyCategories {
  [category: string]: {
    [subcategory: string]: string[];
  };
}

export interface NPCLoadResult {
  destination: Destination;
  npc: NPC;
}

export interface NPCPromptConfig {
  npc: NPC;
  learnerProfile?: {
    level: 'beginner' | 'intermediate' | 'advanced';
    comfortWithSlang: boolean;
    needsMoreEnglish: boolean;
    strugglingWords: string[];
    masteredPhrases: string[];
  };
  supportLevel?: 'HEAVY_SUPPORT' | 'MODERATE_SUPPORT' | 'LIGHT_SUPPORT' | 'IMMERSION';
}