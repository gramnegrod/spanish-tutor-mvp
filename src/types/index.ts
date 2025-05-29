import { User, Conversation, Progress, Level, Persona } from '@prisma/client'

export type { User, Conversation, Progress, Level, Persona }

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
  timestamp: Date
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