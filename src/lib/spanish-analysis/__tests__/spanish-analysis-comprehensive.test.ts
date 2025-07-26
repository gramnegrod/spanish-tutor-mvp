import {
  analyzeSpanishText,
  checkEssentialVocabulary,
  analyzeFormalityLevel,
  convertToEnhancedDatabaseFormat,
  createAnalyzerFromProfile,
  getDatabaseAnalysis,
  runDevelopmentAnalysis,
  getEssentialVocabularyGuide
} from '../index'
import { 
  extractSpanishContent,
  detectLanguageSwitching,
  analyzeConversation
} from '../conversation-analyzer'
import type { ConversationTurn, SpanishLevel } from '../types'
import type { LearnerProfile } from '../../pedagogical-system'

// Mock console.warn to avoid test output noise
const originalWarn = console.warn
beforeAll(() => {
  console.warn = jest.fn()
})
afterAll(() => {
  console.warn = originalWarn
})

describe('Spanish Analysis Comprehensive Tests', () => {
  describe('extractSpanishContent', () => {
    it('should extract Spanish words from mixed language text', () => {
      const text = 'Hola amigo, how are you? Quiero dos tacos por favor'
      const result = extractSpanishContent(text)
      
      expect(result.spanishWords).toContain('hola')
      expect(result.spanishWords).toContain('amigo')
      expect(result.spanishWords).toContain('quiero')
      expect(result.spanishWords).toContain('dos')
      expect(result.spanishWords).toContain('tacos')
      expect(result.spanishWords).toContain('por favor')
      expect(result.spanishWords).not.toContain('how')
      expect(result.spanishWords).not.toContain('are')
      expect(result.spanishWords).not.toContain('you')
    })

    it('should detect Mexican expressions', () => {
      const text = '¡Órale güero! ¿Qué onda? Sale, vamos por unos tacos'
      const result = extractSpanishContent(text)
      
      expect(result.mexicanExpressions).toContain('órale')
      expect(result.mexicanExpressions).toContain('güero')
      expect(result.mexicanExpressions).toContain('sale')
    })

    it('should handle phrases correctly', () => {
      const text = 'Por favor, con todo, para llevar'
      const result = extractSpanishContent(text)
      
      expect(result.phrases).toContain('por favor')
      expect(result.phrases).toContain('con todo')
      expect(result.phrases).toContain('para llevar')
    })

    it('should handle empty text', () => {
      const result = extractSpanishContent('')
      
      expect(result.spanishWords).toEqual([])
      expect(result.mexicanExpressions).toEqual([])
      expect(result.phrases).toEqual([])
    })

    it('should handle text with punctuation', () => {
      const text = '¡Hola! ¿Cómo estás? Muy bien, gracias.'
      const result = extractSpanishContent(text)
      
      expect(result.spanishWords).toContain('hola')
      expect(result.spanishWords).toContain('cómo')
      expect(result.spanishWords).toContain('estás')
      expect(result.spanishWords).toContain('muy')
      expect(result.spanishWords).toContain('bien')
      expect(result.spanishWords).toContain('gracias')
    })
  })

  describe('detectLanguageSwitching', () => {
    it('should detect language switching in conversation', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Hola, I want some tacos', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'assistant', text: '¡Claro! ¿Cuántos tacos quiere?', timestamp: '2025-01-01T10:00:30Z' },
        { role: 'user', text: 'Two tacos de pastor, por favor', timestamp: '2025-01-01T10:01:00Z' }
      ]
      
      const switches = detectLanguageSwitching(conversation)
      
      expect(switches.length).toBeGreaterThan(0)
      expect(switches[0].type).toBe('code_switch')
      expect(switches[0].fromLanguage).toBe('spanish')
      expect(switches[0].toLanguage).toBe('english')
    })

    it('should handle conversation without switching', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Hola, quiero dos tacos', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'assistant', text: '¡Claro! ¿Con todo?', timestamp: '2025-01-01T10:00:30Z' }
      ]
      
      const switches = detectLanguageSwitching(conversation)
      
      expect(switches.length).toBe(0)
    })

    it('should detect multiple switches in one turn', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Quiero some tacos con everything por favor', timestamp: '2025-01-01T10:00:00Z' }
      ]
      
      const switches = detectLanguageSwitching(conversation)
      
      expect(switches.length).toBeGreaterThan(0)
      expect(switches.some(s => s.context.includes('some'))).toBe(true)
      expect(switches.some(s => s.context.includes('everything'))).toBe(true)
    })
  })

  describe('analyzeConversation enhanced features', () => {
    it('should analyze comprehension based on responses', () => {
      const conversation: ConversationTurn[] = [
        { role: 'assistant', text: '¿Cuántos tacos quiere?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Dos tacos, por favor', timestamp: '2025-01-01T10:00:30Z' },
        { role: 'assistant', text: '¿Con salsa verde o roja?', timestamp: '2025-01-01T10:01:00Z' },
        { role: 'user', text: 'Salsa verde', timestamp: '2025-01-01T10:01:30Z' }
      ]
      
      const analysis = analyzeConversation(conversation, {
        scenario: 'taco_vendor',
        learnerLevel: 'beginner',
        conversationHistory: conversation,
        previousMastery: [],
        strugglingAreas: []
      })
      
      expect(analysis.comprehensionScore).toBeGreaterThan(0.7)
      expect(analysis.responseAppropriacy).toBeGreaterThan(0.7)
    })

    it('should detect grammar errors', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Yo querer dos taco', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Cuánto costar esto?', timestamp: '2025-01-01T10:00:30Z' }
      ]
      
      const analysis = analyzeConversation(conversation, {
        scenario: 'taco_vendor',
        learnerLevel: 'beginner',
        conversationHistory: conversation,
        previousMastery: [],
        strugglingAreas: []
      })
      
      expect(analysis.grammarErrors.length).toBeGreaterThan(0)
      expect(analysis.grammarErrors.some(e => e.type === 'infinitive_usage')).toBe(true)
    })

    it('should track vocabulary repetition', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Quiero tacos', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Quiero tacos con todo', timestamp: '2025-01-01T10:00:30Z' },
        { role: 'user', text: 'Los tacos están buenos', timestamp: '2025-01-01T10:01:00Z' }
      ]
      
      const analysis = analyzeConversation(conversation, {
        scenario: 'taco_vendor',
        learnerLevel: 'beginner',
        conversationHistory: conversation,
        previousMastery: [],
        strugglingAreas: []
      })
      
      expect(analysis.vocabularyDiversity).toBeLessThan(0.8)
      expect(analysis.wordsUsed.some(w => w.word === 'tacos' && w.frequency > 1)).toBe(true)
    })
  })

  describe('createAnalyzerFromProfile', () => {
    it('should create analyzer from learner profile', () => {
      const profile: LearnerProfile = {
        id: 'test-user',
        level: 'intermediate',
        strengths: ['vocabulary'],
        weaknesses: ['grammar'],
        preferredScenarios: ['taco_vendor'],
        learningGoals: ['conversational_fluency'],
        culturalInterests: ['mexican_cuisine']
      }
      
      const analyzer = createAnalyzerFromProfile(profile, 'restaurant')
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Quiero la cuenta por favor', timestamp: '2025-01-01T10:00:00Z' }
      ]
      
      const analysis = analyzer.analyzeConversation(conversation, {
        scenario: 'restaurant',
        learnerLevel: 'intermediate',
        conversationHistory: conversation,
        previousMastery: [],
        strugglingAreas: []
      })
      
      expect(analysis).toBeDefined()
      expect(analysis.wordsUsed.length).toBeGreaterThan(0)
    })
  })

  describe('getDatabaseAnalysis', () => {
    it('should return null values with warning', () => {
      const result = getDatabaseAnalysis()
      
      expect(result.vocabularyAnalysis).toBeNull()
      expect(result.struggleAnalysis).toBeNull()
      expect(result.conversationAnalysis).toBeNull()
      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe('runDevelopmentAnalysis', () => {
    it('should generate test conversation and analysis for taco vendor', () => {
      const result = runDevelopmentAnalysis('taco_vendor')
      
      expect(result.conversation).toBeDefined()
      expect(result.conversation.length).toBeGreaterThan(0)
      expect(result.analysis).toBeDefined()
      expect(result.databaseFormat).toBeDefined()
      expect(result.databaseFormat.vocabularyAnalysis).toBeDefined()
      expect(result.databaseFormat.struggleAnalysis).toBeDefined()
    })

    it('should generate test conversation for market scenario', () => {
      const result = runDevelopmentAnalysis('market')
      
      expect(result.conversation.some(turn => turn.text.includes('tomates'))).toBe(true)
      expect(result.conversation.some(turn => turn.text.includes('kilo'))).toBe(true)
    })
  })

  describe('getEssentialVocabularyGuide', () => {
    it('should return taco vendor vocabulary guide', () => {
      const guide = getEssentialVocabularyGuide('taco_vendor')
      
      expect(guide).toBeDefined()
      expect(guide.ordering).toContain('quiero')
      expect(guide.meats).toContain('pastor')
      expect(guide.toppings).toContain('con todo')
      expect(guide.payment).toContain('cuánto cuesta')
      expect(guide.service).toContain('para llevar')
    })

    it('should return default guide for unknown scenario', () => {
      const guide = getEssentialVocabularyGuide('unknown')
      
      expect(guide).toBeDefined()
      expect(guide.ordering).toBeDefined()
    })
  })

  describe('Enhanced vocabulary analysis', () => {
    it('should categorize words by difficulty level', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Hola, quisiera ordenar unos antojitos mexicanos', timestamp: '2025-01-01T10:00:00Z' }
      ]
      
      const { vocabularyAnalysis } = convertToEnhancedDatabaseFormat(conversation, 'restaurant', 'intermediate')
      
      expect(vocabularyAnalysis.wordsUserUsed.some(w => w.word === 'hola' && w.difficulty === 'basic')).toBe(true)
      expect(vocabularyAnalysis.wordsUserUsed.some(w => w.word === 'quisiera' && w.difficulty === 'intermediate')).toBe(true)
      expect(vocabularyAnalysis.wordsUserUsed.some(w => w.word === 'antojitos' && w.difficulty === 'advanced')).toBe(true)
    })

    it('should track Mexican-specific vocabulary usage', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: '¡Órale! Me da unos taquitos con salsita verde, joven', timestamp: '2025-01-01T10:00:00Z' }
      ]
      
      const { vocabularyAnalysis } = convertToEnhancedDatabaseFormat(conversation, 'taco_vendor', 'beginner')
      
      const mexicanWords = vocabularyAnalysis.wordsUserUsed.filter(w => w.isMexicanSpecific)
      expect(mexicanWords.length).toBeGreaterThan(0)
      expect(mexicanWords.some(w => w.word === 'órale')).toBe(true)
      expect(mexicanWords.some(w => w.word === 'joven')).toBe(true)
    })
  })

  describe('Struggle pattern detection', () => {
    it('should detect pronunciation struggles', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Quiero rr... arroz', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Y también tor... tortillas', timestamp: '2025-01-01T10:00:30Z' }
      ]
      
      const { struggleAnalysis } = convertToEnhancedDatabaseFormat(conversation, 'taco_vendor', 'beginner')
      
      expect(struggleAnalysis.strugglesDetected.some(s => s.type === 'pronunciation')).toBe(true)
      expect(struggleAnalysis.strugglesDetected.some(s => s.context.includes('rr'))).toBe(true)
    })

    it('should detect vocabulary gaps', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Quiero ese... ¿cómo se dice?... that meat', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'user', text: 'Y también the green sauce', timestamp: '2025-01-01T10:00:30Z' }
      ]
      
      const { struggleAnalysis } = convertToEnhancedDatabaseFormat(conversation, 'taco_vendor', 'beginner')
      
      expect(struggleAnalysis.strugglesDetected.some(s => s.type === 'vocabulary_gap')).toBe(true)
      expect(struggleAnalysis.strugglesDetected.some(s => s.suggestedWord === 'carne')).toBe(true)
      expect(struggleAnalysis.strugglesDetected.some(s => s.suggestedWord === 'salsa verde')).toBe(true)
    })
  })

  describe('Mastery signal detection', () => {
    it('should detect fluent phrase usage', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Disculpe joven, ¿me podría decir cuánto cuesta el kilo de carnitas?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'assistant', text: 'Claro, está a 180 pesos el kilo', timestamp: '2025-01-01T10:00:30Z' },
        { role: 'user', text: 'Ah, está un poco caro. ¿No me hace un descuentito?', timestamp: '2025-01-01T10:01:00Z' }
      ]
      
      const analysis = analyzeConversation(conversation, {
        scenario: 'market',
        learnerLevel: 'intermediate',
        conversationHistory: conversation,
        previousMastery: [],
        strugglingAreas: []
      })
      
      expect(analysis.masterySignals.length).toBeGreaterThan(0)
      expect(analysis.masterySignals.some(m => m.type === 'fluent_phrase')).toBe(true)
      expect(analysis.masterySignals.some(m => m.type === 'cultural_appropriacy')).toBe(true)
    })

    it('should detect appropriate register use', () => {
      const conversation: ConversationTurn[] = [
        { role: 'user', text: 'Buenos días señora, ¿tiene jitomates frescos?', timestamp: '2025-01-01T10:00:00Z' },
        { role: 'assistant', text: 'Sí joven, acabamos de recibirlos', timestamp: '2025-01-01T10:00:30Z' },
        { role: 'user', text: 'Perfecto, me da medio kilo por favor', timestamp: '2025-01-01T10:01:00Z' }
      ]
      
      const analysis = analyzeConversation(conversation, {
        scenario: 'market',
        learnerLevel: 'beginner',
        conversationHistory: conversation,
        previousMastery: [],
        strugglingAreas: []
      })
      
      expect(analysis.formalityConsistency).toBe('usted')
      expect(analysis.masterySignals.some(m => m.type === 'appropriate_register')).toBe(true)
    })
  })
})