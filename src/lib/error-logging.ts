// Error logging service
// In production, this would integrate with services like Sentry, LogRocket, etc.

interface ErrorContext {
  category: 'practice' | 'api' | 'audio' | 'general'
  errorInfo?: React.ErrorInfo
  context?: Record<string, any>
}

export function logError(error: Error, context: ErrorContext) {
  const timestamp = new Date().toISOString()
  const errorLog = {
    timestamp,
    message: error.message,
    stack: error.stack,
    category: context.category,
    context: context.context,
    errorInfo: context.errorInfo,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  }

  // In development, log to console with structured format
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Logger]', errorLog)
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service
    // Example with Sentry:
    // Sentry.captureException(error, {
    //   tags: { category: context.category },
    //   extra: errorLog
    // })
    
    // For now, we'll store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]')
      errors.push(errorLog)
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift()
      }
      localStorage.setItem('app_errors', JSON.stringify(errors))
    } catch (e) {
      // Fail silently if localStorage is not available
    }
  }
}

// Helper to retrieve logged errors (useful for debugging)
export function getLoggedErrors() {
  try {
    return JSON.parse(localStorage.getItem('app_errors') || '[]')
  } catch {
    return []
  }
}

// Helper to clear logged errors
export function clearLoggedErrors() {
  try {
    localStorage.removeItem('app_errors')
  } catch {
    // Fail silently
  }
}