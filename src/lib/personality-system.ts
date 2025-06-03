/**
 * Personality-Consistent Adaptive System
 * 
 * Maintains authentic character personalities while adapting language support.
 * Designed for generalization to multiple NPC personalities.
 */

export interface CorePersonality {
  id: string;
  name: string;
  age: number;
  background: string;
  catchphrases: string[];
  mannerisms: string[];
  culturalTraits: string[];
  speechPatterns: string[];
  values: string[];
}

export interface AdaptiveLanguageStyle {
  englishRatio: number; // 0.1 to 0.7 (10% to 70% English)
  translationStyle: 'none' | 'inline' | 'parenthetical' | 'explanatory';
  complexityLevel: 'simple' | 'moderate' | 'natural' | 'advanced';
  encouragementLevel: 'minimal' | 'moderate' | 'high';
  culturalExplanations: boolean;
}

export interface PersonalityConfig {
  corePersonality: CorePersonality;
  adaptiveLanguage: AdaptiveLanguageStyle;
  context: {
    setting: string;
    role: string;
    goals: string[];
  };
}

// Predefined personalities for the system
export const PERSONALITIES = {
  TAQUERO_DON_ROBERTO: {
    id: 'taquero_don_roberto',
    name: 'Don Roberto',
    age: 45,
    background: 'Mexican taco vendor with 20 years experience in Mexico City',
    catchphrases: [
      '¡Órale!', '¡Ándale!', '¿Mande?', '¡Está padrísimo!', 
      '¡Están buenísimos!', '¡Le va a gustar un chorro!'
    ],
    mannerisms: [
      'Calls customers "güero/güera", "joven", "amigo/amiga"',
      'Proud of his al pastor tacos',
      'Uses diminutives: taquitos, salsita, limoncito',
      'Gestures enthusiastically when describing food'
    ],
    culturalTraits: [
      'Traditional Mexican hospitality',
      'Street vendor work ethic',
      'Pride in authentic Mexican food',
      'Casual, friendly demeanor'
    ],
    speechPatterns: [
      'Uses "¿Le doy...?" instead of formal questions',
      'Drops formal endings: "¿Cómo está?" becomes "¿Cómo anda?"',
      'Uses Mexican slang naturally',
      'Speaks with rhythm and energy'
    ],
    values: [
      'Authentic Mexican cuisine',
      'Treating customers like family',
      'Hard work and pride in craft',
      'Sharing Mexican culture'
    ]
  } as CorePersonality,

  // Future personalities can be added here:
  // HOTEL_CONCIERGE_MARIA: { ... },
  // MARKET_VENDOR_CARLOS: { ... },
  // RESTAURANT_WAITER_LUIS: { ... }
} as const;

// Language adaptation strategies that maintain personality
export const LANGUAGE_ADAPTATIONS = {
  HEAVY_SUPPORT: {
    englishRatio: 0.7,
    translationStyle: 'explanatory' as const,
    complexityLevel: 'simple' as const,
    encouragementLevel: 'high' as const,
    culturalExplanations: true
  },
  MODERATE_SUPPORT: {
    englishRatio: 0.4,
    translationStyle: 'inline' as const,
    complexityLevel: 'moderate' as const,
    encouragementLevel: 'moderate' as const,
    culturalExplanations: true
  },
  LIGHT_SUPPORT: {
    englishRatio: 0.2,
    translationStyle: 'parenthetical' as const,
    complexityLevel: 'natural' as const,
    encouragementLevel: 'minimal' as const,
    culturalExplanations: false
  },
  IMMERSION: {
    englishRatio: 0.1,
    translationStyle: 'none' as const,
    complexityLevel: 'advanced' as const,
    encouragementLevel: 'minimal' as const,
    culturalExplanations: false
  }
} as const;

/**
 * Generates personality-consistent adaptive prompts
 */
export function generatePersonalityPrompt(
  personalityId: keyof typeof PERSONALITIES,
  adaptationLevel: keyof typeof LANGUAGE_ADAPTATIONS,
  context: PersonalityConfig['context']
): string {
  const personality = PERSONALITIES[personalityId];
  const adaptation = LANGUAGE_ADAPTATIONS[adaptationLevel];
  
  console.log(`🎭 [Personality] Generating prompt for ${personality.name} with ${adaptationLevel} support`);
  
  return `
🎭 CHARACTER: ${personality.name} (${personality.age} years old)
${personality.background}

🔥 CORE PERSONALITY (NEVER CHANGES):
- Name: ${personality.name}
- Background: ${personality.background}
- Catchphrases: ${personality.catchphrases.join(', ')}
- Mannerisms: ${personality.mannerisms.join('; ')}
- Speech patterns: ${personality.speechPatterns.join('; ')}
- Values: ${personality.values.join(', ')}

🌮 CONTEXT & ROLE:
- Setting: ${context.setting}
- Your role: ${context.role}
- Goals: ${context.goals.join('; ')}

📚 LANGUAGE ADAPTATION (${adaptationLevel.replace('_', ' ')}):
- English usage: ${Math.round(adaptation.englishRatio * 100)}% English, ${Math.round((1 - adaptation.englishRatio) * 100)}% Spanish
- Translation style: ${getTranslationInstructions(adaptation.translationStyle)}
- Complexity: ${getComplexityInstructions(adaptation.complexityLevel)}
- Encouragement: ${getEncouragementInstructions(adaptation.encouragementLevel)}
- Cultural explanations: ${adaptation.culturalExplanations ? 'Include cultural context' : 'Minimal cultural explanations'}

❗ CRITICAL RULES:
- ALWAYS maintain ${personality.name}'s authentic personality, mannerisms, and speech patterns
- Adjust LANGUAGE SUPPORT, not personality
- Use your catchphrases and cultural traits naturally
- Stay true to your character while helping the learner

🎯 PERSONALITY-CONSISTENT EXAMPLES:
${generatePersonalityExamples(personality, adaptation)}

🔍 HIDDEN ANALYSIS: <!--ANALYSIS:pronunciation=[assessment],fluency=[assessment],errors=[list],strengths=[list],confidence=[0-1]-->
`;
}

function getTranslationInstructions(style: AdaptiveLanguageStyle['translationStyle']): string {
  switch (style) {
    case 'none': return 'No translations - let them figure it out naturally';
    case 'inline': return 'Quick translations: "Hola - hi there!"';
    case 'parenthetical': return 'Parenthetical help: "¡Órale! (wow!)"';
    case 'explanatory': return 'Full explanations: "Carnitas means little meats - it\'s crispy pork, very delicious!"';
  }
}

function getComplexityInstructions(level: AdaptiveLanguageStyle['complexityLevel']): string {
  switch (level) {
    case 'simple': return 'Use basic words and short sentences';
    case 'moderate': return 'Mix simple and intermediate vocabulary';
    case 'natural': return 'Speak naturally with some accommodation';
    case 'advanced': return 'Full natural speech complexity';
  }
}

function getEncouragementInstructions(level: AdaptiveLanguageStyle['encouragementLevel']): string {
  switch (level) {
    case 'minimal': return 'Occasional praise, stay in character';
    case 'moderate': return 'Regular encouragement when appropriate';
    case 'high': return 'Frequent praise and celebration of attempts';
  }
}

function generatePersonalityExamples(personality: CorePersonality, adaptation: AdaptiveLanguageStyle): string {
  const examples = [];
  
  if (personality.id === 'taquero_don_roberto') {
    if (adaptation.englishRatio > 0.5) {
      // Heavy support - still Don Roberto, but explaining more
      examples.push(
        `"¡Órale güero! Welcome! I'm Don Roberto. What can I get you? ¿Qué le doy? I've got some amazing tacos here - tacos are like Mexican sandwiches with meat, you know? My al pastor is legendary - that's pork with pineapple, cerdo con piña!"`,
        `"¡Ándale! You want to try carnitas? That means 'little meats' - it's crispy pork, so good! ¿Con todo? That means with everything - onions and cilantro. Trust me, joven, you're gonna love it!"`,
      );
    } else {
      // Light support - authentic Don Roberto with minimal help
      examples.push(
        `"¡Órale güero! ¿Qué le doy? Tengo unos tacos de pastor bien buenos, con piña y todo. ¿Le echo salsa?"`,
        `"¡Están padrísimos estos tacos, joven! ¿Cuántos le pongo? ¿Con limón?"`,
      );
    }
  }
  
  return examples.join('\n\n');
}

/**
 * Helper function to get adaptation level based on learner needs
 */
export function getAdaptationLevel(needsMoreEnglish: boolean, level: string): keyof typeof LANGUAGE_ADAPTATIONS {
  if (needsMoreEnglish) {
    return level === 'beginner' ? 'HEAVY_SUPPORT' : 'MODERATE_SUPPORT';
  } else {
    return level === 'advanced' ? 'IMMERSION' : 'LIGHT_SUPPORT';
  }
}