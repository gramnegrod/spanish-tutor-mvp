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
// Essential Vocabulary Guide (for user reference)
// ============================================================================

export const ESSENTIAL_TACO_VENDOR_VOCABULARY = {
  ordering: ['quiero', 'me da', 'quisiera', 'deme', 'cuánto cuesta', 'cuánto es'],
  meats: ['pastor', 'carnitas', 'suadero', 'bistec', 'pollo'],
  toppings: ['con todo', 'sin cebolla', 'sin cilantro', 'salsa verde', 'salsa roja'],
  quantities: ['uno', 'dos', 'tres', 'cuatro', 'cinco'],
  payment: ['pesos', 'dinero', 'cambio', 'cuánto cuesta'],
  service: ['para llevar', 'para aquí', 'gracias', 'por favor']
};

// Function to get vocabulary expectations for UI display
export function getEssentialVocabularyGuide(scenario: string = 'taco_vendor') {
  if (scenario === 'taco_vendor') {
    return ESSENTIAL_TACO_VENDOR_VOCABULARY;
  }
  return ESSENTIAL_TACO_VENDOR_VOCABULARY; // Default fallback
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
      // Ordering phrases
      'quiero', 'me da', 'quisiera', 'deme', 'cuánto cuesta', 'cuánto es',
      // Core meats
      'pastor', 'carnitas', 'suadero', 'bistec', 'pollo',
      // Basic items
      'tacos', 'quesadillas', 'tortas',
      // Toppings
      'con todo', 'sin cebolla', 'sin cilantro', 'salsa verde', 'salsa roja',
      // Numbers (essential)
      'uno', 'dos', 'tres', 'cuatro', 'cinco',
      // Payment
      'pesos', 'dinero', 'cambio', 'cuesta',
      // Service
      'para llevar', 'para aquí', 'gracias', 'por favor'
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
  },

  // ============================================================================
  // Mexico City Adventure Scenarios
  // ============================================================================

  mexico_city_adventure: {
    essential: [
      // Transportation
      'metro', 'metrobús', 'taxi', 'uber', 'pesero', 'microbús',
      'estación', 'línea', 'dirección', 'destino', 'parada',
      // Locations
      'centro', 'centro histórico', 'zócalo', 'bellas artes', 'chapultepec',
      'coyoacán', 'xochimilco', 'polanco', 'roma', 'condesa',
      // Basic navigation
      'dónde está', 'cómo llego', 'cuánto cuesta', 'cuánto tiempo',
      'cerca', 'lejos', 'derecha', 'izquierda', 'recto', 'esquina',
      // Money and shopping
      'precio', 'caro', 'barato', 'regatear', 'mercado', 'tienda'
    ],
    contextual: [
      // Tourism
      'turista', 'visitar', 'conocer', 'museo', 'catedral', 'palacio',
      'pirámides', 'teotihuacán', 'trajineras', 'mariachis',
      // Culture
      'cultura', 'arte', 'historia', 'tradición', 'folclor',
      'artesanías', 'souvenirs', 'recuerdos',
      // Food exploration
      'probar', 'típico', 'tradicional', 'especialidad', 'local',
      'street food', 'antojitos', 'elote', 'esquites', 'tamales'
    ],
    cultural: [
      // Mexico City specific slang
      'chilango', 'defeño', 'capitalino', 'órale', 'ándale pues',
      'qué padre', 'padrísimo', 'chido', 'neta', 'híjole',
      // Local expressions
      'está con madre', 'está de pelos', 'no manches', 'sale',
      'simón', 'nel', 'güey', 'wey', 'mano'
    ],
    formal: [
      'disculpe', 'me podría ayudar', 'dónde queda', 'cómo puedo llegar',
      'cuál es la mejor manera', 'me recomienda', 'muchas gracias',
      'con permiso', 'perdón por molestar'
    ],
    informal: [
      'oye', 'cómo le hago', 'por dónde', 'está lejos',
      'sale pues', 'órale', 'qué onda', 'está chido'
    ]
  },

  hotel_checkin: {
    essential: [
      'hotel', 'habitación', 'reservación', 'check-in', 'check-out',
      'llave', 'tarjeta', 'piso', 'ascensor', 'baño', 'cama'
    ],
    contextual: [
      'individual', 'doble', 'vista', 'mar', 'ciudad', 'wifi',
      'desayuno', 'incluido', 'estacionamiento', 'gimnasio', 'alberca'
    ],
    cultural: [
      'patrón', 'jefe', 'bienvenido', 'está todo en orden',
      'que disfrute su estancia'
    ],
    formal: [
      'tengo una reservación', 'me registra por favor',
      'quisiera una habitación', 'cuál es el horario'
    ],
    informal: [
      'tengo cuarto', 'mi habitación', 'dónde queda',
      'está incluido'
    ]
  },

  taxi_ride: {
    essential: [
      'taxi', 'taxista', 'destino', 'dirección', 'aeropuerto',
      'hotel', 'centro', 'cuánto', 'tarifa', 'metro'
    ],
    contextual: [
      'tráfico', 'rápido', 'ruta', 'conoce', 'atasque',
      'tiempo', 'prisa', 'urgente', 'turista', 'foráneo'
    ],
    cultural: [
      'jefe', 'patrón', 'amigo', 'güero', 'sale pues',
      'ándale', 'órale', 'está con madre'
    ],
    formal: [
      'me lleva a', 'cuánto me cobra', 'conoce la dirección',
      'cuál es la mejor ruta', 'tiene cambio'
    ],
    informal: [
      'vamos a', 'cuánto', 'conoces', 'por dónde',
      'sale', 'órale'
    ]
  },

  pharmacy: {
    essential: [
      'medicina', 'pastilla', 'tableta', 'dolor', 'farmacia', 'farmacéutico',
      'receta', 'médico', 'cada', 'horas', 'dosis', 'síntomas'
    ],
    contextual: [
      'antibiótico', 'jarabe', 'gotas', 'crema', 'pomada',
      'aspirina', 'paracetamol', 'ibuprofeno', 'genérico', 'original'
    ],
    cultural: [
      'licenciado', 'doctor', 'joven', 'señor farmacéutico',
      'está muy caro', 'hay más barato', 'sale muy bien'
    ],
    formal: [
      'necesito algo para', 'me duele', 'tengo dolor de',
      'me puede dar', 'cada cuántas horas', 'cuánto cuesta'
    ],
    informal: [
      'me da algo para', 'me duele', 'tengo esto',
      'cada cuánto', 'cuánto', 'está caro'
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