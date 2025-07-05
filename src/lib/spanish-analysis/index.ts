/**
 * Spanish Analysis Module
 * Main entry point for Spanish vocabulary and conversation analysis
 */

// ============================================================================
// Main Exports
// ============================================================================

export { SpanishConversationAnalyzer } from './conversation-analyzer'

// Types
export type {
  SpanishConversationAnalysis,
  AnalyzedWord,
  AnalyzedPhrase,
  GrammarPattern,
  CulturalMarker,
  StrugglePattern,
  MasterySignal,
  LearningRecommendation,
  SessionMetrics,
  ConversationTurn,
  AnalysisContext,
  SpanishAnalyzerConfig,
  VocabularyAnalysisResult,
  StruggleAnalysisResult,
  VocabularyCategory,
  GrammarType,
  CulturalType,
  StruggleType,
  MasteryLevel,
  ConfidenceLevel,
  SpanishLevel,
  FormalityLevel,
  RegionalVariety,
  ScenarioVocabulary
} from './types'

// Vocabulary data
export {
  MEXICAN_EXPRESSIONS,
  VOCABULARY_BY_CATEGORY,
  SCENARIO_VOCABULARIES,
  SPANISH_GRAMMAR_PATTERNS,
  CULTURAL_CONTEXT,
  getVocabularyByCategory,
  getScenarioVocabulary,
  isMexicanExpression,
  categorizeFormalityLevel
} from './mexican-vocabulary'

// ============================================================================
// Convenience Factory Functions
// ============================================================================

import { SpanishConversationAnalyzer } from './conversation-analyzer'
import type { SpanishAnalyzerConfig, SpanishLevel, RegionalVariety } from './types'

/**
 * Create a Spanish analyzer configured for taco vendor scenario
 */
export function createTacoVendorAnalyzer(level: SpanishLevel = 'beginner'): SpanishConversationAnalyzer {
  return new SpanishConversationAnalyzer({
    level,
    focusScenario: 'taco_vendor',
    regionalFocus: 'mexican',
    strictness: 'balanced',
    trackCulturalMarkers: true,
    enableGrammarAnalysis: true,
    enableMasteryTracking: true
  })
}

/**
 * Create a Spanish analyzer configured for market scenario
 */
export function createMarketAnalyzer(level: SpanishLevel = 'beginner'): SpanishConversationAnalyzer {
  return new SpanishConversationAnalyzer({
    level,
    focusScenario: 'market',
    regionalFocus: 'mexican',
    strictness: 'balanced',
    trackCulturalMarkers: true,
    enableGrammarAnalysis: true,
    enableMasteryTracking: true
  })
}

/**
 * Create a Spanish analyzer configured for restaurant scenario
 */
export function createRestaurantAnalyzer(level: SpanishLevel = 'beginner'): SpanishConversationAnalyzer {
  return new SpanishConversationAnalyzer({
    level,
    focusScenario: 'restaurant',
    regionalFocus: 'mexican',
    strictness: 'balanced',
    trackCulturalMarkers: true,
    enableGrammarAnalysis: true,
    enableMasteryTracking: true
  })
}

/**
 * Create a custom Spanish analyzer with full configuration
 */
export function createCustomAnalyzer(config: SpanishAnalyzerConfig): SpanishConversationAnalyzer {
  return new SpanishConversationAnalyzer(config)
}

// ============================================================================
// Quick Analysis Functions
// ============================================================================

import type { ConversationTurn, AnalysisContext } from './types'
import { getScenarioVocabulary, categorizeFormalityLevel } from './mexican-vocabulary'

/**
 * Quick vocabulary analysis for any Spanish text
 */
export function analyzeSpanishText(
  text: string,
  scenario: string = 'general',
  level: SpanishLevel = 'beginner'
): {
  spanishWords: string[]
  mexicanExpressions: string[]
  scenario: string
  level: SpanishLevel
} {
  const analyzer = new SpanishConversationAnalyzer({
    level,
    focusScenario: scenario,
    regionalFocus: 'mexican',
    strictness: 'balanced',
    trackCulturalMarkers: true,
    enableGrammarAnalysis: false,
    enableMasteryTracking: false
  })

  // Create a simple conversation turn
  const conversation: ConversationTurn[] = [{
    role: 'user',
    text,
    timestamp: new Date().toISOString()
  }]

  const context: AnalysisContext = {
    scenario,
    learnerLevel: level,
    conversationHistory: conversation,
    previousMastery: [],
    strugglingAreas: []
  }

  const analysis = analyzer.analyzeConversation(conversation, context)
  
  return {
    spanishWords: analysis.wordsUsed.map(w => w.word),
    mexicanExpressions: analysis.mexicanExpressions,
    scenario,
    level
  }
}

/**
 * Check if text contains essential vocabulary for a scenario
 */
export function checkEssentialVocabulary(text: string, scenario: string): {
  used: string[]
  missing: string[]
  coverage: number
} {
  const scenarioVocab = getScenarioVocabulary(scenario)
  const lowerText = text.toLowerCase()
  
  // Improved matching for phrases and individual words
  const used = scenarioVocab.essential.filter(word => {
    // Handle multi-word phrases
    if (word.includes(' ')) {
      return lowerText.includes(word)
    }
    // Handle individual words with word boundaries to avoid partial matches
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i')
    return wordRegex.test(lowerText)
  })
  
  const missing = scenarioVocab.essential.filter(word => {
    if (word.includes(' ')) {
      return !lowerText.includes(word)
    }
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i')
    return !wordRegex.test(lowerText)
  })
  
  const coverage = scenarioVocab.essential.length > 0 ? used.length / scenarioVocab.essential.length : 0

  console.log('[checkEssentialVocabulary] Analysis:', {
    scenario,
    totalEssential: scenarioVocab.essential.length,
    used: used.length,
    coverage: Math.round(coverage * 100) + '%',
    usedWords: used,
    textSample: lowerText.substring(0, 100) + '...'
  })

  return { used, missing, coverage }
}

/**
 * Analyze formality level of Spanish text
 */
export function analyzeFormalityLevel(text: string): {
  level: 'tú' | 'usted' | 'mixed'
  confidence: number
  markers: string[]
} {
  const level = categorizeFormalityLevel(text)
  const lowerText = text.toLowerCase()
  
  const formalMarkers = ['usted', 'señor', 'señora', 'don', 'doña', 'disculpe']
  const informalMarkers = ['tú', 'güey', 'órale', 'sale', 'mano']
  
  const foundFormal = formalMarkers.filter(marker => lowerText.includes(marker))
  const foundInformal = informalMarkers.filter(marker => lowerText.includes(marker))
  
  const markers = [...foundFormal, ...foundInformal]
  const confidence = markers.length > 0 ? Math.min(markers.length / 3, 1) : 0

  return { level, confidence, markers }
}

// ============================================================================
// Integration Helpers for Enhanced Database
// ============================================================================

import type { VocabularyAnalysisResult, StruggleAnalysisResult, SpanishConversationAnalysis } from './types'
import type { LearnerProfile } from '../pedagogical-system'

/**
 * Convert Spanish analysis to enhanced database format
 */
export function convertToEnhancedDatabaseFormat(
  conversation: ConversationTurn[],
  scenario: string,
  level: SpanishLevel = 'beginner'
): {
  vocabularyAnalysis: VocabularyAnalysisResult
  struggleAnalysis: StruggleAnalysisResult
} {
  const analyzer = new SpanishConversationAnalyzer({
    level,
    focusScenario: scenario,
    regionalFocus: 'mexican',
    strictness: 'balanced',
    trackCulturalMarkers: true,
    enableGrammarAnalysis: true,
    enableMasteryTracking: true
  })

  const context: AnalysisContext = {
    scenario,
    learnerLevel: level,
    conversationHistory: conversation,
    previousMastery: [],
    strugglingAreas: []
  }

  const analysis = analyzer.analyzeConversation(conversation, context)
  
  return {
    vocabularyAnalysis: analyzer.generateVocabularyAnalysis(analysis),
    struggleAnalysis: analyzer.generateStruggleAnalysis(analysis)
  }
}

/**
 * Create a Spanish analyzer configured from a learner profile
 */
export function createAnalyzerFromProfile(
  profile: LearnerProfile, 
  scenario: string = 'taco_vendor'
): SpanishConversationAnalyzer {
  return new SpanishConversationAnalyzer({
    level: profile.level as SpanishLevel,
    focusScenario: scenario,
    regionalFocus: 'mexican',
    strictness: 'balanced',
    trackCulturalMarkers: true,
    enableGrammarAnalysis: true,
    enableMasteryTracking: true
  })
}

/**
 * Shorthand for getDatabaseAnalysis - returns database-ready analysis data
 */
export function getDatabaseAnalysis(): {
  vocabularyAnalysis: VocabularyAnalysisResult | null
  struggleAnalysis: StruggleAnalysisResult | null
  conversationAnalysis: SpanishConversationAnalysis | null
} {
  // This is a standalone helper, actual implementation should be in the conversation engine
  console.warn('[Spanish Analysis] getDatabaseAnalysis called on module - use from conversation engine instead')
  return {
    vocabularyAnalysis: null,
    struggleAnalysis: null,
    conversationAnalysis: null
  }
}

// ============================================================================
// Testing and Development Helpers
// ============================================================================

/**
 * Generate test conversation for development
 */
export function generateTestConversation(scenario: string = 'taco_vendor'): ConversationTurn[] {
  const testConversations = {
    taco_vendor: [
      { role: 'assistant' as const, text: '¡Hola güero! ¿Qué va a querer?', timestamp: '2025-01-01T10:00:00Z' },
      { role: 'user' as const, text: 'Hola, quiero dos tacos de pastor', timestamp: '2025-01-01T10:00:30Z' },
      { role: 'assistant' as const, text: '¡Órale! ¿Con todo?', timestamp: '2025-01-01T10:01:00Z' },
      { role: 'user' as const, text: 'Sí, con todo. ¿Cuánto cuesta?', timestamp: '2025-01-01T10:01:30Z' },
      { role: 'assistant' as const, text: 'Son 40 pesos, joven. ¿Para aquí o para llevar?', timestamp: '2025-01-01T10:02:00Z' },
      { role: 'user' as const, text: 'Para llevar, gracias', timestamp: '2025-01-01T10:02:30Z' }
    ],
    market: [
      { role: 'assistant' as const, text: '¡Buenos días! ¿Qué necesita?', timestamp: '2025-01-01T10:00:00Z' },
      { role: 'user' as const, text: 'Buenos días, ¿cuánto cuestan los tomates?', timestamp: '2025-01-01T10:00:30Z' },
      { role: 'assistant' as const, text: 'Están a 20 pesos el kilo, marchanta', timestamp: '2025-01-01T10:01:00Z' },
      { role: 'user' as const, text: 'Me da un kilo, por favor', timestamp: '2025-01-01T10:01:30Z' }
    ]
  }

  return testConversations[scenario as keyof typeof testConversations] || testConversations.taco_vendor
}

/**
 * Run development analysis on test data
 */
export function runDevelopmentAnalysis(scenario: string = 'taco_vendor'): {
  conversation: ConversationTurn[]
  analysis: any
  databaseFormat: any
} {
  const conversation = generateTestConversation(scenario)
  const analyzer = createTacoVendorAnalyzer('beginner')
  
  const context: AnalysisContext = {
    scenario,
    learnerLevel: 'beginner',
    conversationHistory: conversation,
    previousMastery: [],
    strugglingAreas: []
  }

  const analysis = analyzer.analyzeConversation(conversation, context)
  const databaseFormat = convertToEnhancedDatabaseFormat(conversation, scenario, 'beginner')

  return { conversation, analysis, databaseFormat }
}