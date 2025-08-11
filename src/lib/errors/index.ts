/**
 * Error Handling Framework - Main Export File
 * 
 * Centralized exports for the complete error handling system
 */

// Core error handling framework
export {
  AppError,
  ErrorCategory,
  ErrorSeverity,
  ApiError,
  AuthError,
  WebRTCError,
  AudioError,
  SpanishAnalysisError,
  FileProcessingError,
  ValidationError,
  NetworkError,
  ErrorHandlingService,
  errorHandlingService,
  handleApiError,
  handleAuthError,
  handleWebRTCError,
  handleAudioError,
  handleValidationError,
  withErrorHandling,
  getErrorBoundaryProps
} from '../error-handling'

// Spanish tutor specific error types
export {
  PracticeSessionError,
  NPCError,
  ProgressError,
  ModuleError,
  ConversationAnalysisError,
  RealtimeAPIError,
  DatabaseError,
  UsageTrackingError,
  createPracticeSessionError,
  createNPCError,
  createProgressError,
  createModuleError,
  createConversationAnalysisError,
  createRealtimeAPIError,
  createDatabaseError,
  createUsageTrackingError,
  COMMON_ERRORS,
  type CommonErrorKey
} from '../error-types'

// Error handling patterns and utilities
export {
  ToastErrorHandler,
  AuthRedirectHandler,
  RetryHandler,
  useErrorHandler,
  useRetryableOperation,
  useErrorRecovery,
  getErrorBoundaryFallback,
  handleApiResponse,
  handleWebRTCConnectionState,
  handleAudioPermissions,
  handleFormValidationErrors,
  initializeErrorHandling,
  errorPatterns
} from '../error-handlers'

// Re-export existing error logging for backward compatibility
export { logError, getLoggedErrors, clearLoggedErrors } from '../error-logging'

// Common error scenarios for quick access
// Temporarily disabled due to circular dependency
// TODO: Fix circular dependency with COMMON_ERRORS
export const errorScenarios = {} as const

// Error handling best practices documentation
export const ERROR_HANDLING_BEST_PRACTICES = {
  // When to use different error types
  usage: {
    ApiError: 'For HTTP API request failures',
    AuthError: 'For authentication and authorization failures',
    WebRTCError: 'For real-time communication connection issues',
    AudioError: 'For microphone, playback, or audio processing issues',
    SpanishAnalysisError: 'For Spanish language analysis failures',
    ValidationError: 'For form validation and input validation errors',
    NetworkError: 'For network connectivity issues',
    PracticeSessionError: 'For practice session management issues',
    NPCError: 'For AI tutor/NPC related issues',
    ProgressError: 'For learning progress tracking issues'
  },
  
  // Error severity guidelines
  severity: {
    LOW: 'Minor issues that don\'t affect core functionality (validation errors, warnings)',
    MEDIUM: 'Issues that degrade user experience but don\'t break core features',
    HIGH: 'Issues that break key features but don\'t make the app unusable',
    CRITICAL: 'Issues that make the app completely unusable'
  },
  
  // When errors should be retryable
  retryability: {
    retryable: [
      'Network timeouts',
      'Temporary server errors (5xx)',
      'WebRTC connection drops',
      'Audio processing glitches',
      'Database sync failures'
    ],
    notRetryable: [
      'Authentication failures',
      'Validation errors',
      'Permission denied errors',
      'Critical system failures'
    ]
  }
} as const

// Helper functions temporarily disabled due to circular dependency
// TODO: Fix circular dependency with AppError and errorHandlingService

// Helper function to create errors with context
// export function createErrorWithContext<T extends AppError>(
//   ErrorClass: new (...args: any[]) => T,
//   message: string,
//   context: Record<string, any> = {},
//   ...additionalArgs: any[]
// ): T {
//   const error = new ErrorClass(message, ...additionalArgs)
//   error.context = { ...error.context, ...context }
//   return error
// }

// Helper function to handle errors consistently
// export function handleError(error: Error, context?: Record<string, any>): AppError {
//   return errorHandlingService.handleError(error, context)
// }