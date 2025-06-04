/**
 * Adventure Progression System
 * Tracks user progress through Mexico City Adventure
 */

import { NPCScenario } from '@/config/mexico-city-adventure';

export interface ScenarioProgress {
  scenarioId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  performance?: {
    comprehensionRate: number;
    successfulExchanges: number;
    totalExchanges: number;
    strugglingPhrases: string[];
    masteredPhrases: string[];
  };
}

export interface AdventureProgress {
  adventureId: string;
  userId?: string; // Optional for guest mode
  currentScenarioId?: string;
  startedAt: Date;
  lastActivityAt: Date;
  scenarios: Record<string, ScenarioProgress>;
  globalStats: {
    totalTimeMinutes: number;
    scenariosCompleted: number;
    averageComprehension: number;
    vocabularyMastered: string[];
  };
}

/**
 * Initialize a new adventure progress
 */
export function initializeAdventureProgress(
  adventureId: string,
  scenarios: NPCScenario[],
  userId?: string
): AdventureProgress {
  const scenarioProgress: Record<string, ScenarioProgress> = {};
  
  // Initialize all scenarios
  scenarios.forEach((scenario, index) => {
    scenarioProgress[scenario.id] = {
      scenarioId: scenario.id,
      status: index === 0 ? 'available' : 'locked'
    };
  });
  
  return {
    adventureId,
    userId,
    startedAt: new Date(),
    lastActivityAt: new Date(),
    scenarios: scenarioProgress,
    globalStats: {
      totalTimeMinutes: 0,
      scenariosCompleted: 0,
      averageComprehension: 0,
      vocabularyMastered: []
    }
  };
}

/**
 * Check if user meets requirements to progress
 */
export function canProgressToNext(
  currentScenario: NPCScenario,
  performance: ScenarioProgress['performance']
): boolean {
  if (!performance) return false;
  
  // Calculate success rate
  const successRate = performance.totalExchanges > 0
    ? performance.successfulExchanges / performance.totalExchanges
    : 0;
  
  // Check if meets minimum success rate
  return successRate >= currentScenario.minimumSuccessRate;
}

/**
 * Update scenario progress
 */
export function updateScenarioProgress(
  adventure: AdventureProgress,
  scenarioId: string,
  updates: Partial<ScenarioProgress>
): AdventureProgress {
  return {
    ...adventure,
    lastActivityAt: new Date(),
    scenarios: {
      ...adventure.scenarios,
      [scenarioId]: {
        ...adventure.scenarios[scenarioId],
        ...updates
      }
    }
  };
}

/**
 * Complete a scenario and unlock next
 */
export function completeScenario(
  adventure: AdventureProgress,
  completedScenarioId: string,
  performance: ScenarioProgress['performance'],
  nextScenarioId?: string
): AdventureProgress {
  const updatedAdventure = { ...adventure };
  
  // Mark current as completed
  updatedAdventure.scenarios[completedScenarioId] = {
    ...updatedAdventure.scenarios[completedScenarioId],
    status: 'completed',
    completedAt: new Date(),
    performance
  };
  
  // Unlock next scenario if provided
  if (nextScenarioId && updatedAdventure.scenarios[nextScenarioId]) {
    updatedAdventure.scenarios[nextScenarioId].status = 'available';
  }
  
  // Update global stats
  updatedAdventure.globalStats.scenariosCompleted += 1;
  
  // Update average comprehension
  const allCompletedScenarios = Object.values(updatedAdventure.scenarios)
    .filter(s => s.status === 'completed' && s.performance);
  
  if (allCompletedScenarios.length > 0) {
    const totalComprehension = allCompletedScenarios.reduce(
      (sum, s) => sum + (s.performance?.comprehensionRate || 0),
      0
    );
    updatedAdventure.globalStats.averageComprehension = 
      totalComprehension / allCompletedScenarios.length;
  }
  
  // Add mastered vocabulary
  if (performance?.masteredPhrases) {
    updatedAdventure.globalStats.vocabularyMastered = [
      ...new Set([
        ...updatedAdventure.globalStats.vocabularyMastered,
        ...performance.masteredPhrases
      ])
    ];
  }
  
  updatedAdventure.lastActivityAt = new Date();
  
  return updatedAdventure;
}

/**
 * Calculate time spent in scenario
 */
export function calculateScenarioTime(
  startedAt?: Date,
  completedAt?: Date
): number {
  if (!startedAt || !completedAt) return 0;
  
  const diffMs = completedAt.getTime() - startedAt.getTime();
  return Math.round(diffMs / 1000 / 60); // Convert to minutes
}

/**
 * Get current scenario status for UI display
 */
export function getScenarioDisplayStatus(
  scenario: NPCScenario,
  progress: ScenarioProgress
): {
  icon: string;
  text: string;
  canStart: boolean;
} {
  switch (progress.status) {
    case 'completed':
      return {
        icon: '✅',
        text: 'Completed',
        canStart: true // Can replay
      };
    
    case 'in_progress':
      return {
        icon: '▶️',
        text: 'Continue',
        canStart: true
      };
    
    case 'available':
      return {
        icon: '🔓',
        text: 'Start',
        canStart: true
      };
    
    case 'locked':
    default:
      return {
        icon: '🔒',
        text: 'Locked',
        canStart: false
      };
  }
}

/**
 * Save/Load functions for localStorage (guest mode)
 */
export function saveAdventureProgress(
  progress: AdventureProgress,
  storageKey: string = 'mexico-city-adventure-progress'
): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }
}

export function loadAdventureProgress(
  storageKey: string = 'mexico-city-adventure-progress'
): AdventureProgress | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsed.startedAt = new Date(parsed.startedAt);
        parsed.lastActivityAt = new Date(parsed.lastActivityAt);
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved progress:', e);
      }
    }
  }
  return null;
}