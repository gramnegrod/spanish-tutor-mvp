'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react'
import { logError } from '@/lib/error-logging'
import { 
  AppError, 
  errorHandlingService,
  ErrorCategory,
  ErrorSeverity 
} from '@/lib/error-handling'
import { getErrorBoundaryFallback } from '@/lib/error-handlers'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
}

interface State {
  hasError: boolean
  appError?: AppError
  retryCount: number
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Convert to AppError using the error handling service
    const appError = errorHandlingService.handleError(error, { 
      context: 'ApiErrorBoundary',
      component: 'ApiErrorBoundary'
    })

    return { 
      hasError: true,
      appError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // The error has already been processed by getDerivedStateFromError
    // Just add the React error info context
    if (this.state.appError) {
      logError(error, {
        category: 'api',
        errorInfo,
        context: {
          ...this.state.appError.context,
          component: 'ApiErrorBoundary',
          retryCount: this.state.retryCount,
          severity: this.state.appError.severity,
          isRetryable: this.state.appError.isRetryable
        }
      })
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      appError: undefined,
      retryCount: prevState.retryCount + 1
    }))
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError && this.state.appError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { appError, retryCount } = this.state
      const fallbackProps = getErrorBoundaryFallback(appError)
      const isNetworkError = appError.category === ErrorCategory.NETWORK
      const isHighSeverity = appError.severity === ErrorSeverity.HIGH || appError.severity === ErrorSeverity.CRITICAL

      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              isHighSeverity ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {isNetworkError ? (
                <WifiOff className={`w-8 h-8 ${isHighSeverity ? 'text-red-600' : 'text-yellow-600'}`} />
              ) : (
                <AlertCircle className={`w-8 h-8 ${isHighSeverity ? 'text-red-600' : 'text-yellow-600'}`} />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {fallbackProps.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {fallbackProps.message}
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              {appError.isRetryable && (
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              {retryCount > 2 && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Refresh Page
                </Button>
              )}
              {appError.category === ErrorCategory.AUTH && (
                <Button
                  onClick={() => window.location.href = '/login'}
                  variant="default"
                  size="sm"
                >
                  Sign In
                </Button>
              )}
            </div>

            {retryCount > 0 && (
              <p className="text-xs text-gray-500">
                Retry attempt: {retryCount}
              </p>
            )}

            {appError.severity === ErrorSeverity.CRITICAL && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  This is a critical error. If the problem persists, please contact support.
                </p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && appError && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error details (development only)
                </summary>
                <div className="mt-2 space-y-2">
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(appError.toJSON(), null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}