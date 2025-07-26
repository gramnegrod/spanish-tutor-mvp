import {
  analyzeSpanishText,
  checkEssentialVocabulary,
  analyzeFormalityLevel,
  convertToEnhancedDatabaseFormat,
  createTacoVendorAnalyzer,
  createMarketAnalyzer,
  createRestaurantAnalyzer,
  createCustomAnalyzer,
  generateTestConversation
} from '../index'
import type { ConversationTurn, SpanishLevel } from '../types'

describe('Spanish Analysis Index Module', () => {
  describe('analyzeSpanishText', () => {
    it('should extract Spanish words from text', () => {
      const text = 'Hola, quiero dos tacos de pastor por favor'
      const result = analyzeSpanishText(text)
      
      expect(result.spanishWords).toContain('hola')
      expect(result.spanishWords).toContain('quiero')
      expect(result.spanishWords).toContain('tacos')
      expect(result.spanishWords).toContain('pastor')
      expect(result.spanishWords).toContain('por favor')
    })

    it('should identify Mexican expressions', () => {
      const text = '¡Órale güey! Sale, ¿qué va a querer?'
      const result = analyzeSpanishText(text)
      
      expect(result.mexicanExpressions).toContain('órale')
      expect(result.mexicanExpressions).toContain('güey')
      expect(result.mexicanExpressions).toContain('sale')
    })

    it('should respect scenario and level parameters', () => {
      const text = 'Necesito tortillas'
      const result = analyzeSpanishText(text, 'market', 'intermediate')
      
      expect(result.scenario).toBe('market')
      expect(result.level).toBe('intermediate')
    })
  })

  describe('checkEssentialVocabulary', () => {
    it('should identify used essential vocabulary', () => {
      const text = 'Hola, quiero tacos con todo. ¿Cuánto cuesta?'
      const result = checkEssentialVocabulary(text, 'taco_vendor')
      
      expect(result.used).toContain('tacos')
      expect(result.used).toContain('con todo')
      expect(result.used).toContain('cuánto cuesta')
      expect(result.coverage).toBeGreaterThan(0)
    })

    it('should identify missing essential vocabulary', () => {
      const text = 'Hola, tacos'
      const result = checkEssentialVocabulary(text, 'taco_vendor')
      
      expect(result.missing.length).toBeGreaterThan(0)
      expect(result.coverage).toBeLessThan(1)
    })

    it('should handle multi-word phrases correctly', () => {
      const text = 'Para llevar por favor'
      const result = checkEssentialVocabulary(text, 'taco_vendor')
      
      expect(result.used).toContain('para llevar')
      expect(result.used).toContain('por favor')
    })

    it('should avoid partial matches', () => {
      const text = 'tacosaurio' // Should not match 'tacos'
      const result = checkEssentialVocabulary(text, 'taco_vendor')
      
      expect(result.used).not.toContain('tacos')
    })
  })

  describe('analyzeFormalityLevel', () => {
    it('should detect formal speech (usted)', () => {
      const text = 'Disculpe señor, ¿cuánto cuesta esto?'
      const result = analyzeFormalityLevel(text)
      
      expect(result.level).toBe('usted')
      expect(result.markers).toContain('disculpe')
      expect(result.markers).toContain('señor')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should detect informal speech (tú)', () => {
      const text = '¡Órale güey! ¿Qué onda?'
      const result = analyzeFormalityLevel(text)
      
      expect(result.level).toBe('tú')
      expect(result.markers).toContain('órale')
      expect(result.markers).toContain('güey')
    })

    it('should detect mixed formality', () => {
      const text = 'Hola señor, ¿tú quieres tacos?'
      const result = analyzeFormalityLevel(text)
      
      expect(result.level).toBe('mixed')
      expect(result.markers).toContain('señor')
      expect(result.markers).toContain('tú')
    })
  })

  describe('Factory Functions', () => {
    it('should create taco vendor analyzer with correct config', () => {
      const analyzer = createTacoVendorAnalyzer('intermediate')
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Hola, quiero tacos', timestamp: new Date().toISOString() }
      ]
      
      const analysis = analyzer.analyzeConversation(conversation, {
        scenario: 'taco_vendor',
        learnerLevel: 'intermediate',
        conversationHistory: conversation,
        previousMastery: [],
        strugglingAreas: []
      })
      
      expect(analysis.wordsUsed.length).toBeGreaterThan(0)
    })

    it('should create market analyzer', () => {
      const analyzer = createMarketAnalyzer()
      expect(analyzer).toBeDefined()
    })

    it('should create restaurant analyzer', () => {
      const analyzer = createRestaurantAnalyzer('advanced')
      expect(analyzer).toBeDefined()
    })

    it('should create custom analyzer with provided config', () => {
      const analyzer = createCustomAnalyzer({
        level: 'beginner',
        focusScenario: 'general',
        regionalFocus: 'mexican',
        strictness: 'strict',
        trackCulturalMarkers: false,
        enableGrammarAnalysis: false,
        enableMasteryTracking: false
      })
      expect(analyzer).toBeDefined()
    })
  })

  describe('convertToEnhancedDatabaseFormat', () => {
    it('should convert analysis to database format', () => {
      const conversation: ConversationTurn[] = [
        { role: 'assistant', text: '¡Hola! ¿Qué va a querer?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Hola, quiero dos tacos de pastor', timestamp: '2025-01-01T10:00:30Z' }
      ]
      
      const result = convertToEnhancedDatabaseFormat(conversation, 'taco_vendor')
      
      expect(result.vocabularyAnalysis).toBeDefined()
      expect(result.vocabularyAnalysis.wordsUserUsed.length).toBeGreaterThan(0)
      expect(result.struggleAnalysis).toBeDefined()
    })
  })

  describe('generateTestConversation', () => {
    it('should generate taco vendor conversation', () => {
      const conversation = generateTestConversation('taco_vendor')
      
      expect(conversation.length).toBeGreaterThan(0)
      expect(conversation.some(turn => turn.text.toLowerCase().includes('tacos'))).toBe(true)
    })

    it('should generate market conversation', () => {
      const conversation = generateTestConversation('market')
      
      expect(conversation.length).toBeGreaterThan(0)
      expect(conversation.some(turn => turn.text.toLowerCase().includes('tomates'))).toBe(true)
    })

    it('should default to taco vendor for unknown scenario', () => {
      const conversation = generateTestConversation('unknown')
      
      expect(conversation.length).toBeGreaterThan(0)
      expect(conversation.some(turn => turn.text.toLowerCase().includes('tacos'))).toBe(true)
    })
  })
})