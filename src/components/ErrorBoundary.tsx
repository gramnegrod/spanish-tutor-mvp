'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { logError } from '@/lib/error-logging'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { 
  AppError, 
  errorHandlingService,
  ErrorSeverity,
  ErrorCategory 
} from '@/lib/error-handling'
import { getErrorBoundaryFallback } from '@/lib/error-handlers'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  onReset?: () => void
}

interface State {
  hasError: boolean
  appError?: AppError
  errorInfo?: React.ErrorInfo
  errorCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Convert to AppError using the error handling service
    const appError = errorHandlingService.handleError(error, { 
      context: 'ErrorBoundary',
      component: 'ErrorBoundary'
    })

    return { hasError: true, appError }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // The error has already been processed by getDerivedStateFromError
    // Just add the React error info context and increment count
    if (this.state.appError) {
      logError(error, {
        category: 'general',
        errorInfo,
        context: {
          ...this.state.appError.context,
          component: 'ErrorBoundary',
          errorCount: this.state.errorCount,
          severity: this.state.appError.severity,
          isRetryable: this.state.appError.isRetryable
        }
      })
    }
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary()
      }
    }
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    this.props.onReset?.()
    this.setState({ 
      hasError: false, 
      appError: undefined,
      errorInfo: undefined
    })
  }

  handleReset = () => {
    // Prevent rapid resets
    if (this.state.errorCount > 3) {
      window.location.href = '/'
      return
    }
    
    this.resetErrorBoundary()
    
    // Auto-reset after 5 seconds if error persists
    this.resetTimeoutId = setTimeout(() => {
      if (this.state.hasError) {
        this.resetErrorBoundary()
      }
    }, 5000)
  }

  render() {
    if (this.state.hasError && this.state.appError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { appError, errorCount } = this.state
      const fallbackProps = getErrorBoundaryFallback(appError)
      const isFatalError = errorCount > 3 || appError.severity === ErrorSeverity.CRITICAL
      const isHighSeverity = appError.severity === ErrorSeverity.HIGH || appError.severity === ErrorSeverity.CRITICAL

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isHighSeverity ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    isHighSeverity ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                </div>
                <CardTitle className={isHighSeverity ? 'text-red-600' : 'text-yellow-600'}>
                  {isFatalError ? 'Critical Error' : fallbackProps.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                {isFatalError 
                  ? 'We\'re experiencing repeated critical errors. Please refresh the page to start fresh.'
                  : fallbackProps.message}
              </p>
              
              <div className="flex gap-2 flex-wrap">
                {!isFatalError && appError.isRetryable && (
                  <Button
                    onClick={this.handleReset}
                    variant="default"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
                <Button
                  onClick={() => window.location.reload()}
                  variant={isFatalError ? "default" : "outline"}
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                {appError.category === ErrorCategory.AUTH && (
                  <Button
                    onClick={() => window.location.href = '/login'}
                    variant="outline"
                    size="sm"
                  >
                    Sign In
                  </Button>
                )}
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  size="sm"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
              
              {errorCount > 1 && !isFatalError && (
                <p className="text-xs text-gray-500 text-center">
                  Error occurred {errorCount} times
                </p>
              )}

              {appError.severity === ErrorSeverity.CRITICAL && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    This is a critical error. If the problem persists, please contact support with the error details below.
                  </p>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && appError && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Error details (development only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(appError.toJSON(), null, 2)}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}