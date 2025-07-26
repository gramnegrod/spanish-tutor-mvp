import { LearningScenario } from '@/types/adaptive-learning';

// Journey-specific types
export interface UnlockCriteria {
  comprehensionRate: number; // Percentage (0-100)
  vocabularyUsage: number; // Number of new words used
  conversationDuration: number; // Minutes
  culturalAppropriateness?: number; // Percentage (0-100) for formal scenarios
}

export interface JourneyScenario {
  scenarioId: string;
  order: number;
  difficultyLevel: number; // 1-5 stars
  difficultyLabel: string;
  prerequisites: string[]; // IDs of scenarios that must be completed
  unlockCriteria: UnlockCriteria;
  bonusObjectives?: {
    id: string;
    description: string;
    reward: string;
  }[];
}

export interface JourneyProgress {
  scenarioId: string;
  completed: boolean;
  unlocked: boolean;
  bestScore: number;
  attempts: number;
  bonusObjectivesCompleted: string[];
}

// Scenario mapping with difficulty levels
export const journeyScenarios: JourneyScenario[] = [
  // Level 1 - Beginner (⭐)
  {
    scenarioId: 'taco_vendor',
    order: 1,
    difficultyLevel: 1,
    difficultyLabel: 'Beginner',
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
    scenarioId: 'street_directions',
    order: 2,
    difficultyLevel: 1,
    difficultyLabel: 'Beginner',
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
    scenarioId: 'market_shopping',
    order: 3,
    difficultyLevel: 2,
    difficultyLabel: 'Easy',
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
    scenarioId: 'taxi_ride',
    order: 4,
    difficultyLevel: 2,
    difficultyLabel: 'Easy',
    prerequisites: ['market_shopping'],
    unlockCriteria: {
      comprehensionRate: 70,
      vocabularyUsage: 6,
      conversationDuration: 12
    }
  },
  // Level 3 - Intermediate (⭐⭐⭐)
  {
    scenarioId: 'restaurant_ordering',
    order: 5,
    difficultyLevel: 3,
    difficultyLabel: 'Intermediate',
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
    scenarioId: 'hotel_checkin',
    order: 6,
    difficultyLevel: 3,
    difficultyLabel: 'Intermediate',
    prerequisites: ['restaurant_ordering'],
    unlockCriteria: {
      comprehensionRate: 75,
      vocabularyUsage: 7,
      conversationDuration: 15,
      culturalAppropriateness: 80
    }
  },
  {
    scenarioId: 'pharmacy_visit',
    order: 7,
    difficultyLevel: 3,
    difficultyLabel: 'Intermediate',
    prerequisites: ['hotel_checkin'],
    unlockCriteria: {
      comprehensionRate: 75,
      vocabularyUsage: 8,
      conversationDuration: 15
    }
  },
  // Level 4 - Advanced (⭐⭐⭐⭐)
  {
    scenarioId: 'medical_appointment',
    order: 8,
    difficultyLevel: 4,
    difficultyLabel: 'Advanced',
    prerequisites: ['pharmacy_visit'],
    unlockCriteria: {
      comprehensionRate: 80,
      vocabularyUsage: 10,
      conversationDuration: 18,
      culturalAppropriateness: 80
    }
  },
  {
    scenarioId: 'banking_service',
    order: 9,
    difficultyLevel: 4,
    difficultyLabel: 'Advanced',
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
    scenarioId: 'job_interview',
    order: 10,
    difficultyLevel: 5,
    difficultyLabel: 'Expert',
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
    scenarioId: 'legal_consultation',
    order: 11,
    difficultyLevel: 5,
    difficultyLabel: 'Expert',
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
  }
};