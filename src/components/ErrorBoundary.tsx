'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { logError } from '@/lib/error-logging'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
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
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    logError(error, {
      category: 'general',
      errorInfo,
      context: {
        component: 'ErrorBoundary',
        errorCount: this.state.errorCount
      }
    })
    
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
      error: undefined,
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
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorCount } = this.state
      const isFatalError = errorCount > 3

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <CardTitle className="text-red-600">
                  {isFatalError ? 'Multiple Errors Detected' : 'Something went wrong'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                {isFatalError 
                  ? 'We\'re experiencing repeated errors. Please refresh the page to start fresh.'
                  : 'We encountered an unexpected error. You can try again or refresh the page.'}
              </p>
              
              <div className="flex gap-2">
                {!isFatalError && (
                  <Button
                    onClick={this.handleReset}
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
                <Button
                  onClick={() => window.location.reload()}
                  variant={isFatalError ? "default" : "outline"}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
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
              
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Error details (development only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {error.toString()}
                    </pre>
                    {error.stack && (
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    )}
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