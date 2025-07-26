/**
 * Core types for the Spanish Tutor learning module system
 */

/** Module difficulty levels */
export enum ModuleDifficulty {
  ALL = 'all',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

/** Module lifecycle status */
export enum ModuleStatus {
  INACTIVE = 'inactive',
  LOADING = 'loading',
  READY = 'ready',
  ACTIVE = 'active',
  ERROR = 'error'
}

/** Module event types for analytics */
export enum ModuleEventType {
  START = 'module_start',
  COMPLETE = 'module_complete',
  PROGRESS = 'module_progress',
  ERROR = 'module_error',
  FEATURE_USED = 'feature_used'
}

/** Feature flags for modules */
export interface ModuleFeatures {
  progressive: boolean;  // Supports gradual difficulty increase
  adaptive: boolean;     // Adapts to user performance
  social: boolean;       // Has social/community features
  offline: boolean;      // Works offline
}

/** User progress tracking */
export interface ModuleProgress {
  userId: string;
  moduleId: string;
  level: ModuleDifficulty;
  completedSessions: number;
  totalTimeSpent: number;  // in seconds
  lastAccessed: Date;
  achievements: string[];
  currentStreak: number;
}

/** Individual learning session */
export interface ModuleSession {
  id: string;
  moduleId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  progress: number;  // 0-100
  errors: number;
  score?: number;
}

/** Module analytics data */
export interface ModuleAnalytics {
  totalSessions: number;
  avgSessionDuration: number;
  completionRate: number;
  errorRate: number;
  featureUsage: Record<string, number>;
}

/** Module configuration */
export interface ModuleConfiguration {
  difficulty: ModuleDifficulty;
  sessionDuration?: number;  // in minutes
  enableHints?: boolean;
  enableAudio?: boolean;
  customSettings?: Record<string, any>;
}

/** Core learning module interface */
export interface LearningModule {
  // Basic properties
  id: string;
  name: string;
  description: string;
  icon: string;  // Icon name or path

  // Difficulty support
  supportedDifficulties: ModuleDifficulty[];
  defaultDifficulty: ModuleDifficulty;

  // Features
  features: ModuleFeatures;

  // Lifecycle methods
  initialize(config: ModuleConfiguration): Promise<void>;
  start(session: ModuleSession): Promise<void>;
  pause(): void;
  resume(): void;
  end(): Promise<ModuleAnalytics>;

  // Configuration
  configure(config: Partial<ModuleConfiguration>): void;
  getConfiguration(): ModuleConfiguration;
}

/** Type for module registry mapping */
export type ModuleRegistry = Record<string, LearningModule>;

/** Type for module state management */
export type ModuleState = {
  status: ModuleStatus;
  currentSession?: ModuleSession;
  error?: Error;
};