export interface UserProgress {
  user_id: string;
  current_scenario: string;
  competency_level: 'beginner' | 'intermediate' | 'advanced';
  total_minutes_practiced: number;
  last_session: Date;
}

export interface ConversationRecord {
  id: string;
  user_id: string;
  scenario_id: string;
  duration: number;
  transcript_url?: string;
  performance_summary: {
    comprehension_score: number; // 0-100
    speaking_score: number; // 0-100
    goals_achieved: string[];
    goals_attempted: string[];
  };
  teacher_notes: {
    strengths: string[];
    weaknesses: string[];
    recommended_focus: string[];
  };
  created_at: Date;
}

export interface PerformanceEvent {
  conversation_id: string;
  timestamp: number;
  event_type: 'attempt' | 'confusion' | 'achievement' | 'error';
  success: boolean;
  details: {
    phrase?: string;
    error_type?: 'pronunciation' | 'grammar' | 'vocabulary';
    topic?: string;
    goal_id?: string;
    quality?: 'perfect' | 'good' | 'needs_work';
    indicators?: string[];
  };
}

export interface UserAdaptations {
  user_id: string;
  speaking_pace_preference: number; // 0.5 to 1.5
  needs_visual_aids: boolean;
  common_errors: string[];
  mastered_concepts: string[];
  struggle_areas: string[];
}

export interface LearningScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number; // minutes
  prerequisite_scenarios?: string[];
  goals: {
    id: string;
    description: string;
    required: boolean;
    linguistic_focus: 'vocabulary' | 'grammar' | 'pronunciation' | 'cultural' | 'functional';
  }[];
  context: {
    setting: string;
    role_student: string;
    role_ai: string;
    cultural_notes?: string[];
  };
  vocabulary_focus: string[];
  grammar_focus: string[];
  system_prompt_template: string;
}

export interface ConversationAnalysis {
  transcript: {
    text: string;
    words: Array<{
      word: string;
      start: number;
      end: number;
    }>;
    language: string;
    duration: number;
  };
  performance: {
    wins: string[];
    mistakes: string[];
    corrections: Array<{
      error: string;
      correction: string;
      type: 'grammar' | 'vocabulary' | 'pronunciation';
    }>;
    comprehension_indicators: {
      response_time: number[];
      clarification_requests: number;
      successful_exchanges: number;
      total_exchanges: number;
    };
  };
  recommendations: string[];
}

export interface UserSettings {
  competency_level: 'beginner' | 'intermediate' | 'advanced';
  speech_settings: {
    pause_duration: number; // seconds between utterances
    speaking_speed: 'slow' | 'normal' | 'fast';
  };
  scenario_preferences: {
    starting_scenario?: string;
  };
}