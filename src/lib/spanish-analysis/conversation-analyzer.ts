/**
 * Spanish Conversation Analyzer
 * Core engine for analyzing Spanish learning conversations
 */

import {
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
  VocabularyCategory,
  GrammarType,
  CulturalType,
  StruggleType,
  MasteryLevel,
  ConfidenceLevel,
  VocabularyAnalysisResult,
  StruggleAnalysisResult
} from './types'

import {
  VOCABULARY_BY_CATEGORY,
  MEXICAN_EXPRESSIONS,
  SPANISH_GRAMMAR_PATTERNS,
  CULTURAL_CONTEXT,
  getVocabularyByCategory,
  getScenarioVocabulary,
  isMexicanExpression,
  categorizeFormalityLevel
} from './mexican-vocabulary'

// ============================================================================
// Main Spanish Conversation Analyzer Class
// ============================================================================

export class SpanishConversationAnalyzer {
  private config: SpanishAnalyzerConfig
  private scenarioVocabulary: ReturnType<typeof getScenarioVocabulary>

  constructor(config: SpanishAnalyzerConfig) {
    this.config = config
    this.scenarioVocabulary = getScenarioVocabulary(config.focusScenario)
  }

  // ============================================================================
  // Main Analysis Method
  // ============================================================================

  analyzeConversation(
    conversation: ConversationTurn[],
    context: AnalysisContext
  ): SpanishConversationAnalysis {
    const userTurns = conversation.filter(turn => turn.role === 'user')
    const assistantTurns = conversation.filter(turn => turn.role === 'assistant')

    // Core analysis
    const wordsUsed = this.analyzeUserVocabulary(userTurns, context)
    const wordsHeard = this.analyzeHeardVocabulary(assistantTurns, context)
    const phrasesUsed = this.analyzeUserPhrases(userTurns, context)
    
    // Grammar analysis
    const grammarPatterns = this.analyzeGrammarPatterns(userTurns)
    const correctUsage = grammarPatterns.filter(p => p.isCorrect)
    const errorPatterns = grammarPatterns.filter(p => !p.isCorrect)
    
    // Cultural analysis
    const culturalMarkers = this.analyzeCulturalMarkers(userTurns)
    const mexicanExpressions = this.extractMexicanExpressions(userTurns)
    const formalityConsistency = this.analyzeFormalityConsistency(userTurns)
    
    // Learning insights
    const strugglesDetected = this.detectStrugglePatterns(userTurns, errorPatterns)
    const masterySignals = this.detectMasterySignals(wordsUsed, correctUsage, culturalMarkers)
    const recommendedFocus = this.generateRecommendations(strugglesDetected, masterySignals, context)
    
    // Session metrics
    const sessionMetrics = this.calculateSessionMetrics(
      wordsUsed, 
      mexicanExpressions, 
      errorPatterns, 
      culturalMarkers
    )

    return {
      wordsUsed,
      wordsHeard,
      phrasesUsed,
      grammarPatterns,
      correctUsage,
      errorPatterns,
      culturalMarkers,
      mexicanExpressions,
      formalityConsistency,
      strugglesDetected,
      masterySignals,
      recommendedFocus,
      sessionMetrics
    }
  }

  // ============================================================================
  // Vocabulary Analysis Methods
  // ============================================================================

  private analyzeUserVocabulary(
    userTurns: ConversationTurn[],
    context: AnalysisContext
  ): AnalyzedWord[] {
    const analyzedWords: AnalyzedWord[] = []

    for (const turn of userTurns) {
      const words = this.extractSpanishWords(turn.text)
      
      for (const word of words) {
        const analysis = this.analyzeWord(word, turn.text, context)
        if (analysis) {
          analyzedWords.push({
            ...analysis,
            context: turn.text,
            timestamp: turn.timestamp
          })
        }
      }
    }

    return this.deduplicateWords(analyzedWords)
  }

  private analyzeHeardVocabulary(
    assistantTurns: ConversationTurn[],
    context: AnalysisContext
  ): AnalyzedWord[] {
    const heardWords: AnalyzedWord[] = []

    for (const turn of assistantTurns) {
      const words = this.extractSpanishWords(turn.text)
      
      for (const word of words) {
        const analysis = this.analyzeWord(word, turn.text, context)
        if (analysis) {
          heardWords.push({
            ...analysis,
            context: turn.text,
            timestamp: turn.timestamp,
            masteryLevel: 'introduced' // Default for heard words
          })
        }
      }
    }

    return this.deduplicateWords(heardWords)
  }

  private analyzeWord(
    word: string,
    context: string,
    analysisContext: AnalysisContext
  ): Omit<AnalyzedWord, 'context' | 'timestamp'> | null {
    const cleanWord = word.toLowerCase().trim()
    
    // Skip very short words or common function words
    if (cleanWord.length < 2 || ['el', 'la', 'un', 'en', 'de', 'y', 'o'].includes(cleanWord)) {
      return null
    }

    const category = this.categorizeWord(cleanWord)
    const masteryLevel = this.determineMasteryLevel(cleanWord, analysisContext)
    const confidence = this.calculateWordConfidence(cleanWord, context, analysisContext)

    return {
      word: cleanWord,
      translation: this.getTranslation(cleanWord),
      category,
      masteryLevel,
      confidence,
      isMexicanSpecific: isMexicanExpression(cleanWord),
      formalityLevel: this.getWordFormalityLevel(cleanWord)
    }
  }

  private extractSpanishWords(text: string): string[] {
    // Enhanced Spanish word extraction
    const cleanText = text.toLowerCase()
      .replace(/[¿¡.,!?()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Extract multi-word phrases first
    const phrases = this.extractSpanishPhrases(cleanText)
    
    // Then extract individual words
    const words = cleanText.split(/\s+/).filter(word => word.length > 1)
    
    // Combine and deduplicate
    return [...new Set([...phrases, ...words])]
  }

  private extractSpanishPhrases(text: string): string[] {
    const commonPhrases = [
      'buenos días', 'buenas tardes', 'buenas noches',
      'muchas gracias', 'de nada', 'por favor', 'con permiso',
      'me da', 'me gusta', 'no me gusta', 'está bien',
      'cuánto cuesta', 'cuánto es', 'para llevar', 'para aquí',
      'con todo', 'sin cebolla', 'sin cilantro', 'muy rico',
      'qué rico', 'está rico', 'hasta luego', 'que le vaya bien'
    ]

    return commonPhrases.filter(phrase => text.includes(phrase))
  }

  // ============================================================================
  // Grammar Analysis Methods
  // ============================================================================

  private analyzeGrammarPatterns(userTurns: ConversationTurn[]): GrammarPattern[] {
    const patterns: GrammarPattern[] = []

    for (const turn of userTurns) {
      patterns.push(...this.analyzeVerbConjugation(turn.text))
      patterns.push(...this.analyzeGenderAgreement(turn.text))
      patterns.push(...this.analyzeQuestionFormation(turn.text))
      patterns.push(...this.analyzeFormalityUsage(turn.text))
    }

    return patterns
  }

  private analyzeVerbConjugation(text: string): GrammarPattern[] {
    const patterns: GrammarPattern[] = []
    const lowerText = text.toLowerCase()

    // Check common verb patterns
    const verbPatterns = SPANISH_GRAMMAR_PATTERNS.verbConjugation.present

    for (const [verb, conjugations] of Object.entries(verbPatterns)) {
      for (const conjugation of conjugations) {
        if (lowerText.includes(conjugation)) {
          patterns.push({
            type: 'verb_conjugation',
            example: conjugation,
            isCorrect: true, // Assume correct if found in pattern
            difficulty: this.getVerbDifficulty(verb)
          })
        }
      }
    }

    return patterns
  }

  private analyzeGenderAgreement(text: string): GrammarPattern[] {
    const patterns: GrammarPattern[] = []
    const words = text.toLowerCase().split(/\s+/)

    // Look for article + noun combinations
    for (let i = 0; i < words.length - 1; i++) {
      const article = words[i]
      const noun = words[i + 1]
      
      const agreement = this.checkGenderAgreement(article, noun)
      if (agreement) {
        patterns.push(agreement)
      }
    }

    return patterns
  }

  private analyzeQuestionFormation(text: string): GrammarPattern[] {
    const patterns: GrammarPattern[] = []
    const lowerText = text.toLowerCase()

    const questionWords = SPANISH_GRAMMAR_PATTERNS.questionFormation.openEnded
    
    for (const qWord of questionWords) {
      if (lowerText.includes(qWord)) {
        patterns.push({
          type: 'question_formation',
          example: qWord,
          isCorrect: true,
          difficulty: 'basic'
        })
      }
    }

    return patterns
  }

  private analyzeFormalityUsage(text: string): GrammarPattern[] {
    const patterns: GrammarPattern[] = []
    const formalityLevel = categorizeFormalityLevel(text)

    if (formalityLevel !== 'mixed') {
      patterns.push({
        type: 'formality_choice',
        example: formalityLevel,
        isCorrect: true, // Consistency is good
        difficulty: 'intermediate'
      })
    }

    return patterns
  }

  // ============================================================================
  // Cultural Analysis Methods
  // ============================================================================

  private analyzeCulturalMarkers(userTurns: ConversationTurn[]): CulturalMarker[] {
    const markers: CulturalMarker[] = []

    for (const turn of userTurns) {
      markers.push(...this.findCulturalMarkers(turn.text, turn.timestamp))
    }

    return markers
  }

  private findCulturalMarkers(text: string, timestamp: string): CulturalMarker[] {
    const markers: CulturalMarker[] = []
    const lowerText = text.toLowerCase()

    // Check for Mexican slang
    for (const slangWord of MEXICAN_EXPRESSIONS.slang) {
      if (lowerText.includes(slangWord)) {
        markers.push({
          type: 'mexican_slang',
          expression: slangWord,
          context: text,
          authenticity: 'authentic_mexican',
          explanation: this.getSlangExplanation(slangWord)
        })
      }
    }

    // Check for formality markers
    for (const courtesyTerm of MEXICAN_EXPRESSIONS.courtesy) {
      if (lowerText.includes(courtesyTerm)) {
        markers.push({
          type: 'formality_marker',
          expression: courtesyTerm,
          context: text,
          authenticity: 'authentic_mexican'
        })
      }
    }

    // Check for food culture markers
    for (const foodTerm of MEXICAN_EXPRESSIONS.foodCulture) {
      if (lowerText.includes(foodTerm)) {
        markers.push({
          type: 'food_culture',
          expression: foodTerm,
          context: text,
          authenticity: 'authentic_mexican'
        })
      }
    }

    return markers
  }

  private extractMexicanExpressions(userTurns: ConversationTurn[]): string[] {
    const expressions = new Set<string>()

    for (const turn of userTurns) {
      const foundExpressions = this.findMexicanExpressions(turn.text)
      foundExpressions.forEach(expr => expressions.add(expr))
    }

    return Array.from(expressions)
  }

  private findMexicanExpressions(text: string): string[] {
    const found: string[] = []
    const lowerText = text.toLowerCase()

    const allMexican = [
      ...MEXICAN_EXPRESSIONS.slang,
      ...MEXICAN_EXPRESSIONS.courtesy,
      ...MEXICAN_EXPRESSIONS.foodCulture,
      ...MEXICAN_EXPRESSIONS.timeExpressions
    ]

    for (const expression of allMexican) {
      if (lowerText.includes(expression)) {
        found.push(expression)
      }
    }

    return found
  }

  private analyzeFormalityConsistency(userTurns: ConversationTurn[]) {
    const formalityLevels = userTurns.map(turn => categorizeFormalityLevel(turn.text))
    
    const formalCount = formalityLevels.filter(level => level === 'usted').length
    const informalCount = formalityLevels.filter(level => level === 'tú').length
    const mixedCount = formalityLevels.filter(level => level === 'mixed').length

    if (formalCount > informalCount && formalCount > mixedCount) return 'usted'
    if (informalCount > formalCount && informalCount > mixedCount) return 'tú'
    return 'mixed'
  }

  // ============================================================================
  // Learning Analysis Methods
  // ============================================================================

  private detectStrugglePatterns(
    userTurns: ConversationTurn[],
    errorPatterns: GrammarPattern[]
  ): StrugglePattern[] {
    const struggles: StrugglePattern[] = []

    // Grammar struggles
    if (errorPatterns.length > 0) {
      const grammarErrors = this.groupErrorsByType(errorPatterns)
      for (const [errorType, errors] of grammarErrors) {
        struggles.push({
          type: 'grammar_error',
          examples: errors.map(e => e.example),
          frequency: errors.length,
          severity: errors.length >= 3 ? 'major' : errors.length >= 2 ? 'moderate' : 'minor',
          suggestions: this.getGrammarSuggestions(errorType)
        })
      }
    }

    // Vocabulary gaps (essential words not used)
    const usedWords = userTurns.flatMap(turn => this.extractSpanishWords(turn.text))
    const missingEssential = this.scenarioVocabulary.essential.filter(
      word => !usedWords.includes(word)
    )

    if (missingEssential.length > 0) {
      struggles.push({
        type: 'vocabulary_gap',
        examples: missingEssential,
        frequency: missingEssential.length,
        severity: missingEssential.length >= 5 ? 'major' : 'moderate',
        suggestions: [`Practice essential ${this.config.focusScenario} vocabulary`]
      })
    }

    return struggles
  }

  private detectMasterySignals(
    wordsUsed: AnalyzedWord[],
    correctUsage: GrammarPattern[],
    culturalMarkers: CulturalMarker[]
  ): MasterySignal[] {
    const signals: MasterySignal[] = []

    // Vocabulary mastery
    const masteredWords = wordsUsed.filter(w => w.confidence > 0.8)
    if (masteredWords.length > 0) {
      signals.push({
        type: 'vocabulary',
        evidence: masteredWords.map(w => w.word),
        strength: masteredWords.length >= 10 ? 'strong' : masteredWords.length >= 5 ? 'developing' : 'emerging',
        category: 'general_conversation'
      })
    }

    // Grammar mastery
    if (correctUsage.length >= 3) {
      signals.push({
        type: 'grammar',
        evidence: correctUsage.map(g => g.example),
        strength: correctUsage.length >= 8 ? 'strong' : correctUsage.length >= 5 ? 'developing' : 'emerging',
        category: 'verb_conjugation'
      })
    }

    // Cultural mastery
    const authenticMarkers = culturalMarkers.filter(m => m.authenticity === 'authentic_mexican')
    if (authenticMarkers.length > 0) {
      signals.push({
        type: 'cultural',
        evidence: authenticMarkers.map(m => m.expression),
        strength: authenticMarkers.length >= 5 ? 'strong' : authenticMarkers.length >= 3 ? 'developing' : 'emerging',
        category: 'mexican_slang'
      })
    }

    return signals
  }

  private generateRecommendations(
    struggles: StrugglePattern[],
    mastery: MasterySignal[],
    context: AnalysisContext
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = []

    // Address major struggles first
    const majorStruggles = struggles.filter(s => s.severity === 'major')
    for (const struggle of majorStruggles) {
      recommendations.push({
        priority: 'high',
        focus: this.getStruggleFocus(struggle.type),
        reason: `Detected ${struggle.frequency} instances of ${struggle.type}`,
        suggestedActivities: struggle.suggestions,
        estimatedSessions: Math.ceil(struggle.frequency / 2)
      })
    }

    // Build on mastery areas
    const strongMastery = mastery.filter(m => m.strength === 'strong')
    for (const signal of strongMastery) {
      recommendations.push({
        priority: 'medium',
        focus: `Advanced ${signal.type} practice`,
        reason: `Strong ${signal.type} skills detected`,
        suggestedActivities: this.getAdvancedActivities(signal.type),
        estimatedSessions: 2
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // ============================================================================
  // Session Metrics Calculation
  // ============================================================================

  private calculateSessionMetrics(
    wordsUsed: AnalyzedWord[],
    mexicanExpressions: string[],
    errorPatterns: GrammarPattern[],
    culturalMarkers: CulturalMarker[]
  ): SessionMetrics {
    const totalSpanishWords = wordsUsed.length
    const uniqueSpanishWords = new Set(wordsUsed.map(w => w.word)).size
    const mexicanExpressionsUsed = mexicanExpressions.length
    
    const grammarAttempts = wordsUsed.length + errorPatterns.length
    const grammarErrorRate = grammarAttempts > 0 ? errorPatterns.length / grammarAttempts : 0
    
    const essentialWordsUsed = wordsUsed.filter(w => 
      this.scenarioVocabulary.essential.includes(w.word)
    ).length
    const vocabularyUsageRate = this.scenarioVocabulary.essential.length > 0 ? 
      essentialWordsUsed / this.scenarioVocabulary.essential.length : 0

    const authenticMarkers = culturalMarkers.filter(m => m.authenticity === 'authentic_mexican')
    const culturalAuthenticity = culturalMarkers.length > 0 ? 
      authenticMarkers.length / culturalMarkers.length : 0

    const avgConfidence = wordsUsed.length > 0 ? 
      wordsUsed.reduce((sum, w) => sum + w.confidence, 0) / wordsUsed.length : 0

    return {
      totalSpanishWords,
      uniqueSpanishWords,
      mexicanExpressionsUsed,
      grammarErrorRate,
      vocabularyUsageRate,
      culturalAuthenticity,
      overallConfidence: avgConfidence
    }
  }

  // ============================================================================
  // Database Integration Methods
  // ============================================================================

  generateVocabularyAnalysis(analysis: SpanishConversationAnalysis): VocabularyAnalysisResult {
    return {
      wordsUserUsed: analysis.wordsUsed.map(word => ({
        word: word.word,
        userSentence: word.context,
        timestamp: word.timestamp,
        confidence: this.mapConfidence(word.confidence),
        category: word.category,
        isMexicanSpecific: word.isMexicanSpecific
      })),
      
      wordsUserHeard: analysis.wordsHeard.map(word => ({
        word: word.word,
        aiSentence: word.context,
        timestamp: word.timestamp,
        category: word.category
      })),
      
      scenarioVocabulary: {
        essential: this.scenarioVocabulary.essential,
        contextual: this.scenarioVocabulary.contextual,
        mexican: this.scenarioVocabulary.cultural
      },
      
      masteryMetrics: {
        vocabularyUsageRate: analysis.sessionMetrics.vocabularyUsageRate,
        newWordsIntroduced: analysis.wordsHeard.length,
        mexicanExpressionsUsed: analysis.sessionMetrics.mexicanExpressionsUsed,
        grammarAccuracy: 1 - analysis.sessionMetrics.grammarErrorRate
      }
    }
  }

  generateStruggleAnalysis(analysis: SpanishConversationAnalysis): StruggleAnalysisResult {
    const avgSeverity = this.calculateAverageSeverity(analysis.strugglesDetected)
    
    return {
      overallDifficultyLevel: avgSeverity,
      
      strugglesDetected: analysis.strugglesDetected.map(struggle => ({
        type: struggle.type,
        content: struggle.examples.join(', '),
        timestamp: new Date().toISOString(),
        indicators: struggle.examples,
        severity: struggle.severity
      })),
      
      positiveIndicators: analysis.masterySignals.map(signal => ({
        type: signal.type,
        content: signal.evidence.join(', '),
        evidence: `${signal.strength} ${signal.type} skills`
      })),
      
      recommendedFollowUp: analysis.recommendedFocus.map(rec => rec.focus),
      culturalNotes: analysis.culturalMarkers.map(marker => 
        `Used ${marker.expression} (${marker.type})`
      )
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private categorizeWord(word: string): VocabularyCategory {
    for (const [category, words] of Object.entries(VOCABULARY_BY_CATEGORY)) {
      if (words.includes(word)) {
        return category as VocabularyCategory
      }
    }
    return 'general_conversation'
  }

  private determineMasteryLevel(word: string, context: AnalysisContext): MasteryLevel {
    if (context.previousMastery.includes(word)) return 'mastered'
    if (context.strugglingAreas.includes(word)) return 'recognized'
    return 'used' // First time using successfully
  }

  private calculateWordConfidence(word: string, context: string, analysisContext: AnalysisContext): number {
    let confidence = 0.5 // base confidence

    // Boost for essential vocabulary
    if (this.scenarioVocabulary.essential.includes(word)) confidence += 0.2
    
    // Boost for Mexican expressions
    if (isMexicanExpression(word)) confidence += 0.15
    
    // Boost for proper usage in context
    if (context.length > word.length * 3) confidence += 0.1
    
    // Penalty for struggling areas
    if (analysisContext.strugglingAreas.includes(word)) confidence -= 0.2

    return Math.max(0, Math.min(1, confidence))
  }

  private mapConfidence(score: number): ConfidenceLevel {
    if (score >= 0.7) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  private calculateAverageSeverity(struggles: StrugglePattern[]): 'easy' | 'moderate' | 'challenging' | 'difficult' {
    if (struggles.length === 0) return 'easy'
    
    const severityScores = struggles.map(s => {
      switch (s.severity) {
        case 'minor': return 1
        case 'moderate': return 2
        case 'major': return 3
        default: return 1
      }
    })
    
    const avgScore = severityScores.reduce((a, b) => a + b, 0) / severityScores.length
    
    if (avgScore >= 2.5) return 'difficult'
    if (avgScore >= 2) return 'challenging'
    if (avgScore >= 1.5) return 'moderate'
    return 'easy'
  }

  private deduplicateWords(words: AnalyzedWord[]): AnalyzedWord[] {
    const seen = new Set<string>()
    return words.filter(word => {
      if (seen.has(word.word)) return false
      seen.add(word.word)
      return true
    })
  }

  private analyzeUserPhrases(userTurns: ConversationTurn[], context: AnalysisContext): AnalyzedPhrase[] {
    // Implementation for phrase analysis
    return []
  }

  private getTranslation(word: string): string | undefined {
    // Simple translation mapping - could be enhanced with translation API
    const translations: Record<string, string> = {
      'tacos': 'tacos',
      'gracias': 'thank you',
      'hola': 'hello',
      'cuánto': 'how much',
      'cuesta': 'costs',
      'órale': 'wow/come on',
      'güero': 'blonde/white person (affectionate)'
    }
    return translations[word]
  }

  private getWordFormalityLevel(word: string) {
    const formal = SPANISH_GRAMMAR_PATTERNS.formalityMarkers.formal
    const informal = SPANISH_GRAMMAR_PATTERNS.formalityMarkers.informal
    
    if (formal.includes(word)) return 'usted'
    if (informal.includes(word)) return 'tú'
    return undefined
  }

  private getVerbDifficulty(verb: string): 'basic' | 'intermediate' | 'advanced' {
    const basicVerbs = ['ser', 'estar', 'tener', 'querer']
    const intermediateVerbs = ['gustar', 'pedir', 'poder']
    
    if (basicVerbs.includes(verb)) return 'basic'
    if (intermediateVerbs.includes(verb)) return 'intermediate'
    return 'advanced'
  }

  private checkGenderAgreement(article: string, noun: string): GrammarPattern | null {
    // Simplified gender agreement check
    const masculine = ['el', 'un', 'este']
    const feminine = ['la', 'una', 'esta']
    
    // This would need a comprehensive noun gender database
    // For now, just check obvious patterns
    if (masculine.includes(article) && noun.endsWith('a')) {
      return {
        type: 'gender_agreement',
        example: `${article} ${noun}`,
        isCorrect: false,
        suggestion: `la ${noun}`,
        difficulty: 'intermediate'
      }
    }
    
    return null
  }

  private groupErrorsByType(errors: GrammarPattern[]): Map<GrammarType, GrammarPattern[]> {
    const grouped = new Map<GrammarType, GrammarPattern[]>()
    
    for (const error of errors) {
      if (!grouped.has(error.type)) {
        grouped.set(error.type, [])
      }
      grouped.get(error.type)!.push(error)
    }
    
    return grouped
  }

  private getGrammarSuggestions(errorType: GrammarType): string[] {
    const suggestions = {
      verb_conjugation: ['Practice common verb conjugations', 'Focus on present tense patterns'],
      gender_agreement: ['Learn noun genders', 'Practice article-noun combinations'],
      formality_choice: ['Study tú vs usted usage', 'Practice formal/informal contexts'],
      question_formation: ['Practice question word placement', 'Study interrogative patterns']
    }
    
    return suggestions[errorType] || ['Continue practicing this grammar point']
  }

  private getStruggleFocus(type: StruggleType): string {
    const focuses = {
      vocabulary_gap: 'Essential vocabulary building',
      grammar_error: 'Grammar pattern practice',
      pronunciation_issue: 'Pronunciation training',
      cultural_misunderstanding: 'Cultural context learning',
      formality_confusion: 'Formality level practice',
      comprehension_difficulty: 'Listening comprehension'
    }
    
    return focuses[type] || 'General Spanish practice'
  }

  private getAdvancedActivities(type: 'vocabulary' | 'grammar' | 'cultural' | 'fluency'): string[] {
    const activities = {
      vocabulary: ['Learn advanced synonyms', 'Practice word families', 'Study regional variations'],
      grammar: ['Practice subjunctive mood', 'Study complex sentence structures', 'Learn advanced tenses'],
      cultural: ['Explore regional dialects', 'Study cultural nuances', 'Practice authentic expressions'],
      fluency: ['Focus on natural rhythm', 'Practice spontaneous conversation', 'Work on complex topics']
    }
    
    return activities[type] || ['Continue advanced practice']
  }

  private getSlangExplanation(slangWord: string): string {
    const explanations: Record<string, string> = {
      'órale': 'Multipurpose Mexican expression meaning wow, come on, or really',
      'güero': 'Affectionate term for someone with light hair/skin',
      'chido': 'Mexican slang for cool or awesome',
      'sale': 'Mexican way to say okay or sounds good',
      'ándale': 'Come on, hurry up, or that\'s right'
    }
    
    return explanations[slangWord] || 'Mexican cultural expression'
  }
}