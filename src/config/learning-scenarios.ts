import { LearningScenario } from '@/types/adaptive-learning';

export const learningScenarios: LearningScenario[] = [
  {
    id: 'travel_agency_booking',
    title: 'Booking a Trip at the Travel Agency',
    description: 'Learn to book flights and hotels while discussing dates, prices, and preferences',
    difficulty: 'beginner',
    estimated_duration: 10,
    goals: [
      {
        id: 'state_destination',
        description: 'State your desired destination clearly',
        required: true,
        linguistic_focus: 'vocabulary'
      },
      {
        id: 'understand_dates',
        description: 'Understand and confirm travel dates',
        required: true,
        linguistic_focus: 'functional'
      },
      {
        id: 'comprehend_price',
        description: 'Understand the price when stated',
        required: true,
        linguistic_focus: 'vocabulary'
      },
      {
        id: 'use_polite_forms',
        description: 'Use formal/polite speech appropriately',
        required: false,
        linguistic_focus: 'cultural'
      }
    ],
    context: {
      setting: 'A travel agency in Mexico City',
      role_student: 'A customer wanting to book a vacation',
      role_ai: 'A helpful travel agent',
      cultural_notes: [
        'Use "usted" form for formal interactions',
        'Prices are in Mexican pesos',
        'Common to negotiate or ask for packages'
      ]
    },
    vocabulary_focus: [
      'destinos', 'vuelo', 'hotel', 'fecha', 'precio',
      'ida y vuelta', 'temporada', 'disponible'
    ],
    grammar_focus: [
      'querer + infinitive',
      'poder + infinitive',
      'dates and numbers',
      'formal conjugations'
    ],
    system_prompt_template: `You are a Mexican travel agent helping a customer book a trip. 
    
    IMPORTANT TRACKING INSTRUCTIONS:
    - When you state prices, always say "PRECIO:" before the amount
    - If the student seems confused, say "CLARIFICATION:" before explaining
    - When the student successfully completes a booking step, say "ACHIEVEMENT:" with the step name
    - Track these specific events by including them naturally in your speech
    
    Student adaptations:
    {{USER_ADAPTATIONS}}
    
    Speak at {{SPEAKING_PACE}}x normal speed.
    Pause for {{PAUSE_DURATION}} seconds between major utterances.
    
    Be helpful but realistic. Ask about destinations, dates, budget.
    Use Mexican Spanish with local expressions.`
  },
  {
    id: 'restaurant_ordering',
    title: 'Ordering at a Traditional Restaurant',
    description: 'Navigate a restaurant menu, ask questions about dishes, and handle the full dining experience',
    difficulty: 'beginner',
    estimated_duration: 10,
    prerequisite_scenarios: ['travel_agency_booking'],
    goals: [
      {
        id: 'greet_waiter',
        description: 'Greet the waiter appropriately',
        required: true,
        linguistic_focus: 'cultural'
      },
      {
        id: 'ask_menu_questions',
        description: 'Ask at least one question about the menu',
        required: true,
        linguistic_focus: 'functional'
      },
      {
        id: 'order_complete_meal',
        description: 'Successfully order food and drinks',
        required: true,
        linguistic_focus: 'functional'
      },
      {
        id: 'understand_bill',
        description: 'Understand the bill total',
        required: true,
        linguistic_focus: 'vocabulary'
      },
      {
        id: 'use_subjunctive',
        description: 'Use subjunctive mood (e.g., "que tenga buen día")',
        required: false,
        linguistic_focus: 'grammar'
      }
    ],
    context: {
      setting: 'A traditional Mexican restaurant',
      role_student: 'A customer dining out',
      role_ai: 'A waiter/waitress',
      cultural_notes: [
        'Saying "provecho" to other diners is polite',
        'Tips (propina) are typically 10-15%',
        'Lunch is the main meal (2-4pm)'
      ]
    },
    vocabulary_focus: [
      'platillo', 'bebida', 'cuenta', 'propina', 'recomendación',
      'picante', 'vegetariano', 'postre', 'entrada'
    ],
    grammar_focus: [
      'me gustaría',
      'quisiera',
      'present subjunctive basics',
      'indirect object pronouns'
    ],
    system_prompt_template: `You are a Mexican waiter/waitress at a traditional restaurant.
    
    IMPORTANT TRACKING INSTRUCTIONS:
    - Say "PRECIO:" before stating any prices
    - Say "ACHIEVEMENT:" when the student completes a goal
    - Say "CONFUSION:" if the student seems lost
    - Note "SUBJUNCTIVE_ATTEMPT:" if they try to use subjunctive
    
    Student profile:
    {{USER_ADAPTATIONS}}
    
    Speaking pace: {{SPEAKING_PACE}}x
    Pause duration: {{PAUSE_DURATION}} seconds
    
    Be warm and helpful. Describe dishes when asked. 
    Make recommendations. Use Mexican Spanish.`
  },
  {
    id: 'medical_appointment',
    title: 'Visiting the Doctor',
    description: 'Describe symptoms, understand medical advice, and navigate a healthcare visit',
    difficulty: 'intermediate',
    estimated_duration: 10,
    prerequisite_scenarios: ['restaurant_ordering'],
    goals: [
      {
        id: 'describe_symptoms',
        description: 'Clearly describe at least two symptoms',
        required: true,
        linguistic_focus: 'vocabulary'
      },
      {
        id: 'use_body_parts',
        description: 'Correctly use body part vocabulary',
        required: true,
        linguistic_focus: 'vocabulary'
      },
      {
        id: 'understand_instructions',
        description: 'Understand medical instructions',
        required: true,
        linguistic_focus: 'functional'
      },
      {
        id: 'use_present_perfect',
        description: 'Use present perfect to describe duration',
        required: false,
        linguistic_focus: 'grammar'
      }
    ],
    context: {
      setting: 'A medical clinic in Mexico',
      role_student: 'A patient with mild symptoms',
      role_ai: 'A caring doctor',
      cultural_notes: [
        'Doctors are addressed as "Doctor/Doctora"',
        'Public healthcare (IMSS) vs private clinics',
        'Pharmacies often provide basic medical advice'
      ]
    },
    vocabulary_focus: [
      'dolor', 'fiebre', 'tos', 'mareado', 'medicina',
      'receta', 'alergia', 'síntomas', 'mejorarse'
    ],
    grammar_focus: [
      'me duele/me duelen',
      'hace + time + que',
      'present perfect',
      'commands for medical instructions'
    ],
    system_prompt_template: `You are a caring Mexican doctor seeing a patient.
    
    TRACKING MARKERS:
    - "SYMPTOM_DESCRIBED:" when patient describes a symptom well
    - "BODY_PART:" when they correctly name body parts  
    - "PERFECT_TENSE:" if they use present perfect
    - "INSTRUCTION_UNDERSTOOD:" when they acknowledge instructions
    
    Adaptations:
    {{USER_ADAPTATIONS}}
    
    Pace: {{SPEAKING_PACE}}x, Pauses: {{PAUSE_DURATION}}s
    
    Be professional but warm. Ask about symptoms, duration, allergies.
    Give clear medical advice. Use Mexican medical terminology.`
  }
];

export function getScenarioById(id: string): LearningScenario | undefined {
  return learningScenarios.find(scenario => scenario.id === id);
}

export function getNextScenario(currentId: string, userLevel: string): LearningScenario | undefined {
  const currentIndex = learningScenarios.findIndex(s => s.id === currentId);
  
  // Find next scenario that matches user level or is accessible
  for (let i = currentIndex + 1; i < learningScenarios.length; i++) {
    const scenario = learningScenarios[i];
    
    // Check if prerequisites are met
    if (scenario.prerequisite_scenarios) {
      // In real app, check if user has completed prerequisites
      // For now, just return next scenario
    }
    
    // Check if difficulty is appropriate
    if (scenario.difficulty === userLevel || 
        (userLevel === 'intermediate' && scenario.difficulty === 'beginner') ||
        (userLevel === 'advanced')) {
      return scenario;
    }
  }
  
  return undefined;
}

export function personalizeSystemPrompt(
  template: string,
  adaptations: {
    speaking_pace: number;
    pause_duration: number;
    common_errors: string[];
    struggle_areas: string[];
    mastered_concepts: string[];
  }
): string {
  const adaptationNotes = `
    Common errors to watch for: ${adaptations.common_errors.join(', ') || 'None recorded yet'}
    Areas of difficulty: ${adaptations.struggle_areas.join(', ') || 'None recorded yet'}
    Recently mastered: ${adaptations.mastered_concepts.join(', ') || 'None recorded yet'}
    
    If student makes these errors, gently correct them.
    If they use recently mastered concepts, acknowledge their progress.
  `;
  
  return template
    .replace('{{USER_ADAPTATIONS}}', adaptationNotes)
    .replace('{{SPEAKING_PACE}}', adaptations.speaking_pace.toString())
    .replace('{{PAUSE_DURATION}}', adaptations.pause_duration.toString());
}