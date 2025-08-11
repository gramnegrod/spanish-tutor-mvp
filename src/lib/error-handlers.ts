/**
 * Error Handling Patterns and Utilities
 * 
 * Provides React hooks, context providers, and utility functions for consistent error handling
 */

import { useEffect, useCallback, useState } from 'react'
import { 
  AppError, 
  ErrorHandlingService, 
  ErrorHandler, 
  ErrorCategory, 
  ErrorSeverity,
  errorHandlingService 
} from './error-handling'
import { logError } from './error-logging'

// Toast/Notification Handler
export class ToastErrorHandler implements ErrorHandler {
  private showToast: (message: string, type: 'error' | 'warning' | 'info') => void

  constructor(showToast: (message: string, type: 'error' | 'warning' | 'info') => void) {
    this.showToast = showToast
  }

  canHandle(error: Error): boolean {
    return error instanceof AppError && 
           error.severity !== ErrorSeverity.CRITICAL &&
           error.category !== ErrorCategory.AUTH
  }

  handle(error: AppError): void {
    const toastType = error.severity === ErrorSeverity.HIGH ? 'error' : 
                     error.severity === ErrorSeverity.MEDIUM ? 'warning' : 'info'
    
    this.showToast(error.userMessage, toastType)
  }
}

// Redirect Handler for Auth Errors
export class AuthRedirectHandler implements ErrorHandler {
  private redirect: (path: string) => void

  constructor(redirect: (path: string) => void) {
    this.redirect = redirect
  }

  canHandle(error: Error): boolean {
    return error instanceof AppError && error.category === ErrorCategory.AUTH
  }

  handle(error: AppError): void {
    // Log the auth error
    console.warn('Authentication error:', error.message)
    
    // Redirect to login for most auth errors
    if (error.userMessage.includes('sign in') || error.userMessage.includes('expired')) {
      this.redirect('/login')
    }
  }
}

// Retry Handler for Retryable Errors
export class RetryHandler implements ErrorHandler {
  private maxRetries: number = 3
  private retryDelays: number[] = [1000, 2000, 5000] // Progressive delays

  canHandle(error: Error): boolean {
    return error instanceof AppError && error.isRetryable
  }

  handle(error: AppError): void {
    // This is handled by the useRetryableOperation hook
    console.log('Retryable error detected:', error.message)
  }
}

// React Hook for Error Handling
export function useErrorHandler() {
  const [lastError, setLastError] = useState<AppError | null>(null)

  const handleError = useCallback((error: Error, context?: Record<string, any>) => {
    const appError = errorHandlingService.handleError(error, context)
    setLastError(appError)
    return appError
  }, [])

  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  return { handleError, clearError, lastError }
}

// React Hook for Retryable Operations
export function useRetryableOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delays: number[] = [1000, 2000, 5000]
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { handleError } = useErrorHandler()

  const execute = useCallback(async (): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        setRetryCount(0)
        setIsLoading(false)
        return result
      } catch (err) {
        const appError = handleError(err as Error, { attempt, maxRetries })
        
        // If this is the last attempt or error is not retryable, fail
        if (attempt === maxRetries || !appError.isRetryable) {
          setError(appError)
          setRetryCount(attempt + 1)
          setIsLoading(false)
          throw appError
        }

        // Wait before retry
        if (attempt < maxRetries && delays[attempt]) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]))
        }
        
        setRetryCount(attempt + 1)
      }
    }

    setIsLoading(false)
    return null
  }, [operation, maxRetries, delays, handleError])

  const retry = useCallback(() => {
    if (error && error.isRetryable) {
      return execute()
    }
    return Promise.reject(error)
  }, [error, execute])

  return {
    execute,
    retry,
    isLoading,
    error,
    retryCount,
    canRetry: error?.isRetryable && retryCount < maxRetries
  }
}

// React Hook for Error Recovery
export function useErrorRecovery() {
  const [recoveryStrategies] = useState<Map<ErrorCategory, () => void>>(new Map([
    [ErrorCategory.NETWORK, () => {
      // Trigger network status check
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          // Background sync API may not be available in all browsers
          if ('sync' in registration) {
            (registration as any).sync.register('retry-failed-requests')
          }
        }).catch(() => {
          // Service worker not available
        })
      }
    }],
    [ErrorCategory.WEBRTC, () => {
      // Clear WebRTC connection state
      localStorage.removeItem('webrtc-connection-state')
    }],
    [ErrorCategory.AUDIO, () => {
      // Reset audio permissions state
      localStorage.removeItem('audio-permissions-granted')
    }]
  ]))

  const recover = useCallback((error: AppError) => {
    const strategy = recoveryStrategies.get(error.category)
    if (strategy) {
      try {
        strategy()
        console.log(`Applied recovery strategy for ${error.category}`)
      } catch (recoveryError) {
        console.warn('Recovery strategy failed:', recoveryError)
      }
    }
  }, [recoveryStrategies])

  return { recover }
}

// Error Boundary Integration Helpers
export function getErrorBoundaryFallback(error: AppError) {
  return {
    title: getErrorTitle(error),
    message: error.userMessage,
    actions: getErrorActions(error),
    canRetry: error.isRetryable,
    severity: error.severity
  }
}

function getErrorTitle(error: AppError): string {
  switch (error.category) {
    case ErrorCategory.AUTH:
      return 'Authentication Required'
    case ErrorCategory.NETWORK:
      return 'Connection Issue'
    case ErrorCategory.WEBRTC:
      return 'Voice Connection Error'
    case ErrorCategory.AUDIO:
      return 'Audio Issue'
    case ErrorCategory.SPANISH_ANALYSIS:
      return 'Analysis Error'
    case ErrorCategory.API:
      return 'Service Error'
    default:
      return 'Unexpected Error'
  }
}

function getErrorActions(error: AppError): Array<{ label: string; action: () => void }> {
  const actions: Array<{ label: string; action: () => void }> = []

  if (error.isRetryable) {
    actions.push({
      label: 'Try Again',
      action: () => window.location.reload()
    })
  }

  if (error.category === ErrorCategory.AUTH) {
    actions.push({
      label: 'Sign In',
      action: () => window.location.href = '/login'
    })
  }

  if (error.category === ErrorCategory.NETWORK) {
    actions.push({
      label: 'Check Connection',
      action: () => {
        if (navigator.onLine) {
          window.location.reload()
        } else {
          alert('Please check your internet connection and try again.')
        }
      }
    })
  }

  // Always provide a way to go home
  actions.push({
    label: 'Go Home',
    action: () => window.location.href = '/'
  })

  return actions
}

// Async Operation Wrapper with Error Handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>,
  onError?: (error: AppError) => void
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const appError = errorHandlingService.handleError(error as Error, context)
    onError?.(appError)
    throw appError
  }
}

// Form Validation Error Handler
export function handleFormValidationErrors(errors: Record<string, string[]>): AppError[] {
  return Object.entries(errors).map(([field, messages]) => {
    const message = messages.join(', ')
    return errorHandlingService.handleError(
      new Error(message),
      { field, validationType: 'validation' }
    )
  })
}

// API Response Error Handler
export async function handleApiResponse(response: Response, endpoint?: string): Promise<any> {
  if (!response.ok) {
    let errorData: any = {}
    try {
      errorData = await response.json()
    } catch {
      // Response doesn't have JSON body
    }

    const error = errorHandlingService.handleError(
      new Error(errorData.message || `API request failed: ${response.status}`),
      {
        statusCode: response.status,
        endpoint: endpoint || response.url,
        responseData: errorData
      }
    )
    throw error
  }

  try {
    return await response.json()
  } catch {
    // Response doesn't have JSON body, return null
    return null
  }
}

// WebRTC Connection Error Handler
export function handleWebRTCConnectionState(
  connectionState: RTCPeerConnectionState,
  iceConnectionState: RTCIceConnectionState,
  onError?: (error: AppError) => void
) {
  if (connectionState === 'failed' || iceConnectionState === 'failed') {
    const error = errorHandlingService.handleError(
      new Error('WebRTC connection failed'),
      { connectionState, iceConnectionState }
    )
    onError?.(error)
    return error
  }

  if (iceConnectionState === 'disconnected') {
    const error = errorHandlingService.handleError(
      new Error('WebRTC connection lost'),
      { connectionState, iceConnectionState }
    )
    onError?.(error)
    return error
  }

  return null
}

// Audio Permission Error Handler
export async function handleAudioPermissions(onError?: (error: AppError) => void): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    return stream
  } catch (error: any) {
    let appError: AppError

    if (error.name === 'NotAllowedError') {
      appError = errorHandlingService.handleError(
        new Error('Microphone access denied'),
        { permissionType: 'microphone', errorName: error.name }
      )
    } else if (error.name === 'NotFoundError') {
      appError = errorHandlingService.handleError(
        new Error('No microphone found'),
        { permissionType: 'microphone', errorName: error.name }
      )
    } else {
      appError = errorHandlingService.handleError(error, { context: 'audio-permissions' })
    }

    onError?.(appError)
    return null
  }
}

// Initialize Error Handling Service with Default Handlers
export function initializeErrorHandling(
  showToast?: (message: string, type: 'error' | 'warning' | 'info') => void,
  redirect?: (path: string) => void
) {
  // Register default handlers
  if (showToast) {
    errorHandlingService.registerHandler(new ToastErrorHandler(showToast))
  }

  if (redirect) {
    errorHandlingService.registerHandler(new AuthRedirectHandler(redirect))
  }

  errorHandlingService.registerHandler(new RetryHandler())

  // Global unhandled rejection handler
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      errorHandlingService.handleError(error, { context: 'unhandled-rejection' })
      
      // Prevent the default browser error logging
      event.preventDefault()
    })

    // Global error handler for synchronous errors
    window.addEventListener('error', (event) => {
      errorHandlingService.handleError(event.error, { 
        context: 'global-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })
  }

  console.log('Error handling service initialized')
}

// Export commonly used patterns
export const errorPatterns = {
  withErrorHandling,
  handleApiResponse,
  handleWebRTCConnectionState,
  handleAudioPermissions,
  handleFormValidationErrors
} as const

export { errorHandlingService }