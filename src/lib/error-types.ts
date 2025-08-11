/**
 * Spanish Tutor Specific Error Types and Handlers
 * 
 * Domain-specific error types for the Spanish learning application
 */

import { 
  AppError, 
  ErrorCategory, 
  ErrorSeverity, 
  SpanishAnalysisError,
  ApiError,
  AuthError,
  WebRTCError,
  AudioError
} from './error-handling'

// Practice Session Errors
export class PracticeSessionError extends AppError {
  public readonly sessionType: 'realtime' | 'conversation' | 'pronunciation' | 'grammar'
  public readonly sessionState: 'connecting' | 'active' | 'ending' | 'failed'

  constructor(
    message: string,
    sessionType: 'realtime' | 'conversation' | 'pronunciation' | 'grammar',
    sessionState: 'connecting' | 'active' | 'ending' | 'failed',
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.GENERAL,
      sessionState === 'failed' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      sessionState !== 'failed',
      userMessage,
      { ...context, sessionType, sessionState }
    )
    this.sessionType = sessionType
    this.sessionState = sessionState
  }

  getDefaultUserMessage(): string {
    switch (this.sessionState) {
      case 'connecting':
        return 'Having trouble starting your practice session. Please try again.'
      case 'active':
        return 'Something went wrong during your practice session. Your progress has been saved.'
      case 'ending':
        return 'Unable to properly end your session. Your progress has been saved.'
      case 'failed':
        return 'Practice session failed to start. Please check your connection and try again.'
      default:
        return 'Practice session error. Please try again.'
    }
  }
}

// NPC (AI Tutor) Errors
export class NPCError extends AppError {
  public readonly npcId?: string
  public readonly errorType: 'loading' | 'communication' | 'personality' | 'context'

  constructor(
    message: string,
    errorType: 'loading' | 'communication' | 'personality' | 'context',
    npcId?: string,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.GENERAL,
      ErrorSeverity.MEDIUM,
      true,
      userMessage,
      { ...context, npcId, errorType }
    )
    this.npcId = npcId
    this.errorType = errorType
  }

  getDefaultUserMessage(): string {
    switch (this.errorType) {
      case 'loading':
        return 'Unable to load your AI tutor. Please try again.'
      case 'communication':
        return 'Communication with your AI tutor was interrupted. Please try again.'
      case 'personality':
        return 'Your AI tutor is having trouble understanding the context. Please try rephrasing.'
      case 'context':
        return 'AI tutor context error. Starting fresh conversation.'
      default:
        return 'AI tutor error. Please try again.'
    }
  }
}

// Learning Progress Errors
export class ProgressError extends AppError {
  public readonly operation: 'save' | 'load' | 'sync' | 'calculate'
  public readonly dataType: 'conversation' | 'vocabulary' | 'achievement' | 'analytics'

  constructor(
    message: string,
    operation: 'save' | 'load' | 'sync' | 'calculate',
    dataType: 'conversation' | 'vocabulary' | 'achievement' | 'analytics',
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.GENERAL,
      operation === 'save' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      true,
      userMessage,
      { ...context, operation, dataType }
    )
    this.operation = operation
    this.dataType = dataType
  }

  getDefaultUserMessage(): string {
    switch (this.operation) {
      case 'save':
        return 'Unable to save your progress. Please try again to avoid losing your work.'
      case 'load':
        return 'Unable to load your progress data. Please refresh and try again.'
      case 'sync':
        return 'Progress sync failed. Your data will be saved locally and synced when connection improves.'
      case 'calculate':
        return 'Unable to calculate progress metrics. Your practice data is still saved.'
      default:
        return 'Progress tracking error. Your practice session is still saved.'
    }
  }
}

// Module/Learning Path Errors
export class ModuleError extends AppError {
  public readonly moduleId?: string
  public readonly errorType: 'loading' | 'navigation' | 'completion' | 'unlock'

  constructor(
    message: string,
    errorType: 'loading' | 'navigation' | 'completion' | 'unlock',
    moduleId?: string,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.GENERAL,
      ErrorSeverity.MEDIUM,
      true,
      userMessage,
      { ...context, moduleId, errorType }
    )
    this.moduleId = moduleId
    this.errorType = errorType
  }

  getDefaultUserMessage(): string {
    switch (this.errorType) {
      case 'loading':
        return 'Unable to load the learning module. Please try again.'
      case 'navigation':
        return 'Navigation error. Please try accessing the module from the dashboard.'
      case 'completion':
        return 'Unable to mark module as complete. Your progress has been saved.'
      case 'unlock':
        return 'Unable to unlock the next module. Please try again or contact support.'
      default:
        return 'Learning module error. Please try again.'
    }
  }
}

// Conversation Analysis Specific Errors
export class ConversationAnalysisError extends SpanishAnalysisError {
  public readonly analysisStage: 'transcription' | 'grammar' | 'vocabulary' | 'cultural' | 'feedback'

  constructor(
    message: string,
    analysisStage: 'transcription' | 'grammar' | 'vocabulary' | 'cultural' | 'feedback',
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'conversation', userMessage, { ...context, analysisStage })
    this.analysisStage = analysisStage
  }

  getDefaultUserMessage(): string {
    switch (this.analysisStage) {
      case 'transcription':
        return 'Unable to process your speech. Please try speaking more clearly or check your microphone.'
      case 'grammar':
        return 'Grammar analysis failed. You can still review the conversation transcript.'
      case 'vocabulary':
        return 'Vocabulary analysis failed. Your conversation has been saved for manual review.'
      case 'cultural':
        return 'Cultural context analysis failed. Basic conversation analysis is still available.'
      case 'feedback':
        return 'Unable to generate detailed feedback. Your conversation has been saved.'
      default:
        return 'Conversation analysis failed. Your conversation has been saved for later review.'
    }
  }
}

// OpenAI Realtime Specific Errors
export class RealtimeAPIError extends ApiError {
  public readonly realtimeType: 'connection' | 'session' | 'audio' | 'transcription' | 'response'

  constructor(
    message: string,
    realtimeType: 'connection' | 'session' | 'audio' | 'transcription' | 'response',
    statusCode?: number,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      statusCode,
      '/api/realtime',
      realtimeType !== 'session',
      userMessage,
      { ...context, realtimeType }
    )
    this.realtimeType = realtimeType
  }

  getDefaultUserMessage(): string {
    switch (this.realtimeType) {
      case 'connection':
        return 'Unable to connect to the voice practice system. Please check your internet connection.'
      case 'session':
        return 'Voice practice session failed to start. Please try again.'
      case 'audio':
        return 'Audio processing issue. Please check your microphone and try again.'
      case 'transcription':
        return 'Speech recognition failed. Please try speaking more clearly.'
      case 'response':
        return 'AI response failed. Please try your question again.'
      default:
        return 'Voice practice system error. Please try again.'
    }
  }
}

// Supabase/Database Specific Errors
export class DatabaseError extends AppError {
  public readonly operation: 'read' | 'write' | 'update' | 'delete' | 'sync'
  public readonly table?: string

  constructor(
    message: string,
    operation: 'read' | 'write' | 'update' | 'delete' | 'sync',
    table?: string,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.API,
      operation === 'write' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      true,
      userMessage,
      { ...context, operation, table }
    )
    this.operation = operation
    this.table = table
  }

  getDefaultUserMessage(): string {
    switch (this.operation) {
      case 'read':
        return 'Unable to load your data. Please refresh and try again.'
      case 'write':
        return 'Unable to save your data. Please check your internet connection and try again.'
      case 'update':
        return 'Unable to update your information. Please try again.'
      case 'delete':
        return 'Unable to delete the item. Please try again.'
      case 'sync':
        return 'Data sync failed. Your changes will be saved locally and synced later.'
      default:
        return 'Database error. Please try again.'
    }
  }
}

// Cost/Usage Tracking Errors
export class UsageTrackingError extends AppError {
  public readonly usageType: 'cost' | 'limits' | 'quota' | 'billing'

  constructor(
    message: string,
    usageType: 'cost' | 'limits' | 'quota' | 'billing',
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.GENERAL,
      usageType === 'quota' ? ErrorSeverity.HIGH : ErrorSeverity.LOW,
      false,
      userMessage,
      { ...context, usageType }
    )
    this.usageType = usageType
  }

  getDefaultUserMessage(): string {
    switch (this.usageType) {
      case 'cost':
        return 'Unable to track usage costs. Practice sessions will continue normally.'
      case 'limits':
        return 'Unable to check usage limits. Please contact support if you experience issues.'
      case 'quota':
        return 'You\'ve reached your usage limit for today. Please try again tomorrow or upgrade your plan.'
      case 'billing':
        return 'Billing information error. Please check your account settings.'
      default:
        return 'Usage tracking error. Practice sessions will continue normally.'
    }
  }
}

// Error Factory Functions
export function createPracticeSessionError(
  message: string,
  sessionType: 'realtime' | 'conversation' | 'pronunciation' | 'grammar',
  sessionState: 'connecting' | 'active' | 'ending' | 'failed',
  context?: Record<string, any>
): PracticeSessionError {
  return new PracticeSessionError(message, sessionType, sessionState, undefined, context)
}

export function createNPCError(
  message: string,
  errorType: 'loading' | 'communication' | 'personality' | 'context',
  npcId?: string,
  context?: Record<string, any>
): NPCError {
  return new NPCError(message, errorType, npcId, undefined, context)
}

export function createProgressError(
  message: string,
  operation: 'save' | 'load' | 'sync' | 'calculate',
  dataType: 'conversation' | 'vocabulary' | 'achievement' | 'analytics',
  context?: Record<string, any>
): ProgressError {
  return new ProgressError(message, operation, dataType, undefined, context)
}

export function createModuleError(
  message: string,
  errorType: 'loading' | 'navigation' | 'completion' | 'unlock',
  moduleId?: string,
  context?: Record<string, any>
): ModuleError {
  return new ModuleError(message, errorType, moduleId, undefined, context)
}

export function createConversationAnalysisError(
  message: string,
  analysisStage: 'transcription' | 'grammar' | 'vocabulary' | 'cultural' | 'feedback',
  context?: Record<string, any>
): ConversationAnalysisError {
  return new ConversationAnalysisError(message, analysisStage, undefined, context)
}

export function createRealtimeAPIError(
  message: string,
  realtimeType: 'connection' | 'session' | 'audio' | 'transcription' | 'response',
  statusCode?: number,
  context?: Record<string, any>
): RealtimeAPIError {
  return new RealtimeAPIError(message, realtimeType, statusCode, undefined, context)
}

export function createDatabaseError(
  message: string,
  operation: 'read' | 'write' | 'update' | 'delete' | 'sync',
  table?: string,
  context?: Record<string, any>
): DatabaseError {
  return new DatabaseError(message, operation, table, undefined, context)
}

export function createUsageTrackingError(
  message: string,
  usageType: 'cost' | 'limits' | 'quota' | 'billing',
  context?: Record<string, any>
): UsageTrackingError {
  return new UsageTrackingError(message, usageType, undefined, context)
}

// Commonly used error instances for quick throwing
export const COMMON_ERRORS = {
  // Authentication
  SESSION_EXPIRED: new AuthError('Session expired', 'token', 'Your session has expired. Please sign in again.'),
  INVALID_CREDENTIALS: new AuthError('Invalid credentials', 'login', 'Invalid email or password.'),
  PERMISSION_DENIED: new AuthError('Permission denied', 'permission', 'You don\'t have permission to access this feature.'),
  
  // Network
  CONNECTION_FAILED: new WebRTCError('Connection failed', 'failed', 'failed', 'Connection failed. Please check your internet connection and try again.'),
  MICROPHONE_ACCESS_DENIED: new AudioError('Microphone access denied', 'permissions', 'Please allow microphone access to use voice features.'),
  
  // Practice Sessions
  SESSION_START_FAILED: new PracticeSessionError('Failed to start session', 'realtime', 'failed', 'Unable to start practice session. Please try again.'),
  NPC_LOADING_FAILED: new NPCError('Failed to load NPC', 'loading', undefined, 'Unable to load your AI tutor. Please try again.'),
  
  // Progress
  PROGRESS_SAVE_FAILED: new ProgressError('Failed to save progress', 'save', 'conversation', 'Unable to save your progress. Please try again.'),
  CONVERSATION_ANALYSIS_FAILED: new ConversationAnalysisError('Analysis failed', 'feedback', 'Unable to analyze your conversation. It has been saved for later review.')
} as const

export type CommonErrorKey = keyof typeof COMMON_ERRORS