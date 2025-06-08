/**
 * Mexican Spanish Vocabulary Database
 * Comprehensive vocabulary organized by category and cultural context
 */

import { VocabularyCategory, ScenarioVocabulary } from './types'

// ============================================================================
// Core Mexican Spanish Vocabulary
// ============================================================================

export const MEXICAN_EXPRESSIONS = {
  // Quintessentially Mexican
  slang: [
    'órale', 'ándale', 'híjole', 'qué padre', 'padrísimo', 'chido', 'neta',
    'güey', 'wey', 'mano', 'carnál', 'compadre', 'jefe', 'jefa',
    'sale', 'simón', 'nel', 'óigame', 'mande', 'patrona', 'patrón'
  ],
  
  // Polite/respectful terms
  courtesy: [
    'joven', 'señor', 'señora', 'señorita', 'don', 'doña',
    'amigo', 'amiga', 'compadre', 'comadre', 'patroncito', 'güerito', 'güerita'
  ],
  
  // Food culture specific
  foodCulture: [
    'antojitos', 'garnachas', 'quesadillitas', 'taquitos', 'salsita',
    'picosito', 'aguacatito', 'limoncito', 'cilantrito', 'cebollita',
    'tortillitas', 'frijolitos', 'caldito', 'sopita',
    // Mexican taco specialties
    'pastor', 'al pastor', 'carnitas', 'suadero', 'barbacoa', 'cochinita'
  ],
  
  // Time and urgency
  timeExpressions: [
    'ahorita', 'ahoritita', 'al ratito', 'ya mero', 'luego luego',
    'rapidito', 'despacito', 'poquito', 'tantito'
  ],
  
  // Reactions and emotions
  reactions: [
    '¡órale!', '¡ándale pues!', '¡híjole!', '¡no manches!', '¡qué padre!',
    '¡está padrísimo!', '¡qué rico!', '¡buenísimo!', '¡sabroso!',
    'está de pelos', 'está con madre'
  ]
}

// ============================================================================
// Vocabulary by Category
// ============================================================================

export const VOCABULARY_BY_CATEGORY: Record<VocabularyCategory, string[]> = {
  food_ordering: [
    // Basic food items
    'tacos', 'quesadillas', 'tortas', 'tamales', 'elote', 'esquites',
    'pastor', 'carnitas', 'suadero', 'bistec', 'chorizo', 'longaniza',
    'pollo', 'res', 'cerdo', 'pescado', 'camarón',
    
    // Toppings and sides
    'cebolla', 'cilantro', 'limón', 'aguacate', 'piña', 'chiles',
    'salsa', 'verde', 'roja', 'picante', 'guacamole', 'crema',
    'queso', 'frijoles', 'arroz', 'nopales',
    
    // Ordering phrases
    'quiero', 'me da', 'quisiera', 'deme', 'póngame', 'me pone',
    'con todo', 'sin cebolla', 'sin cilantro', 'extra salsa',
    'para llevar', 'para aquí', 'para comer aquí'
  ],
  
  greetings_courtesy: [
    'hola', 'buenos días', 'buenas tardes', 'buenas noches',
    'gracias', 'muchas gracias', 'de nada', 'por favor',
    'disculpe', 'perdón', 'con permiso', 'hasta luego',
    'adiós', 'que le vaya bien', 'que esté bien', 'saludos'
  ],
  
  numbers_money: [
    'peso', 'pesos', 'centavos', 'dinero', 'cambio', 'feria',
    'cuánto', 'cuántos', 'cuesta', 'vale', 'precio',
    'barato', 'caro', 'cuesta mucho', 'está bien de precio',
    'uno', 'dos', 'tres', 'cuatro', 'cinco', 'diez', 'veinte', 'cincuenta'
  ],
  
  descriptions_opinions: [
    'rico', 'sabroso', 'delicioso', 'bueno', 'buenísimo', 'excelente',
    'muy rico', 'está rico', 'qué rico', 'picante', 'picoso',
    'suave', 'dulce', 'salado', 'fresco', 'caliente', 'frío',
    'grande', 'chico', 'mediano', 'mucho', 'poco', 'suficiente'
  ],
  
  mexican_expressions: MEXICAN_EXPRESSIONS.slang.concat(
    MEXICAN_EXPRESSIONS.courtesy,
    MEXICAN_EXPRESSIONS.reactions
  ),
  
  time_location: [
    'aquí', 'allá', 'acá', 'ahí', 'cerca', 'lejos', 'cerquita',
    'ahorita', 'ahora', 'luego', 'después', 'antes', 'ya',
    'temprano', 'tarde', 'mañana', 'hoy', 'ayer'
  ],
  
  questions_requests: [
    'qué', 'cómo', 'cuándo', 'dónde', 'cuánto', 'cuál', 'quién',
    'tiene', 'hay', 'puede', 'quiere', 'gusta', 'recomienda',
    'me ayuda', 'me dice', 'me explica', 'cómo se dice'
  ],
  
  reactions_emotions: [
    'muy bien', 'perfecto', 'excelente', 'fantástico', 'increíble',
    'me gusta', 'me encanta', 'está padre', 'qué bueno',
    'oh sí', 'claro', 'por supuesto', 'perfecto'
  ],
  
  family_relationships: [
    'familia', 'papá', 'mamá', 'hermano', 'hermana', 'hijo', 'hija',
    'esposo', 'esposa', 'novio', 'novia', 'amigo', 'amiga'
  ],
  
  general_conversation: [
    'sí', 'no', 'tal vez', 'quizás', 'claro', 'por supuesto',
    'está bien', 'no problem', 'todo bien', 'perfecto',
    'entiendo', 'no entiendo', 'cómo', 'perdón', 'otra vez'
  ]
}

// ============================================================================
// Scenario-Specific Vocabulary Sets
// ============================================================================

export const SCENARIO_VOCABULARIES: Record<string, ScenarioVocabulary> = {
  taco_vendor: {
    essential: [
      'tacos', 'quiero', 'cuánto', 'cuesta', 'pesos', 'gracias',
      'pastor', 'carnitas', 'con todo', 'para llevar'
    ],
    contextual: [
      'delicioso', 'picante', 'salsa', 'verde', 'roja', 'cebolla',
      'cilantro', 'limón', 'aguacate', 'quesadilla', 'torta'
    ],
    cultural: [
      'órale', 'joven', 'güero', 'patrón', 'sale', 'ándale',
      'ahorita', 'taquitos', 'salsita', 'picosito'
    ],
    formal: [
      'quisiera', 'me podría dar', 'por favor', 'muchas gracias',
      'disculpe', 'señor', 'usted tiene'
    ],
    informal: [
      'me da', 'dame', 'órale', 'está chido', 'sale pues',
      'qué padre', 'híjole'
    ]
  },
  
  market: {
    essential: [
      'frutas', 'verduras', 'cuánto', 'kilo', 'precio', 'fresco',
      'maduro', 'tomate', 'cebolla', 'chile', 'aguacate'
    ],
    contextual: [
      'orgánico', 'dulce', 'amargo', 'verde', 'maduro', 'peso',
      'balanza', 'bolsa', 'canasta', 'mercado', 'puesto'
    ],
    cultural: [
      'marchanta', 'casera', 'patrona', 'güerita', 'jefa',
      'rebaja', 'descuento', 'último precio', 'regalón'
    ],
    formal: [
      'señora', 'disculpe', 'me permite', 'podría ver',
      'está muy bueno', 'me llevo'
    ],
    informal: [
      'ándale', 'órale', 'sale', 'está padre', 'cómo no',
      'luego luego', 'ahorita'
    ]
  },
  
  restaurant: {
    essential: [
      'mesa', 'menú', 'carta', 'mesero', 'mesera', 'cuenta',
      'orden', 'platillo', 'bebida', 'agua', 'refresco'
    ],
    contextual: [
      'recomendación', 'especialidad', 'entrada', 'plato fuerte',
      'postre', 'propina', 'reservación', 'cocina', 'chef'
    ],
    cultural: [
      'joven', 'patroncito', 'compadre', 'está de pelos',
      'con madre', 'padrísimo', 'qué rico'
    ],
    formal: [
      'podríamos ver', 'nos trae', 'por favor', 'la cuenta',
      'está delicioso', 'felicidades al chef'
    ],
    informal: [
      'órale', 'sale', 'está chido', 'qué padre', 'híjole',
      'no manches', 'está buenísimo'
    ]
  }
}

// ============================================================================
// Grammar Pattern Templates
// ============================================================================

export const SPANISH_GRAMMAR_PATTERNS = {
  verbConjugation: {
    present: {
      querer: ['quiero', 'quieres', 'quiere', 'queremos', 'quieren'],
      gustar: ['me gusta', 'te gusta', 'le gusta', 'nos gusta', 'les gusta'],
      tener: ['tengo', 'tienes', 'tiene', 'tenemos', 'tienen'],
      ser: ['soy', 'eres', 'es', 'somos', 'son'],
      estar: ['estoy', 'estás', 'está', 'estamos', 'están']
    },
    preterite: {
      comer: ['comí', 'comiste', 'comió', 'comimos', 'comieron'],
      pedir: ['pedí', 'pediste', 'pidió', 'pedimos', 'pidieron']
    }
  },
  
  formalityMarkers: {
    formal: ['usted', 'señor', 'señora', 'don', 'doña', 'por favor', 'disculpe'],
    informal: ['tú', 'güey', 'mano', 'carnál', 'órale', 'sale']
  },
  
  questionFormation: {
    openEnded: ['qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'para qué'],
    closed: ['¿tiene?', '¿hay?', '¿puede?', '¿quiere?', '¿le gusta?'],
    mexican: ['¿mande?', '¿cómo dice?', '¿a poco?', '¿en serio?']
  },
  
  genderAgreement: {
    masculine: {
      articles: ['el', 'un', 'este', 'ese', 'aquel'],
      adjectives: ['bueno', 'rico', 'fresco', 'caliente', 'frío']
    },
    feminine: {
      articles: ['la', 'una', 'esta', 'esa', 'aquella'],
      adjectives: ['buena', 'rica', 'fresca', 'caliente', 'fría']
    }
  }
}

// ============================================================================
// Cultural Context Markers
// ============================================================================

export const CULTURAL_CONTEXT = {
  mexicanFormality: {
    respectTerms: ['joven', 'señor', 'señora', 'don', 'doña', 'patrón', 'patrona'],
    affectionateTerms: ['güerito', 'güerita', 'amigo', 'amiga', 'compadre', 'comadre'],
    generationalMarkers: ['mijo', 'mija', 'jefe', 'jefa']
  },
  
  foodCultureMarkers: {
    authentic: ['antojitos', 'garnachas', 'elote', 'esquites', 'tamales'],
    diminutives: ['taquitos', 'salsita', 'limoncito', 'tortillitas'],
    intensifiers: ['picosito', 'calientito', 'fresquecito', 'sabroso']
  },
  
  regionalExpressions: {
    mexicanCity: ['güey', 'neta', 'qué onda', 'está padrísimo', 'híjole'],
    northern: ['órale', 'ándale', 'sale', 'simón', 'nel'],
    central: ['mande', 'patroncito', 'jefe', 'jefa']
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getVocabularyByCategory(category: VocabularyCategory): string[] {
  return VOCABULARY_BY_CATEGORY[category] || []
}

export function getScenarioVocabulary(scenario: string): ScenarioVocabulary {
  return SCENARIO_VOCABULARIES[scenario] || {
    essential: [],
    contextual: [],
    cultural: [],
    formal: [],
    informal: []
  }
}

export function isMexicanExpression(word: string): boolean {
  const allMexican = [
    ...MEXICAN_EXPRESSIONS.slang,
    ...MEXICAN_EXPRESSIONS.courtesy,
    ...MEXICAN_EXPRESSIONS.foodCulture,
    ...MEXICAN_EXPRESSIONS.timeExpressions,
    ...MEXICAN_EXPRESSIONS.reactions
  ]
  return allMexican.includes(word.toLowerCase())
}

export function categorizeFormalityLevel(text: string): 'tú' | 'usted' | 'mixed' {
  const formalMarkers = SPANISH_GRAMMAR_PATTERNS.formalityMarkers.formal
  const informalMarkers = SPANISH_GRAMMAR_PATTERNS.formalityMarkers.informal
  
  const lowerText = text.toLowerCase()
  const hasFormal = formalMarkers.some(marker => lowerText.includes(marker))
  const hasInformal = informalMarkers.some(marker => lowerText.includes(marker))
  
  if (hasFormal && hasInformal) return 'mixed'
  if (hasFormal) return 'usted'
  if (hasInformal) return 'tú'
  return 'mixed' // default for ambiguous cases
}