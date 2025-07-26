/**
 * Vocabulary Extractor
 * Extracts vocabulary from NPCs for tracking and learning
 */

import { NPC, Destination } from './types';

export interface VocabularySet {
  essential: string[];
  contextual: string[];
  cultural: string[];
  phrases: string[];
}

/**
 * Extract vocabulary from a single NPC
 */
export function extractFromNPC(npc: NPC): VocabularySet {
  const vocabulary: VocabularySet = {
    essential: [],
    contextual: [],
    cultural: [],
    phrases: []
  };

  // Direct vocabulary focus
  if (npc.vocabulary_focus) {
    vocabulary.essential.push(...npc.vocabulary_focus);
  }

  // Extract from sample Q&A
  if (npc.sample_qa) {
    const words = extractWordsFromText(npc.sample_qa);
    vocabulary.contextual.push(...words);
  }

  // Extract from tour guide story
  if (npc.tour_guide_story) {
    const phrases = extractPhrasesFromText(npc.tour_guide_story);
    vocabulary.phrases.push(...phrases);
  }

  // Extract cultural expressions from quirks
  if (npc.quirks) {
    npc.quirks.forEach(quirk => {
      const culturalWords = extractCulturalWords(quirk);
      vocabulary.cultural.push(...culturalWords);
    });
  }

  // Remove duplicates
  Object.keys(vocabulary).forEach(key => {
    vocabulary[key as keyof VocabularySet] = [...new Set(vocabulary[key as keyof VocabularySet])];
  });

  return vocabulary;
}

/**
 * Extract vocabulary from multiple NPCs
 */
export function extractFromNPCs(npcs: NPC[]): VocabularySet {
  const combinedVocabulary: VocabularySet = {
    essential: [],
    contextual: [],
    cultural: [],
    phrases: []
  };

  npcs.forEach(npc => {
    const npcVocab = extractFromNPC(npc);
    combinedVocabulary.essential.push(...npcVocab.essential);
    combinedVocabulary.contextual.push(...npcVocab.contextual);
    combinedVocabulary.cultural.push(...npcVocab.cultural);
    combinedVocabulary.phrases.push(...npcVocab.phrases);
  });

  // Remove duplicates
  Object.keys(combinedVocabulary).forEach(key => {
    combinedVocabulary[key as keyof VocabularySet] = [...new Set(combinedVocabulary[key as keyof VocabularySet])];
  });

  return combinedVocabulary;
}

/**
 * Extract vocabulary from an entire destination
 */
export function extractFromDestination(destination: Destination): VocabularySet {
  const vocabulary = extractFromNPCs(destination.npcs);
  
  // Add destination-specific vocabulary if available
  if (destination.vocabulary_categories) {
    Object.values(destination.vocabulary_categories).forEach(category => {
      Object.values(category).forEach(words => {
        vocabulary.contextual.push(...words);
      });
    });
  }

  // Remove duplicates again
  Object.keys(vocabulary).forEach(key => {
    vocabulary[key as keyof VocabularySet] = [...new Set(vocabulary[key as keyof VocabularySet])];
  });

  return vocabulary;
}

/**
 * Get vocabulary for a specific scenario type
 */
export function getScenarioVocabulary(
  destination: Destination,
  scenarioType: string
): VocabularySet {
  const scenarioNPCs = destination.npcs.filter(
    npc => npc.scenario_type === scenarioType
  );
  
  return extractFromNPCs(scenarioNPCs);
}

/**
 * Helper: Extract Spanish words from text
 */
function extractWordsFromText(text: string): string[] {
  const spanishWordRegex = /\b[a-záéíóúñü]+\b/gi;
  const matches = text.match(spanishWordRegex) || [];
  
  // Filter out common English words and very short words
  const commonEnglish = new Set(['a', 'the', 'is', 'are', 'and', 'or', 'but', 'in', 'on', 'at']);
  
  return matches
    .filter(word => word.length > 2)
    .filter(word => !commonEnglish.has(word.toLowerCase()))
    .map(word => word.toLowerCase());
}

/**
 * Helper: Extract useful phrases
 */
function extractPhrasesFromText(text: string): string[] {
  const phrases: string[] = [];
  
  // Common Spanish phrase patterns
  const patterns = [
    /¿[^?]+\?/g,  // Questions
    /¡[^!]+!/g,   // Exclamations
    /"([^"]+)"/g, // Quoted phrases
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      phrases.push(...matches);
    }
  });
  
  return phrases.filter(phrase => phrase.length > 5);
}

/**
 * Helper: Extract cultural words from quirks
 */
function extractCulturalWords(quirk: string): string[] {
  const culturalMarkers = [
    'joven', 'güero', 'güerito', 'güerita', 'maestro', 'maestra',
    'órale', 'ándale', 'híjole', 'sale', 'simón', 'nel',
    'chido', 'padre', 'padrísimo', 'con madre', 'qué onda'
  ];
  
  const words: string[] = [];
  culturalMarkers.forEach(marker => {
    if (quirk.toLowerCase().includes(marker)) {
      words.push(marker);
    }
  });
  
  return words;
}