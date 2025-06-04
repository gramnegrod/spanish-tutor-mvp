// Type definitions for the Spanish Tutor app
// These were previously imported from Prisma but we're using Supabase

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Persona = 'TAQUERO' | 'BARISTA' | 'MERCADO_VENDOR' | 'TOUR_GUIDE' | 'DOCTOR' | 'TEACHER'

export interface User {
  id: string
  email: string
  created_at?: string
  updated_at?: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  persona: Persona
  transcript: ConversationTranscript[]
  duration: number
  analysis?: any
  created_at: string
  updated_at: string
}

export interface Progress {
  id: string
  user_id: string
  vocabulary: string[]
  pronunciation: number
  grammar: number
  fluency: number
  cultural_knowledge: number
  total_minutes_practiced: number
  conversations_completed: number
  created_at: string
  updated_at: string
}

export interface RealtimeEvent {
  type: string
  event_id?: string
  session?: any
  conversation?: any
  input?: any
  item?: any
  delta?: any
  audio?: string
  text?: string
  transcript?: string
  error?: any
}

export interface AudioData {
  buffer: ArrayBuffer
  sampleRate: number
  channelCount: number
}

export interface SessionConfig {
  persona: Persona
  userLevel: Level
  scenario?: string
  userId: string
}

export interface ConversationTranscript {
  id: string
  speaker: 'user' | 'assistant'
  text: string
  timestamp: Date | string  // Allow both Date objects and ISO strings for serialization compatibility
  audioUrl?: string
}

export interface ConversationAnalysis {
  pronunciation_notes: string[]
  grammar_successes: string[]
  cultural_appropriateness: string[]
  next_lesson_focus: string[]
  progress_indicators: {
    vocabulary_growth: number
    fluency_improvement: number
    cultural_understanding: number
  }
}

export interface LessonPlan {
  title: string
  objectives: string[]
  scenarios: {
    name: string
    description: string
    vocabulary: string[]
  }[]
  estimatedDuration: number
}