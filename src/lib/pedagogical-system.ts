/**
 * Pedagogical System for Mexican Spanish Learning
 * 
 * Core principles:
 * 1. Context-first learning (situations, not translations)
 * 2. Natural code-switching (Spanglish explanations)
 * 3. Mexican-specific language and culture
 * 4. Adaptive difficulty based on comprehension
 */

import { generatePersonalityPrompt, getAdaptationLevel } from './personality-system';

export interface LearnerProfile {
  level: 'beginner' | 'intermediate' | 'advanced';
  comfortWithSlang: boolean;
  needsMoreEnglish: boolean;
  strugglingWords: string[];
  masteredPhrases: string[];
  // New fields for hidden analysis
  pronunciation?: 'poor' | 'fair' | 'good' | 'excellent';
  fluency?: 'halting' | 'developing' | 'conversational' | 'fluent';
  averageConfidence?: number;
}

export interface HiddenAnalysis {
  pronunciation: 'poor' | 'fair' | 'good' | 'excellent';
  fluency: 'halting' | 'developing' | 'conversational' | 'fluent';
  errors: string[];
  strengths: string[];
  confidence: number;
}

export interface PedagogicalContext {
  situation: string;
  learningGoals: string[];
  culturalNotes: string[];
  targetPhrases: string[];
}

export const PEDAGOGICAL_SITUATIONS = {
  TACO_ORDERING: {
    situation: 'ordering_tacos',
    learningGoals: [
      'Order food politely using "me da" vs "quiero"',
      'Understand Mexican food vocabulary (pastor, suadero, etc)',
      'Use diminutives naturally (taquitos, salsita)',
      'Handle price negotiation culturally'
    ],
    culturalNotes: [
      'Mexicans often use "¿Me da...?" (could you give me) instead of "Quiero" (I want) to be polite',
      'Saying "con todo" means with onions and cilantro',
      'The vendor might call you "güero/güera" (light-skinned) or "joven" (young person) - this is friendly, not offensive'
    ],
    targetPhrases: [
      '¿Qué me recomienda?',
      '¿De qué son?',
      'Con todo, por favor',
      '¿Cuánto le debo?',
      'Está muy rico'
    ]
  },
  
  MARKET_SHOPPING: {
    situation: 'market_shopping',
    learningGoals: [
      'Negotiate prices respectfully',
      'Use "usted" with older vendors',
      'Understand quantity expressions (kilo, medio, cuarto)',
      'Practice numbers with prices'
    ],
    culturalNotes: [
      'Always greet with "Buenos días/tardes" before asking prices',
      'Bargaining is expected but should be friendly',
      '"¿A cómo?" is the Mexican way to ask "how much per unit"',
      'Vendors appreciate when you try to speak Spanish'
    ],
    targetPhrases: [
      '¿A cómo el kilo?',
      '¿Me hace un descuento?',
      'Me da medio kilo',
      '¿Qué es lo más fresco?',
      'Aquí tiene el cambio'
    ]
  }
};

export function generateAdaptivePrompt(
  persona: string,
  situation: string,
  learnerProfile: LearnerProfile
): string {
  const needsHelp = learnerProfile.needsMoreEnglish;
  const level = learnerProfile.level;
  
  // Determine adaptation level based on learner needs
  const adaptationLevel = getAdaptationLevel(needsHelp, level);
  
  console.log('🎭 [Pedagogical] Generating personality-consistent prompt:', {
    persona,
    situation,
    level,
    needsHelp,
    adaptationLevel,
    mode: needsHelp ? '🤝 HELPING MODE (More English)' : '🇲🇽 IMMERSION MODE (More Spanish)'
  });
  
  // Define context for taco ordering scenario
  const context = {
    setting: 'busy street taco stand in Mexico City',
    role: 'friendly Mexican taco vendor helping customers order food',
    goals: [
      'Help customer order delicious tacos',
      'Share authentic Mexican food culture',
      'Make the experience welcoming and fun',
      'Teach Spanish naturally through interaction'
    ]
  };
  
  // Generate personality-consistent prompt
  return generatePersonalityPrompt('TAQUERO_DON_ROBERTO', adaptationLevel, context) + `

🌮 MENU & PRICES:
- Al pastor (con piña): 15 pesos
- Carnitas: 12 pesos  
- Suadero: 12 pesos
- Bistec: 15 pesos
- Quesadillas: 20 pesos

❗ IMPORTANT INTERACTION RULES:
- Wait for the customer to speak first before greeting
- If you hear silence or unclear sounds, DO NOT respond
- Only greet ONCE when you hear clear speech
- Never repeat greetings
- Stay true to Don Roberto's character while adapting language support

REMEMBER: You're Don Roberto first, language helper second! Maintain your authentic personality while adjusting how much English you use to help the learner.`;
}

export function detectComprehension(userInput: string): {
  understood: boolean;
  confidence: number;
  indicators: string[];
} {
  // Handle edge cases
  if (!userInput || userInput.trim().length === 0) {
    return { understood: false, confidence: 0, indicators: [] };
  }
  
  // Normalize input
  const input = userInput.toLowerCase().trim();
  
  // Create word boundary regex for better matching
  const matchWholeWord = (text: string, word: string): boolean => {
    // Escape special regex characters
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
    return regex.test(text);
  };
  
  // Confusion indicators with weights
  const confusionPhrases = {
    // Strong confusion (weight: 3)
    'i don\'t understand': 3,
    'no entiendo': 3,
    'what does that mean': 3,
    'qué significa': 3,
    'can you repeat': 2,
    'repite': 2,
    'más despacio': 2,
    'slower': 2,
    // Medium confusion (weight: 2)
    'what': 2,
    'qué': 2,
    'cómo': 1, // Could be confusion or engagement
    'sorry': 2,
    'perdón': 2,
    'huh': 2,
    // Weak confusion (weight: 1)
    'umm': 1,
    'uh': 1,
    'er': 1,
    '???': 1
  };
  
  // Understanding indicators with weights
  const understandingPhrases = {
    // Strong Spanish usage (weight: 3)
    'quiero tacos': 3,
    'me da': 3,
    'por favor': 3,
    'cuánto cuesta': 3,
    'está bien': 3,
    'muchas gracias': 3,
    // Good Spanish words (weight: 2)
    'hola': 2,
    'gracias': 2,
    'tacos': 2,
    'pastor': 2,
    'carnitas': 2,
    'salsa': 2,
    'sí': 2,
    'claro': 2,
    'bueno': 2,
    // Basic understanding (weight: 1)
    'okay': 1,
    'yes': 1,
    'good': 1,
    'thanks': 1
  };
  
  // Calculate weighted scores
  let confusionScore = 0;
  let understandingScore = 0;
  const confusionMatches: string[] = [];
  const understandingMatches: string[] = [];
  
  // Check confusion phrases
  for (const [phrase, weight] of Object.entries(confusionPhrases)) {
    if (phrase.includes(' ') ? input.includes(phrase) : matchWholeWord(input, phrase)) {
      confusionScore += weight;
      confusionMatches.push(phrase);
    }
  }
  
  // Check understanding phrases
  for (const [phrase, weight] of Object.entries(understandingPhrases)) {
    if (phrase.includes(' ') ? input.includes(phrase) : matchWholeWord(input, phrase)) {
      understandingScore += weight;
      understandingMatches.push(phrase);
    }
  }
  
  // Additional scoring factors
  const wordCount = input.split(/\s+/).length;
  const lengthBonus = wordCount > 5 ? 2 : (wordCount > 3 ? 1 : 0);
  
  // Spanish character detection (ñ, á, é, í, ó, ú)
  const hasSpanishChars = /[ñáéíóú]/i.test(input) ? 1 : 0;
  
  // Question engagement bonus (shows active learning)
  const isQuestion = /[?¿]/.test(input) && understandingScore > 0 ? 1 : 0;
  
  // Calculate final scores
  const totalUnderstanding = understandingScore + lengthBonus + hasSpanishChars + isQuestion;
  const totalConfusion = confusionScore;
  
  // Determine if understood (with threshold)
  const understood = totalUnderstanding > totalConfusion * 1.5; // Needs 1.5x more understanding than confusion
  
  // Calculate confidence (0-1 scale)
  const rawConfidence = (totalUnderstanding - totalConfusion) / (totalUnderstanding + totalConfusion + 1);
  const confidence = Math.min(1, Math.max(0, (rawConfidence + 1) / 2)); // Normalize to 0-1
  
  console.log('[Comprehension] Detailed Analysis:', {
    userInput,
    normalized: input,
    confusionMatches,
    understandingMatches,
    scores: { 
      confusion: confusionScore, 
      understanding: understandingScore, 
      lengthBonus, 
      spanishChars: hasSpanishChars,
      questionBonus: isQuestion,
      totalConfusion,
      totalUnderstanding
    },
    result: { understood, confidence }
  });
  
  return {
    understood,
    confidence,
    indicators: understood ? understandingMatches : confusionMatches
  };
}

/**
 * Extract hidden analysis from AI response
 * Returns the clean text and the analysis object
 */
export function extractHiddenAnalysis(aiResponse: string): {
  cleanText: string;
  analysis: HiddenAnalysis | null;
} {
  // Look for analysis comment pattern
  const analysisPattern = /<!--ANALYSIS:([\s\S]+?)-->/;
  const match = aiResponse.match(analysisPattern);
  
  if (!match) {
    return { cleanText: aiResponse, analysis: null };
  }
  
  // Remove the analysis comment from the response
  const cleanText = aiResponse.replace(analysisPattern, '').trim();
  
  try {
    // Parse the analysis data
    const analysisData = match[1];
    const parts = analysisData.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {} as Record<string, string>);
    
    // Parse arrays (errors and strengths)
    const parseArray = (str: string): string[] => {
      if (!str || str === '[]') return [];
      return str.slice(1, -1).split(';').map(s => s.trim()).filter(Boolean);
    };
    
    const analysis: HiddenAnalysis = {
      pronunciation: (parts.pronunciation || 'fair') as HiddenAnalysis['pronunciation'],
      fluency: (parts.fluency || 'developing') as HiddenAnalysis['fluency'],
      errors: parseArray(parts.errors || '[]'),
      strengths: parseArray(parts.strengths || '[]'),
      confidence: parseFloat(parts.confidence || '0.5')
    };
    
    return { cleanText, analysis };
  } catch (error) {
    console.error('[Hidden Analysis] Failed to parse analysis:', error);
    return { cleanText, analysis: null };
  }
}

/**
 * Update learner profile based on hidden analysis
 */
export function updateProfileFromAnalysis(
  profile: LearnerProfile,
  analysis: HiddenAnalysis
): LearnerProfile {
  // Calculate running average confidence
  const currentConfidence = profile.averageConfidence || 0.5;
  const newConfidence = (currentConfidence * 0.7 + analysis.confidence * 0.3); // Weighted average
  
  // Update pronunciation and fluency with the latest values
  const updatedProfile: LearnerProfile = {
    ...profile,
    pronunciation: analysis.pronunciation,
    fluency: analysis.fluency,
    averageConfidence: newConfidence
  };
  
  // Add new errors to struggling words (avoid duplicates)
  analysis.errors.forEach(error => {
    if (!updatedProfile.strugglingWords.includes(error)) {
      updatedProfile.strugglingWords.push(error);
    }
  });
  
  // Add strengths to mastered phrases (avoid duplicates)
  analysis.strengths.forEach(strength => {
    if (!updatedProfile.masteredPhrases.includes(strength)) {
      updatedProfile.masteredPhrases.push(strength);
    }
  });
  
  // Adjust level based on performance
  if (newConfidence > 0.8 && analysis.fluency === 'fluent') {
    updatedProfile.level = 'advanced';
  } else if (newConfidence > 0.6 && (analysis.fluency === 'conversational' || analysis.fluency === 'fluent')) {
    updatedProfile.level = 'intermediate';
  } else {
    updatedProfile.level = 'beginner';
  }
  
  // Adjust English support based on confidence
  updatedProfile.needsMoreEnglish = newConfidence < 0.5 || analysis.fluency === 'halting';
  
  return updatedProfile;
}