/**
 * Free Practice Module Configuration
 * Centralizes all settings for the free practice module
 */

import { ModuleDifficulty } from '../core/types';

// Module Metadata
export const MODULE_CONFIG = {
  id: 'free-practice',
  name: 'Free Practice',
  version: '1.0.0',
  description: 'Practice Spanish with diverse NPCs and scenarios',
  icon: '💬',
  defaultDifficulty: ModuleDifficulty.ALL,
  estimatedSessionDuration: 10, // minutes
  minimumSessionDuration: 3, // minutes
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  enableScenarioSearch: true,
  enableDifficultyFilter: true,
  enableProgressTracking: true,
  enableAchievements: true,
  enableFavorites: true,
  showEstimatedDuration: true,
  showSuccessMetrics: true,
} as const;

// Scenario type mappings from both systems
export const SCENARIO_MAPPINGS = {
  // From learning scenarios
  travel_agency: { icon: '✈️', category: 'Services' },
  restaurant: { icon: '🍽️', category: 'Dining' },
  medical: { icon: '🏥', category: 'Healthcare' },
  
  // From NPC scenarios  
  taco_vendor: { icon: '🌮', category: 'Street Food' },
  tour_guide: { icon: '🗺️', category: 'Tourism' },
  museum_docent: { icon: '🏛️', category: 'Culture' },
  market_vendor: { icon: '🛒', category: 'Shopping' },
  uber_driver: { icon: '🚗', category: 'Transport' },
  doctor: { icon: '👨‍⚕️', category: 'Healthcare' },
  restaurant_server: { icon: '👨‍🍳', category: 'Dining' },
  airbnb_host: { icon: '🏠', category: 'Accommodation' },
  cafe_barista: { icon: '☕', category: 'Dining' },
  hotel_concierge: { icon: '🏨', category: 'Services' },
  pharmacy_clerk: { icon: '💊', category: 'Healthcare' },
} as const;

// Progress Tracking Configuration
export const PROGRESS_CONFIG = {
  // What constitutes completion
  completion: {
    minDuration: 180, // 3 minutes minimum
    minInteractions: 5, // At least 5 exchanges
    minGoalsAchieved: 0.6, // 60% of goals if defined
  },
  
  // Success metrics thresholds
  success: {
    excellent: { accuracy: 0.9, fluency: 0.85 },
    good: { accuracy: 0.75, fluency: 0.7 },
    satisfactory: { accuracy: 0.6, fluency: 0.55 },
  },
  
  // Points awarded
  points: {
    completion: 100,
    excellentPerformance: 50,
    goalAchieved: 20,
    streakBonus: 10,
  },
} as const;

// Achievement Definitions
export const ACHIEVEMENTS = {
  first_conversation: { name: 'First Steps', icon: '🎯', points: 50 },
  five_scenarios: { name: 'Explorer', icon: '🗺️', points: 100 },
  all_categories: { name: 'Well-Rounded', icon: '🌟', points: 200 },
  perfect_session: { name: 'Perfection!', icon: '💯', points: 150 },
  week_streak: { name: 'Dedicated Learner', icon: '🔥', points: 250 },
} as const;

// UI Configuration
export const UI_CONFIG = {
  grid: {
    columnsDesktop: 3,
    columnsTablet: 2,
    columnsMobile: 1,
    gap: 16,
  },
  
  sorting: {
    default: 'popularity',
    options: ['popularity', 'difficulty', 'category', 'duration'],
  },
  
  filters: {
    showDifficulty: true,
    showCategory: true,
    showDuration: true,
    showCompleted: true,
  },
} as const;

// Type exports for type safety
export type ScenarioType = keyof typeof SCENARIO_MAPPINGS;
export type AchievementId = keyof typeof ACHIEVEMENTS;
export type SortOption = typeof UI_CONFIG.sorting.options[number];