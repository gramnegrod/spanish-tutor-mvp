/**
 * NPC Prompt Builder
 * Builds conversation prompts from NPC data
 */

import { NPC, NPCPromptConfig } from './types';

/**
 * Build a complete prompt for an NPC
 */
export function buildPrompt(config: NPCPromptConfig): string {
  const { npc, learnerProfile, supportLevel = 'MODERATE_SUPPORT' } = config;
  
  // Base personality from NPC data
  const basePersonality = buildBasePersonality(npc);
  
  // Context and backstory
  const contextInstructions = buildContextInstructions(npc);
  
  // Behavioral instructions
  const behaviorInstructions = buildBehaviorInstructions(npc);
  
  // Language adaptation based on support level
  const languageAdaptation = buildLanguageAdaptation(supportLevel);
  
  // Learning adaptations based on profile
  const learnerAdaptations = buildLearnerAdaptations(learnerProfile);

  return `${npc.persona_prompt}

${basePersonality}

${contextInstructions}

${behaviorInstructions}

${languageAdaptation}

${learnerAdaptations}

CORE TEACHING PRINCIPLES:
- Your goal is to help the learner succeed, not to test them
- Be encouraging and patient, especially when they struggle
- If someone says "I don't understand" or "muéstrame" (show me), that's a clear request for help
- Use code-switching (Spanglish) naturally when it would help them learn
- Stay in character but prioritize being helpful over being rigid

Remember to stay completely in character. Never break character or acknowledge that you are an AI. You are ${npc.name}, and this is a real conversation.`;
}

/**
 * Build base personality section
 */
function buildBasePersonality(npc: NPC): string {
  const sections = [];
  
  if (npc.personality) {
    sections.push(`PERSONALITY: ${npc.personality}`);
  }
  
  if (npc.quirks && npc.quirks.length > 0) {
    sections.push(`IMPORTANT QUIRKS TO MAINTAIN:\n${npc.quirks.map(q => `- ${q}`).join('\n')}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Build context instructions
 */
function buildContextInstructions(npc: NPC): string {
  const sections = [`BACKSTORY AND CONTEXT:\n${npc.backstory}`];
  
  if (npc.location) {
    sections.push(`You are currently at ${npc.location}.`);
  }
  
  if (npc.tour_guide_story) {
    sections.push(`TYPICAL INTERACTION:\n${npc.tour_guide_story}`);
  }
  
  if (npc.current_events_2025) {
    sections.push(`CURRENT EVENTS/UPDATES:\n${npc.current_events_2025}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Build behavioral instructions
 */
function buildBehaviorInstructions(npc: NPC): string {
  const sections = [];
  
  if (npc.prices_hours) {
    sections.push(`PRACTICAL INFORMATION:\n${npc.prices_hours}`);
  }
  
  if (npc.sample_qa) {
    sections.push(`SAMPLE INTERACTIONS:\n${npc.sample_qa}`);
  }
  
  if (npc.vocabulary_focus && npc.vocabulary_focus.length > 0) {
    sections.push(`KEY VOCABULARY TO USE:\n${npc.vocabulary_focus.join(', ')}`);
  }
  
  return sections.length > 0 ? `BEHAVIORAL GUIDELINES:\n${sections.join('\n\n')}` : '';
}

/**
 * Build language adaptation instructions
 */
function buildLanguageAdaptation(supportLevel: string): string {
  const adaptations: Record<string, string> = {
    'HEAVY_SUPPORT': `LANGUAGE SUPPORT:
- Speak mostly Spanish with some English when the learner struggles
- Repeat important information in both languages
- Use simple vocabulary and short sentences
- Speak slowly and clearly
- Offer translations for difficult words`,
    
    'MODERATE_SUPPORT': `LANGUAGE SUPPORT:
- Speak primarily in Spanish
- When the learner says "I don't understand" or shows confusion, help them in English AND Spanish
- Use intermediate vocabulary, but explain difficult words
- Speak at moderate pace
- Be patient and helpful - if they're struggling, switch to Spanglish to help them learn`,
    
    'LIGHT_SUPPORT': `LANGUAGE SUPPORT:
- Speak almost entirely in Spanish
- Use English only for emergencies
- Use natural vocabulary and expressions
- Speak at near-normal pace
- Help through rephrasing and context in Spanish`,
    
    'IMMERSION': `LANGUAGE SUPPORT:
- Speak only in Spanish, no English at all
- Use natural speed and expressions
- Help through gestures, examples, and rephrasing
- Act as if in a real Spanish-only environment
- Be patient but maintain Spanish-only rule`
  };
  
  return adaptations[supportLevel] || adaptations['MODERATE_SUPPORT'];
}

/**
 * Build learner-specific adaptations
 */
function buildLearnerAdaptations(profile?: NPCPromptConfig['learnerProfile']): string {
  if (!profile) return '';
  
  const adaptations = [];
  
  if (profile.needsMoreEnglish) {
    adaptations.push('- The learner may need more English support than usual');
  }
  
  if (!profile.comfortWithSlang) {
    adaptations.push('- Avoid heavy slang, use more standard Spanish');
  }
  
  if (profile.strugglingWords.length > 0) {
    adaptations.push(`- The learner struggles with: ${profile.strugglingWords.join(', ')}`);
    adaptations.push('- Be extra patient with these words');
  }
  
  if (profile.masteredPhrases.length > 0) {
    adaptations.push(`- The learner has mastered: ${profile.masteredPhrases.join(', ')}`);
    adaptations.push('- You can use these freely');
  }
  
  return adaptations.length > 0 
    ? `LEARNER ADAPTATIONS:\n${adaptations.join('\n')}` 
    : '';
}

/**
 * Add scenario-specific instructions
 */
export function addScenarioContext(
  basePrompt: string, 
  scenario: string
): string {
  const scenarioContexts: Record<string, string> = {
    'taco_vendor': '\n\nThe learner is ordering tacos from your street stand. Help them navigate the menu and understand Mexican food culture.',
    'restaurant': '\n\nThe learner is dining at your restaurant. Guide them through the menu, take their order, and provide excellent service.',
    'hotel_checkin': '\n\nThe learner is checking into your hotel. Help them complete the process and understand their room options.',
    'taxi_ride': '\n\nThe learner just got in your taxi. Take them to their destination while chatting about the city.',
    'market': '\n\nThe learner is shopping at your market stall. Help them buy what they need and teach them about the products.',
    'pharmacy': '\n\nThe learner needs help at your pharmacy. Assist them professionally while ensuring they understand medication instructions.'
  };
  
  return basePrompt + (scenarioContexts[scenario] || '');
}