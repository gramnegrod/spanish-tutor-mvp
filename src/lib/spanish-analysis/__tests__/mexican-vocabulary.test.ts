import {
  MEXICAN_EXPRESSIONS,
  VOCABULARY_BY_CATEGORY,
  SCENARIO_VOCABULARIES,
  SPANISH_GRAMMAR_PATTERNS,
  CULTURAL_CONTEXT,
  getVocabularyByCategory,
  getScenarioVocabulary,
  isMexicanExpression,
  categorizeFormalityLevel
} from '../mexican-vocabulary'

describe('Mexican Vocabulary Module', () => {
  describe('MEXICAN_EXPRESSIONS', () => {
    it('should contain all expected expression categories', () => {
      expect(MEXICAN_EXPRESSIONS).toHaveProperty('slang')
      expect(MEXICAN_EXPRESSIONS).toHaveProperty('courtesy')
      expect(MEXICAN_EXPRESSIONS).toHaveProperty('foodCulture')
      expect(MEXICAN_EXPRESSIONS).toHaveProperty('timeExpressions')
      expect(MEXICAN_EXPRESSIONS).toHaveProperty('reactions')
    })

    it('should have Mexican slang expressions', () => {
      expect(MEXICAN_EXPRESSIONS.slang).toContain('órale')
      expect(MEXICAN_EXPRESSIONS.slang).toContain('güey')
      expect(MEXICAN_EXPRESSIONS.slang).toContain('chido')
      expect(MEXICAN_EXPRESSIONS.slang).toContain('sale')
    })

    it('should have courtesy expressions', () => {
      expect(MEXICAN_EXPRESSIONS.courtesy).toContain('joven')
      expect(MEXICAN_EXPRESSIONS.courtesy).toContain('señor')
      expect(MEXICAN_EXPRESSIONS.courtesy).toContain('güerito')
    })

    it('should have food culture terms', () => {
      expect(MEXICAN_EXPRESSIONS.foodCulture).toContain('pastor')
      expect(MEXICAN_EXPRESSIONS.foodCulture).toContain('carnitas')
      expect(MEXICAN_EXPRESSIONS.foodCulture).toContain('taquitos')
    })
  })

  describe('VOCABULARY_BY_CATEGORY', () => {
    it('should contain all vocabulary categories', () => {
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('food_ordering')
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('greetings_courtesy')
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('numbers_money')
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('questions_phrases')
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('mexican_slang')
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('descriptors')
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('actions_commands')
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('time_expressions')
      expect(VOCABULARY_BY_CATEGORY).toHaveProperty('locations_directions')
    })

    it('should have food ordering vocabulary', () => {
      expect(VOCABULARY_BY_CATEGORY.food_ordering).toContain('tacos')
      expect(VOCABULARY_BY_CATEGORY.food_ordering).toContain('quiero')
      expect(VOCABULARY_BY_CATEGORY.food_ordering).toContain('pastor')
      expect(VOCABULARY_BY_CATEGORY.food_ordering).toContain('con todo')
    })

    it('should have question words and phrases', () => {
      expect(VOCABULARY_BY_CATEGORY.questions_phrases).toContain('qué')
      expect(VOCABULARY_BY_CATEGORY.questions_phrases).toContain('cuánto')
      expect(VOCABULARY_BY_CATEGORY.questions_phrases).toContain('dónde')
      expect(VOCABULARY_BY_CATEGORY.questions_phrases).toContain('cómo')
    })
  })

  describe('SCENARIO_VOCABULARIES', () => {
    it('should have taco vendor scenario vocabulary', () => {
      expect(SCENARIO_VOCABULARIES).toHaveProperty('taco_vendor')
      expect(SCENARIO_VOCABULARIES.taco_vendor).toHaveProperty('essential')
      expect(SCENARIO_VOCABULARIES.taco_vendor).toHaveProperty('contextual')
      expect(SCENARIO_VOCABULARIES.taco_vendor).toHaveProperty('cultural')
      expect(SCENARIO_VOCABULARIES.taco_vendor).toHaveProperty('formal')
      expect(SCENARIO_VOCABULARIES.taco_vendor).toHaveProperty('informal')
    })

    it('should have market scenario vocabulary', () => {
      expect(SCENARIO_VOCABULARIES).toHaveProperty('market')
      expect(SCENARIO_VOCABULARIES.market.essential).toContain('cuánto cuesta')
      expect(SCENARIO_VOCABULARIES.market.essential).toContain('kilo')
      expect(SCENARIO_VOCABULARIES.market.essential).toContain('fresco')
    })

    it('should have restaurant scenario vocabulary', () => {
      expect(SCENARIO_VOCABULARIES).toHaveProperty('restaurant')
      expect(SCENARIO_VOCABULARIES.restaurant.essential).toContain('mesa')
      expect(SCENARIO_VOCABULARIES.restaurant.essential).toContain('menú')
      expect(SCENARIO_VOCABULARIES.restaurant.essential).toContain('cuenta')
    })
  })

  describe('SPANISH_GRAMMAR_PATTERNS', () => {
    it('should have verb conjugation patterns', () => {
      expect(SPANISH_GRAMMAR_PATTERNS).toHaveProperty('verbConjugation')
      expect(SPANISH_GRAMMAR_PATTERNS.verbConjugation).toHaveProperty('present')
      expect(SPANISH_GRAMMAR_PATTERNS.verbConjugation.present).toHaveProperty('querer')
      expect(SPANISH_GRAMMAR_PATTERNS.verbConjugation.present.querer).toContain('quiero')
      expect(SPANISH_GRAMMAR_PATTERNS.verbConjugation.present.querer).toContain('quieres')
    })

    it('should have formality markers', () => {
      expect(SPANISH_GRAMMAR_PATTERNS).toHaveProperty('formalityMarkers')
      expect(SPANISH_GRAMMAR_PATTERNS.formalityMarkers.formal).toContain('usted')
      expect(SPANISH_GRAMMAR_PATTERNS.formalityMarkers.formal).toContain('señor')
      expect(SPANISH_GRAMMAR_PATTERNS.formalityMarkers.informal).toContain('tú')
      expect(SPANISH_GRAMMAR_PATTERNS.formalityMarkers.informal).toContain('güey')
    })

    it('should have question formation patterns', () => {
      expect(SPANISH_GRAMMAR_PATTERNS).toHaveProperty('questionFormation')
      expect(SPANISH_GRAMMAR_PATTERNS.questionFormation.openEnded).toContain('qué')
      expect(SPANISH_GRAMMAR_PATTERNS.questionFormation.openEnded).toContain('cómo')
      expect(SPANISH_GRAMMAR_PATTERNS.questionFormation.closed).toContain('¿tiene?')
      expect(SPANISH_GRAMMAR_PATTERNS.questionFormation.mexican).toContain('¿mande?')
    })
  })

  describe('getVocabularyByCategory', () => {
    it('should return vocabulary for valid category', () => {
      const greetings = getVocabularyByCategory('greetings_courtesy')
      expect(greetings).toContain('hola')
      expect(greetings).toContain('buenos días')
    })

    it('should return empty array for invalid category', () => {
      const invalid = getVocabularyByCategory('invalid_category' as any)
      expect(invalid).toEqual([])
    })
  })

  describe('getScenarioVocabulary', () => {
    it('should return taco vendor vocabulary', () => {
      const tacoVocab = getScenarioVocabulary('taco_vendor')
      expect(tacoVocab.essential).toContain('tacos')
      expect(tacoVocab.essential).toContain('cuánto cuesta')
      expect(tacoVocab.cultural).toContain('órale')
    })

    it('should return empty vocabulary structure for unknown scenario', () => {
      const generalVocab = getScenarioVocabulary('unknown_scenario')
      expect(generalVocab).toHaveProperty('essential')
      expect(generalVocab).toHaveProperty('contextual')
      expect(generalVocab).toHaveProperty('cultural')
      expect(generalVocab).toHaveProperty('formal')
      expect(generalVocab).toHaveProperty('informal')
      expect(generalVocab.essential).toEqual([])
    })

    it('should return market vocabulary', () => {
      const marketVocab = getScenarioVocabulary('market')
      expect(marketVocab.essential).toContain('kilo')
      expect(marketVocab.essential).toContain('cuánto cuesta')
    })
  })

  describe('isMexicanExpression', () => {
    it('should identify Mexican expressions', () => {
      expect(isMexicanExpression('órale')).toBe(true)
      expect(isMexicanExpression('güero')).toBe(true)
      expect(isMexicanExpression('chido')).toBe(true)
      expect(isMexicanExpression('mande')).toBe(true)
    })

    it('should return false for non-Mexican expressions', () => {
      expect(isMexicanExpression('hola')).toBe(false)
      expect(isMexicanExpression('gracias')).toBe(false)
      expect(isMexicanExpression('adiós')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(isMexicanExpression('ÓRALE')).toBe(true)
      expect(isMexicanExpression('GÜERO')).toBe(true)
    })
  })

  describe('categorizeFormalityLevel', () => {
    it('should categorize formal speech as usted', () => {
      expect(categorizeFormalityLevel('Disculpe señor, ¿usted quiere algo?')).toBe('usted')
      expect(categorizeFormalityLevel('Señora, con su permiso')).toBe('usted')
    })

    it('should categorize informal speech as tú', () => {
      expect(categorizeFormalityLevel('¿Tú quieres tacos?')).toBe('tú')
      expect(categorizeFormalityLevel('Oye güey, ¿qué onda?')).toBe('tú')
    })

    it('should categorize mixed formality as mixed', () => {
      expect(categorizeFormalityLevel('Señor, ¿tú quieres algo?')).toBe('mixed')
      expect(categorizeFormalityLevel('Disculpe, oye tú')).toBe('mixed')
    })

    it('should handle text without clear formality markers', () => {
      expect(categorizeFormalityLevel('Hola, quiero tacos')).toBe('mixed')
      expect(categorizeFormalityLevel('Buenos días')).toBe('mixed')
    })
  })

  describe('CULTURAL_CONTEXT', () => {
    it('should have Mexican formality markers', () => {
      expect(CULTURAL_CONTEXT).toHaveProperty('mexicanFormality')
      expect(CULTURAL_CONTEXT.mexicanFormality).toHaveProperty('respectTerms')
      expect(CULTURAL_CONTEXT.mexicanFormality).toHaveProperty('affectionateTerms')
      expect(CULTURAL_CONTEXT.mexicanFormality.respectTerms).toContain('joven')
      expect(CULTURAL_CONTEXT.mexicanFormality.respectTerms).toContain('señor')
    })

    it('should have food culture markers', () => {
      expect(CULTURAL_CONTEXT).toHaveProperty('foodCultureMarkers')
      expect(CULTURAL_CONTEXT.foodCultureMarkers).toHaveProperty('authentic')
      expect(CULTURAL_CONTEXT.foodCultureMarkers).toHaveProperty('diminutives')
      expect(CULTURAL_CONTEXT.foodCultureMarkers.authentic).toContain('antojitos')
      expect(CULTURAL_CONTEXT.foodCultureMarkers.diminutives).toContain('taquitos')
    })

    it('should have regional expressions', () => {
      expect(CULTURAL_CONTEXT).toHaveProperty('regionalExpressions')
      expect(CULTURAL_CONTEXT.regionalExpressions).toHaveProperty('mexicanCity')
      expect(CULTURAL_CONTEXT.regionalExpressions).toHaveProperty('northern')
      expect(CULTURAL_CONTEXT.regionalExpressions.mexicanCity).toContain('güey')
      expect(CULTURAL_CONTEXT.regionalExpressions.northern).toContain('órale')
    })
  })
})