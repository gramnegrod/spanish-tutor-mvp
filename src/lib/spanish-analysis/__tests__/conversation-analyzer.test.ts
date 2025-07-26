import { SpanishConversationAnalyzer } from '../conversation-analyzer'
import type { 
  ConversationTurn, 
  AnalysisContext, 
  SpanishAnalyzerConfig,
  AnalyzedWord,
  GrammarPattern,
  CulturalMarker,
  StrugglePattern,
  MasterySignal
} from '../types'

describe('SpanishConversationAnalyzer', () => {
  let analyzer: SpanishConversationAnalyzer
  let defaultConfig: SpanishAnalyzerConfig
  let defaultContext: AnalysisContext

  beforeEach(() => {
    defaultConfig = {
      level: 'beginner',
      focusScenario: 'taco_vendor',
      regionalFocus: 'mexican',
      strictness: 'balanced',
      trackCulturalMarkers: true,
      enableGrammarAnalysis: true,
      enableMasteryTracking: true
    }

    defaultContext = {
      scenario: 'taco_vendor',
      learnerLevel: 'beginner',
      conversationHistory: [],
      previousMastery: [],
      strugglingAreas: []
    }

    analyzer = new SpanishConversationAnalyzer(defaultConfig)
  })

  describe('analyzeConversation', () => {
    it('should analyze a basic conversation', () => {
      const conversation: ConversationTurn[] = [
        { role: 'assistant', text: '¡Hola! ¿Qué va a querer?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Hola, quiero dos tacos de pastor', timestamp: '2025-01-01T10:00:30Z' },
        { role: 'assistant', text: '¡Órale! ¿Con todo?', timestamp: '2025-01-01T10:01:00Z' },
        { role: 'user', text: 'Sí, con todo por favor', timestamp: '2025-01-01T10:01:30Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.wordsUsed.length).toBeGreaterThan(0)
      expect(analysis.wordsHeard.length).toBeGreaterThan(0)
      expect(analysis.sessionMetrics.totalSpanishWords).toBeGreaterThan(0)
    })

    it('should identify Mexican expressions', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: '¡Órale güey! Sale, dos tacos', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.mexicanExpressions).toContain('órale')
      expect(analysis.mexicanExpressions).toContain('güey')
      expect(analysis.mexicanExpressions).toContain('sale')
    })

    it('should detect grammar patterns', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Quiero tacos. ¿Cuánto cuesta?', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.grammarPatterns.length).toBeGreaterThan(0)
      const verbPatterns = analysis.grammarPatterns.filter(p => p.type === 'verb_conjugation')
      expect(verbPatterns.length).toBeGreaterThan(0)
      expect(verbPatterns.some(p => p.example === 'quiero')).toBe(true)
    })

    it('should analyze formality consistency', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Disculpe señor, ¿cuánto cuesta?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Muchas gracias señor', timestamp: '2025-01-01T10:00:30Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.formalityConsistency).toBe('usted')
    })

    it('should detect struggle patterns', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Yo want tacos', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'How much cuesta?', timestamp: '2025-01-01T10:00:30Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.strugglesDetected.length).toBeGreaterThan(0)
      const vocabGaps = analysis.strugglesDetected.filter(s => s.type === 'vocabulary_gap')
      expect(vocabGaps.length).toBeGreaterThan(0)
    })

    it('should detect mastery signals', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Buenos días, ¿me da dos tacos de pastor con todo? ¿Cuánto es?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Para llevar por favor. Muchas gracias.', timestamp: '2025-01-01T10:00:30Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.masterySignals.length).toBeGreaterThan(0)
      const vocabMastery = analysis.masterySignals.filter(s => s.type === 'vocabulary')
      expect(vocabMastery.length).toBeGreaterThan(0)
    })
  })

  describe('Vocabulary Analysis', () => {
    it('should extract and analyze Spanish words correctly', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Hola, quiero tacos con cilantro y cebolla', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const words = analysis.wordsUsed.map(w => w.word)

      expect(words).toContain('hola')
      expect(words).toContain('quiero')
      expect(words).toContain('tacos')
      expect(words).toContain('cilantro')
      expect(words).toContain('cebolla')
    })

    it('should categorize words correctly', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Tacos, salsa, tortilla', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const foodWords = analysis.wordsUsed.filter(w => w.category === 'food_ordering')

      expect(foodWords.length).toBeGreaterThan(0)
      expect(foodWords.some(w => w.word === 'tacos')).toBe(true)
    })

    it('should identify Mexican-specific words', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Órale güey, ándale', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const mexicanWords = analysis.wordsUsed.filter(w => w.isMexicanSpecific)

      expect(mexicanWords.length).toBe(3)
      expect(mexicanWords.some(w => w.word === 'órale')).toBe(true)
      expect(mexicanWords.some(w => w.word === 'güey')).toBe(true)
      expect(mexicanWords.some(w => w.word === 'ándale')).toBe(true)
    })

    it('should track words heard from assistant', () => {
      const conversation: ConversationTurn[] = [
        { role: 'assistant', text: '¡Provecho! Aquí están sus tacos', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Gracias', timestamp: '2025-01-01T10:00:30Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.wordsHeard.length).toBeGreaterThan(0)
      const heardWords = analysis.wordsHeard.map(w => w.word)
      expect(heardWords).toContain('provecho')
      expect(heardWords).toContain('tacos')
    })
  })

  describe('Grammar Analysis', () => {
    it('should detect verb conjugation patterns', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Yo quiero, tú quieres, él quiere', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const verbPatterns = analysis.grammarPatterns.filter(p => p.type === 'verb_conjugation')

      expect(verbPatterns.length).toBeGreaterThan(0)
      expect(verbPatterns.some(p => p.example === 'quiero')).toBe(true)
      expect(verbPatterns.some(p => p.example === 'quieres')).toBe(true)
      expect(verbPatterns.some(p => p.example === 'quiere')).toBe(true)
    })

    it('should detect question formation', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: '¿Cuánto cuesta? ¿Dónde está? ¿Qué es?', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const questionPatterns = analysis.grammarPatterns.filter(p => p.type === 'question_formation')

      expect(questionPatterns.length).toBeGreaterThan(0)
      expect(questionPatterns.some(p => p.example.includes('cuánto'))).toBe(true)
      expect(questionPatterns.some(p => p.example.includes('dónde'))).toBe(true)
      expect(questionPatterns.some(p => p.example.includes('qué'))).toBe(true)
    })

    it('should detect formality patterns', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Usted quiere tacos, señor?', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const formalityPatterns = analysis.grammarPatterns.filter(p => p.type === 'formality_choice')

      expect(formalityPatterns.length).toBeGreaterThan(0)
      expect(formalityPatterns[0].example).toBe('usted')
    })
  })

  describe('Cultural Markers', () => {
    it('should detect Mexican slang', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Órale güey, está chido', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const slangMarkers = analysis.culturalMarkers.filter(m => m.type === 'mexican_slang')

      expect(slangMarkers.length).toBeGreaterThan(0)
      expect(slangMarkers.some(m => m.expression === 'órale')).toBe(true)
      expect(slangMarkers.some(m => m.expression === 'chido')).toBe(true)
    })

    it('should detect formality markers', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Disculpe señor, con permiso', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const formalityMarkers = analysis.culturalMarkers.filter(m => m.type === 'formality_marker')

      expect(formalityMarkers.length).toBeGreaterThan(0)
      expect(formalityMarkers.some(m => m.expression.includes('disculpe'))).toBe(true)
      expect(formalityMarkers.some(m => m.expression.includes('con permiso'))).toBe(true)
    })

    it('should detect food culture references', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Tacos al pastor con salsa verde', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const foodMarkers = analysis.culturalMarkers.filter(m => m.type === 'food_culture')

      expect(foodMarkers.length).toBeGreaterThan(0)
      expect(foodMarkers.some(m => m.expression.includes('al pastor') || m.expression.includes('pastor'))).toBe(true)
      expect(foodMarkers.some(m => m.expression.includes('salsa verde') || m.expression.includes('verde'))).toBe(true)
    })
  })

  describe('Session Metrics', () => {
    it('should calculate comprehension score correctly', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Hola, quiero dos tacos de pastor con todo', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: '¿Cuánto cuesta? Para llevar por favor', timestamp: '2025-01-01T10:00:30Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const metrics = analysis.sessionMetrics

      expect(metrics.totalSpanishWords).toBeGreaterThan(0)
      expect(metrics.uniqueSpanishWords).toBeGreaterThan(0)
      expect(metrics.vocabularyUsageRate).toBeGreaterThan(0)
      expect(metrics.overallConfidence).toBeGreaterThan(0)
    })

    it('should track Mexican expressions usage', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Órale, sale güey', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.sessionMetrics.mexicanExpressionsUsed).toBe(3)
    })

    it('should calculate grammar error rate', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Quiero tacos', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'El tacos están buenos', timestamp: '2025-01-01T10:00:30Z' } // Grammar error
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.sessionMetrics.grammarErrorRate).toBeGreaterThanOrEqual(0)
      expect(analysis.sessionMetrics.grammarErrorRate).toBeLessThanOrEqual(1)
    })
  })

  describe('Database Integration', () => {
    it('should generate vocabulary analysis for database', () => {
      const conversation: ConversationTurn[] = [
        { role: 'assistant', text: '¡Hola! ¿Qué va a querer?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Dos tacos de pastor', timestamp: '2025-01-01T10:00:30Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const vocabAnalysis = analyzer.generateVocabularyAnalysis(analysis)

      expect(vocabAnalysis.wordsUserUsed.length).toBeGreaterThan(0)
      expect(vocabAnalysis.wordsUserHeard.length).toBeGreaterThan(0)
      expect(vocabAnalysis.scenarioVocabulary.essential.length).toBeGreaterThan(0)
      expect(vocabAnalysis.masteryMetrics.vocabularyUsageRate).toBeGreaterThanOrEqual(0)
    })

    it('should generate struggle analysis for database', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'I want tacos', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const struggleAnalysis = analyzer.generateStruggleAnalysis(analysis)

      expect(struggleAnalysis.overallDifficultyLevel).toBeDefined()
      expect(struggleAnalysis.strugglesDetected.length).toBeGreaterThan(0)
      expect(struggleAnalysis.recommendedFollowUp.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty conversation', () => {
      const conversation: ConversationTurn[] = []
      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.wordsUsed).toEqual([])
      expect(analysis.wordsHeard).toEqual([])
      expect(analysis.sessionMetrics.totalSpanishWords).toBe(0)
    })

    it('should handle conversation with only assistant turns', () => {
      const conversation: ConversationTurn[] = [
        { role: 'assistant', text: '¡Hola! ¿Qué va a querer?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'assistant', text: '¿Me escucha?', timestamp: '2025-01-01T10:00:30Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.wordsUsed).toEqual([])
      expect(analysis.wordsHeard.length).toBeGreaterThan(0)
    })

    it('should handle mixed language input', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Hello, quiero some tacos please', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)

      expect(analysis.wordsUsed.some(w => w.word === 'quiero')).toBe(true)
      expect(analysis.wordsUsed.some(w => w.word === 'tacos')).toBe(true)
    })

    it('should deduplicate repeated words', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Tacos tacos tacos', timestamp: '2025-01-01T10:00:00Z' }
      ]

      const analysis = analyzer.analyzeConversation(conversation, defaultContext)
      const tacoWords = analysis.wordsUsed.filter(w => w.word === 'tacos')

      expect(tacoWords.length).toBe(1)
    })
  })
})