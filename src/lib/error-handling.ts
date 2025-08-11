/**
 * Centralized Error Handling Framework
 * 
 * Provides consistent error handling, logging, and user messaging across the entire application.
 * Built to integrate with the existing error-logging.ts and error boundary system.
 */

import { logError as originalLogError } from './error-logging'

// Error Categories
export enum ErrorCategory {
  API = 'api',
  AUTH = 'auth',
  WEBRTC = 'webrtc',
  AUDIO = 'audio',
  SPANISH_ANALYSIS = 'spanish_analysis',
  FILE_PROCESSING = 'file_processing',
  VALIDATION = 'validation',
  NETWORK = 'network',
  GENERAL = 'general'
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'low',           // Minor issues that don't affect core functionality
  MEDIUM = 'medium',     // Issues that degrade user experience
  HIGH = 'high',         // Issues that break key features
  CRITICAL = 'critical'  // Issues that make the app unusable
}

// Base App Error Class
export abstract class AppError extends Error {
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly isRetryable: boolean
  public readonly userMessage: string
  public readonly context: Record<string, any>
  public readonly timestamp: Date

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isRetryable: boolean = false,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(message)
    this.name = this.constructor.name
    this.category = category
    this.severity = severity
    this.isRetryable = isRetryable
    this.userMessage = userMessage || this.getDefaultUserMessage()
    this.context = context
    this.timestamp = new Date()

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }

  abstract getDefaultUserMessage(): string

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      isRetryable: this.isRetryable,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }
}

// API Errors
export class ApiError extends AppError {
  public readonly statusCode?: number
  public readonly endpoint?: string

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    isRetryable: boolean = true,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.API,
      statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      isRetryable,
      userMessage,
      { ...context, statusCode, endpoint }
    )
    this.statusCode = statusCode
    this.endpoint = endpoint
  }

  getDefaultUserMessage(): string {
    if (this.statusCode === 401) {
      return 'Please sign in to continue.'
    }
    if (this.statusCode === 403) {
      return 'You don\'t have permission to perform this action.'
    }
    if (this.statusCode === 404) {
      return 'The requested resource was not found.'
    }
    if (this.statusCode && this.statusCode >= 500) {
      return 'Our servers are experiencing issues. Please try again in a moment.'
    }
    return 'We encountered an issue while processing your request. Please try again.'
  }

  static fromResponse(response: Response, endpoint?: string, context?: Record<string, any>): ApiError {
    return new ApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      endpoint || response.url,
      response.status >= 500 || response.status === 429,
      undefined,
      context
    )
  }
}

// Authentication Errors
export class AuthError extends AppError {
  public readonly authType: 'login' | 'register' | 'token' | 'permission'

  constructor(
    message: string,
    authType: 'login' | 'register' | 'token' | 'permission',
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.AUTH,
      ErrorSeverity.HIGH,
      false,
      userMessage,
      { ...context, authType }
    )
    this.authType = authType
  }

  getDefaultUserMessage(): string {
    switch (this.authType) {
      case 'login':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'register':
        return 'Unable to create account. Please check your information and try again.'
      case 'token':
        return 'Your session has expired. Please sign in again.'
      case 'permission':
        return 'You don\'t have permission to access this feature.'
      default:
        return 'Authentication failed. Please sign in again.'
    }
  }
}

// WebRTC Connection Errors
export class WebRTCError extends AppError {
  public readonly connectionState?: RTCPeerConnectionState
  public readonly iceConnectionState?: RTCIceConnectionState

  constructor(
    message: string,
    connectionState?: RTCPeerConnectionState,
    iceConnectionState?: RTCIceConnectionState,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    const isRetryable = connectionState !== 'failed' && iceConnectionState !== 'failed'
    super(
      message,
      ErrorCategory.WEBRTC,
      connectionState === 'failed' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      isRetryable,
      userMessage,
      { ...context, connectionState, iceConnectionState }
    )
    this.connectionState = connectionState
    this.iceConnectionState = iceConnectionState
  }

  getDefaultUserMessage(): string {
    if (this.connectionState === 'failed' || this.iceConnectionState === 'failed') {
      return 'Connection failed. Please check your internet connection and try again.'
    }
    if (this.iceConnectionState === 'disconnected') {
      return 'Connection interrupted. Attempting to reconnect...'
    }
    return 'Having trouble with the voice connection. Please try again.'
  }
}

// Audio/Voice Errors
export class AudioError extends AppError {
  public readonly audioType: 'microphone' | 'playback' | 'processing' | 'permissions'

  constructor(
    message: string,
    audioType: 'microphone' | 'playback' | 'processing' | 'permissions',
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.AUDIO,
      audioType === 'permissions' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      audioType !== 'permissions',
      userMessage,
      { ...context, audioType }
    )
    this.audioType = audioType
  }

  getDefaultUserMessage(): string {
    switch (this.audioType) {
      case 'microphone':
        return 'Unable to access your microphone. Please check your browser settings and try again.'
      case 'playback':
        return 'Unable to play audio. Please check your speakers and try again.'
      case 'processing':
        return 'Audio processing failed. Please try speaking again.'
      case 'permissions':
        return 'Microphone access is required for voice practice. Please allow microphone access in your browser settings.'
      default:
        return 'Audio issue encountered. Please try again.'
    }
  }
}

// Spanish Analysis Errors
export class SpanishAnalysisError extends AppError {
  public readonly analysisType: 'conversation' | 'pronunciation' | 'grammar' | 'vocabulary'

  constructor(
    message: string,
    analysisType: 'conversation' | 'pronunciation' | 'grammar' | 'vocabulary',
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.SPANISH_ANALYSIS,
      ErrorSeverity.MEDIUM,
      true,
      userMessage,
      { ...context, analysisType }
    )
    this.analysisType = analysisType
  }

  getDefaultUserMessage(): string {
    return `Unable to analyze your Spanish ${this.analysisType}. Please try again or continue practicing.`
  }
}

// File Processing Errors
export class FileProcessingError extends AppError {
  public readonly fileType?: string
  public readonly operation: 'upload' | 'download' | 'process' | 'validate'

  constructor(
    message: string,
    operation: 'upload' | 'download' | 'process' | 'validate',
    fileType?: string,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.FILE_PROCESSING,
      ErrorSeverity.MEDIUM,
      operation !== 'validate',
      userMessage,
      { ...context, fileType, operation }
    )
    this.fileType = fileType
    this.operation = operation
  }

  getDefaultUserMessage(): string {
    switch (this.operation) {
      case 'upload':
        return 'File upload failed. Please check your internet connection and try again.'
      case 'download':
        return 'File download failed. Please try again.'
      case 'process':
        return 'Unable to process the file. Please try a different file.'
      case 'validate':
        return 'Invalid file format. Please select a valid file.'
      default:
        return 'File operation failed. Please try again.'
    }
  }
}

// Validation Errors
export class ValidationError extends AppError {
  public readonly field?: string
  public readonly validationType: 'required' | 'format' | 'length' | 'range' | 'custom'

  constructor(
    message: string,
    validationType: 'required' | 'format' | 'length' | 'range' | 'custom',
    field?: string,
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      false,
      userMessage,
      { ...context, field, validationType }
    )
    this.field = field
    this.validationType = validationType
  }

  getDefaultUserMessage(): string {
    if (this.field) {
      switch (this.validationType) {
        case 'required':
          return `${this.field} is required.`
        case 'format':
          return `Please enter a valid ${this.field}.`
        case 'length':
          return `${this.field} must meet the length requirements.`
        case 'range':
          return `${this.field} must be within the allowed range.`
        default:
          return `Invalid ${this.field}. Please check and try again.`
      }
    }
    return 'Please correct the highlighted fields and try again.'
  }
}

// Network Errors
export class NetworkError extends AppError {
  public readonly networkType: 'offline' | 'timeout' | 'dns' | 'connection'

  constructor(
    message: string,
    networkType: 'offline' | 'timeout' | 'dns' | 'connection',
    userMessage?: string,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.HIGH,
      true,
      userMessage,
      { ...context, networkType }
    )
    this.networkType = networkType
  }

  getDefaultUserMessage(): string {
    switch (this.networkType) {
      case 'offline':
        return 'You appear to be offline. Please check your internet connection.'
      case 'timeout':
        return 'Request timed out. Please check your internet connection and try again.'
      case 'dns':
        return 'Unable to connect to our servers. Please check your internet connection.'
      case 'connection':
        return 'Connection failed. Please check your internet connection and try again.'
      default:
        return 'Network error. Please check your internet connection and try again.'
    }
  }
}

// Error Handler Interface
export interface ErrorHandler {
  handle(error: AppError): void
  canHandle(error: Error): boolean
}

// Error Handling Service
export class ErrorHandlingService {
  private handlers: ErrorHandler[] = []
  private isOnline: boolean = true

  constructor() {
    // Monitor online status
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      window.addEventListener('online', () => { this.isOnline = true })
      window.addEventListener('offline', () => { this.isOnline = false })
    }
  }

  registerHandler(handler: ErrorHandler): void {
    this.handlers.push(handler)
  }

  handleError(error: Error, context?: Record<string, any>): AppError {
    // Convert unknown errors to AppErrors
    const appError = this.normalizeError(error, context)
    
    // Log the error using existing logging system
    // Map our categories to the expected format
    let loggingCategory: 'practice' | 'api' | 'audio' | 'general'
    switch (appError.category) {
      case ErrorCategory.API:
      case ErrorCategory.AUTH:
      case ErrorCategory.NETWORK:
        loggingCategory = 'api'
        break
      case ErrorCategory.AUDIO:
      case ErrorCategory.WEBRTC:
        loggingCategory = 'audio'
        break
      case ErrorCategory.SPANISH_ANALYSIS:
        loggingCategory = 'practice'
        break
      default:
        loggingCategory = 'general'
    }
    
    originalLogError(appError, {
      category: loggingCategory,
      context: {
        ...appError.context,
        severity: appError.severity,
        isRetryable: appError.isRetryable,
        timestamp: appError.timestamp,
        originalCategory: appError.category
      }
    })

    // Find appropriate handler
    const handler = this.handlers.find(h => h.canHandle(appError))
    if (handler) {
      handler.handle(appError)
    }

    return appError
  }

  private normalizeError(error: Error, context?: Record<string, any>): AppError {
    // If already an AppError, return as-is
    if (error instanceof AppError) {
      return error
    }

    // Network-related error detection
    if (!this.isOnline) {
      return new NetworkError(error.message, 'offline', undefined, context)
    }

    if (error.message.toLowerCase().includes('timeout')) {
      return new NetworkError(error.message, 'timeout', undefined, context)
    }

    if (error.message.toLowerCase().includes('fetch') || 
        error.message.toLowerCase().includes('network')) {
      return new NetworkError(error.message, 'connection', undefined, context)
    }

    // API error detection
    if (error.message.toLowerCase().includes('api') || 
        error.message.toLowerCase().includes('response')) {
      return new ApiError(error.message, undefined, undefined, true, undefined, context)
    }

    // Auth error detection
    if (error.message.toLowerCase().includes('auth') || 
        error.message.toLowerCase().includes('token') ||
        error.message.toLowerCase().includes('unauthorized')) {
      return new AuthError(error.message, 'token', undefined, context)
    }

    // WebRTC error detection
    if (error.message.toLowerCase().includes('ice') || 
        error.message.toLowerCase().includes('webrtc') ||
        error.message.toLowerCase().includes('connection')) {
      return new WebRTCError(error.message, undefined, undefined, undefined, context)
    }

    // Audio error detection
    if (error.message.toLowerCase().includes('audio') || 
        error.message.toLowerCase().includes('microphone') ||
        error.message.toLowerCase().includes('media')) {
      return new AudioError(error.message, 'processing', undefined, context)
    }

    // Default to general error
    return new class extends AppError {
      getDefaultUserMessage(): string {
        return 'An unexpected error occurred. Please try again.'
      }
    }(error.message, ErrorCategory.GENERAL, ErrorSeverity.MEDIUM, true, undefined, context)
  }
}

// Singleton instance
export const errorHandlingService = new ErrorHandlingService()

// Utility functions for common error scenarios
export function handleApiError(response: Response, endpoint?: string, context?: Record<string, any>): never {
  throw ApiError.fromResponse(response, endpoint, context)
}

export function handleAuthError(message: string, type: 'login' | 'register' | 'token' | 'permission', context?: Record<string, any>): never {
  throw new AuthError(message, type, undefined, context)
}

export function handleWebRTCError(message: string, connectionState?: RTCPeerConnectionState, iceConnectionState?: RTCIceConnectionState, context?: Record<string, any>): never {
  throw new WebRTCError(message, connectionState, iceConnectionState, undefined, context)
}

export function handleAudioError(message: string, type: 'microphone' | 'playback' | 'processing' | 'permissions', context?: Record<string, any>): never {
  throw new AudioError(message, type, undefined, context)
}

export function handleValidationError(message: string, type: 'required' | 'format' | 'length' | 'range' | 'custom', field?: string, context?: Record<string, any>): never {
  throw new ValidationError(message, type, field, undefined, context)
}

// Async error wrapper for promises
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const appError = errorHandlingService.handleError(error as Error, context)
    throw appError
  }
}

// Error boundary helper
export function getErrorBoundaryProps(error: AppError) {
  return {
    severity: error.severity,
    category: error.category,
    isRetryable: error.isRetryable,
    userMessage: error.userMessage,
    context: error.context
  }
}

// Export all error types for easy importing
// Classes are already exported individually above