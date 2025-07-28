// Journey-specific types
export type SupportLevel = 'full' | 'moderate' | 'minimal';

export interface ScenarioPerformance {
  score: number;
  fluency: number;
  accuracy: number;
  engagement: number;
  duration: number;
  mistakes: number;
}

export interface ConversationMetrics {
  duration: number;
  totalTurns?: number;
  avgResponseTime?: number;
  conversationFlow?: number;
  mistakes?: number;
}

export interface DifficultySettings {
  speechSpeed: number;
  supportLevel: SupportLevel;
  hintsEnabled: boolean;
}

export interface JourneyStatistics {
  totalScenarios: number;
  completedScenarios: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalConversations: number;
  totalTimeSpent: number;
  achievements: string[];
}

export interface CompletedScenario {
  completedAt: string;
  performance: ScenarioPerformance;
  attempts: number;
}

export interface JourneyProgress {
  userId: string;
  currentScenarioId: string;
  completedScenarios: Record<string, CompletedScenario>;
  unlockedScenarios: string[];
  achievements: string[];
  totalConversations: number;
  lastActivityDate: string;
}
export interface UnlockCriteria {
  comprehensionRate: number; // Percentage (0-100)
  vocabularyUsage: number; // Number of new words used
  conversationDuration: number; // Minutes
  culturalAppropriateness?: number; // Percentage (0-100) for formal scenarios
}

export interface JourneyScenario {
  id: string;
  scenarioId: string;
  order: number;
  difficulty: number; // 1-5 stars
  difficultyLevel: number; // 1-5 stars
  difficultyLabel: string;
  npcName: string; // NPC name for the scenario
  location: string; // Location where the scenario takes place
  prerequisites: string[]; // IDs of scenarios that must be completed
  unlockCriteria: UnlockCriteria;
  bonusObjectives?: {
    id: string;
    description: string;
    reward: string;
  }[];
}

export interface JourneyProgressItem {
  scenarioId: string;
  completed: boolean;
  unlocked: boolean;
  bestScore: number;
  attempts: number;
  bonusObjectivesCompleted: string[];
}

// Scenario mapping with difficulty levels
export interface JourneyCategory {
  id: string;
  name: string;
  description: string;
  scenarios: JourneyScenario[];
}

// Helper function to get NPC name and location from scenario ID
function getScenarioDetails(scenarioId: string): { npcName: string; location: string } {
  const details: Record<string, { npcName: string; location: string }> = {
    'taco_vendor': { npcName: 'Carlos', location: 'Street Food Market' },
    'street_directions': { npcName: 'Ana', location: 'Calle Regina' },
    'market_shopping': { npcName: 'Doña Maria', location: 'Mercado de Artesanías' },
    'taxi_ride': { npcName: 'Miguel', location: 'Taxi Stand' },
    'restaurant_ordering': { npcName: 'Sofía', location: 'Restaurant' },
    'hotel_checkin': { npcName: 'Roberto', location: 'Hotel Lobby' },
    'pharmacy_visit': { npcName: 'Dr. Martinez', location: 'Farmacia del Centro' },
    'medical_appointment': { npcName: 'Dra. Lopez', location: 'Medical Clinic' },
    'banking_service': { npcName: 'Sr. Hernandez', location: 'Banco Nacional' },
    'job_interview': { npcName: 'Lic. Garcia', location: 'Corporate Office' },
    'legal_consultation': { npcName: 'Abogada Ramirez', location: 'Law Office' }
  };
  return details[scenarioId] || { npcName: 'Assistant', location: 'Mexico City' };
}

export const journeyScenarios: JourneyScenario[] = [
  // Level 1 - Beginner (⭐)
  {
    id: 'taco_vendor',
    scenarioId: 'taco_vendor',
    order: 1,
    difficulty: 1,
    difficultyLevel: 1,
    difficultyLabel: 'Beginner',
    ...getScenarioDetails('taco_vendor'),
    prerequisites: [], // Always unlocked
    unlockCriteria: {
      comprehensionRate: 70,
      vocabularyUsage: 5,
      conversationDuration: 10
    },
    bonusObjectives: [
      { id: 'use_please', description: 'Use "por favor" naturally', reward: 'Polite Speaker Badge' },
      { id: 'order_variety', description: 'Order 3 different items', reward: 'Food Explorer Badge' }
    ]
  },
  {
    id: 'street_directions',
    scenarioId: 'street_directions',
    order: 2,
    difficulty: 1,
    difficultyLevel: 1,
    difficultyLabel: 'Beginner',
    ...getScenarioDetails('street_directions'),
    prerequisites: ['taco_vendor'],
    unlockCriteria: {
      comprehensionRate: 70,
      vocabularyUsage: 5,
      conversationDuration: 10
    },
    bonusObjectives: [
      { id: 'use_landmarks', description: 'Reference 2+ landmarks', reward: 'Navigator Badge' }
    ]
  },
  // Level 2 - Easy (⭐⭐)
  {
    id: 'market_shopping',
    scenarioId: 'market_shopping',
    order: 3,
    difficulty: 2,
    difficultyLevel: 2,
    difficultyLabel: 'Easy',
    ...getScenarioDetails('market_shopping'),
    prerequisites: ['street_directions'],
    unlockCriteria: {
      comprehensionRate: 70,
      vocabularyUsage: 6,
      conversationDuration: 12
    },
    bonusObjectives: [
      { id: 'negotiate', description: 'Successfully haggle price', reward: 'Bargain Hunter Badge' }
    ]
  },
  {
    id: 'taxi_ride',
    scenarioId: 'taxi_ride',
    order: 4,
    difficulty: 2,
    difficultyLevel: 2,
    difficultyLabel: 'Easy',
    ...getScenarioDetails('taxi_ride'),
    prerequisites: ['market_shopping'],
    unlockCriteria: {
      comprehensionRate: 70,
      vocabularyUsage: 6,
      conversationDuration: 12
    }
  },
  // Level 3 - Intermediate (⭐⭐⭐)
  {
    id: 'restaurant_ordering',
    scenarioId: 'restaurant_ordering',
    order: 5,
    difficulty: 3,
    difficultyLevel: 3,
    difficultyLabel: 'Intermediate',
    ...getScenarioDetails('restaurant_ordering'),
    prerequisites: ['taxi_ride'],
    unlockCriteria: {
      comprehensionRate: 75,
      vocabularyUsage: 7,
      conversationDuration: 15
    },
    bonusObjectives: [
      { id: 'ask_recommendation', description: 'Ask for recommendations', reward: 'Curious Diner Badge' }
    ]
  },
  {
    id: 'hotel_checkin',
    scenarioId: 'hotel_checkin',
    order: 6,
    difficulty: 3,
    difficultyLevel: 3,
    difficultyLabel: 'Intermediate',
    ...getScenarioDetails('hotel_checkin'),
    prerequisites: ['restaurant_ordering'],
    unlockCriteria: {
      comprehensionRate: 75,
      vocabularyUsage: 7,
      conversationDuration: 15,
      culturalAppropriateness: 80
    }
  },
  {
    id: 'pharmacy_visit',
    scenarioId: 'pharmacy_visit',
    order: 7,
    difficulty: 3,
    difficultyLevel: 3,
    difficultyLabel: 'Intermediate',
    ...getScenarioDetails('pharmacy_visit'),
    prerequisites: ['hotel_checkin'],
    unlockCriteria: {
      comprehensionRate: 75,
      vocabularyUsage: 8,
      conversationDuration: 15
    }
  },
  // Level 4 - Advanced (⭐⭐⭐⭐)
  {
    id: 'medical_appointment',
    scenarioId: 'medical_appointment',
    order: 8,
    difficulty: 4,
    difficultyLevel: 4,
    difficultyLabel: 'Advanced',
    ...getScenarioDetails('medical_appointment'),
    prerequisites: ['pharmacy_visit'],
    unlockCriteria: {
      comprehensionRate: 80,
      vocabularyUsage: 10,
      conversationDuration: 18,
      culturalAppropriateness: 80
    }
  },
  {
    id: 'banking_service',
    scenarioId: 'banking_service',
    order: 9,
    difficulty: 4,
    difficultyLevel: 4,
    difficultyLabel: 'Advanced',
    ...getScenarioDetails('banking_service'),
    prerequisites: ['medical_appointment'],
    unlockCriteria: {
      comprehensionRate: 80,
      vocabularyUsage: 10,
      conversationDuration: 18,
      culturalAppropriateness: 85
    }
  },
  // Level 5 - Expert (⭐⭐⭐⭐⭐)
  {
    id: 'job_interview',
    scenarioId: 'job_interview',
    order: 10,
    difficulty: 5,
    difficultyLevel: 5,
    difficultyLabel: 'Expert',
    ...getScenarioDetails('job_interview'),
    prerequisites: ['banking_service'],
    unlockCriteria: {
      comprehensionRate: 85,
      vocabularyUsage: 12,
      conversationDuration: 20,
      culturalAppropriateness: 90
    },
    bonusObjectives: [
      { id: 'professional_vocab', description: 'Use 5+ professional terms', reward: 'Professional Badge' }
    ]
  },
  {
    id: 'legal_consultation',
    scenarioId: 'legal_consultation',
    order: 11,
    difficulty: 5,
    difficultyLevel: 5,
    difficultyLabel: 'Expert',
    ...getScenarioDetails('legal_consultation'),
    prerequisites: ['job_interview'],
    unlockCriteria: {
      comprehensionRate: 85,
      vocabularyUsage: 15,
      conversationDuration: 20,
      culturalAppropriateness: 90
    }
  }
];

// Helper functions
export function getScenarioByOrder(order: number): JourneyScenario | undefined {
  return journeyScenarios.find(scenario => scenario.order === order);
}

export function getUnlockedScenarios(completedScenarios: string[]): JourneyScenario[] {
  return journeyScenarios.filter(scenario => {
    // First scenario is always unlocked
    if (scenario.order === 1) return true;
    
    // Check if all prerequisites are completed
    return scenario.prerequisites.every(prereq => completedScenarios.includes(prereq));
  });
}

export function checkUnlockCriteria(
  performance: {
    comprehensionRate: number;
    vocabularyUsage: number;
    conversationDuration: number;
    culturalAppropriateness?: number;
  },
  criteria: UnlockCriteria
): boolean {
  return (
    performance.comprehensionRate >= criteria.comprehensionRate &&
    performance.vocabularyUsage >= criteria.vocabularyUsage &&
    performance.conversationDuration >= criteria.conversationDuration &&
    (!criteria.culturalAppropriateness || 
      (performance.culturalAppropriateness ?? 0) >= criteria.culturalAppropriateness)
  );
}

export function getDifficultyStars(level: number): string {
  return '⭐'.repeat(level);
}

export const journeyConfig = {
  scenarios: journeyScenarios,
  totalScenarios: journeyScenarios.length,
  difficultyLevels: {
    1: 'Beginner',
    2: 'Easy',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert'
  },
  categories: [
    {
      id: 'beginner',
      name: 'Beginner',
      description: 'Start your Spanish journey with simple everyday scenarios',
      scenarios: journeyScenarios.filter(s => s.difficulty === 1)
    },
    {
      id: 'easy',
      name: 'Easy',
      description: 'Build confidence with slightly more complex interactions',
      scenarios: journeyScenarios.filter(s => s.difficulty === 2)
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      description: 'Handle real-world situations with growing fluency',
      scenarios: journeyScenarios.filter(s => s.difficulty === 3)
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'Navigate complex scenarios requiring cultural awareness',
      scenarios: journeyScenarios.filter(s => s.difficulty === 4)
    },
    {
      id: 'expert',
      name: 'Expert',
      description: 'Master professional and formal Spanish interactions',
      scenarios: journeyScenarios.filter(s => s.difficulty === 5)
    }
  ] as JourneyCategory[]
};