'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react'
import { logError } from '@/lib/error-logging'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  isNetworkError: boolean
  retryCount: number
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      isNetworkError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a network-related error
    const isNetworkError = 
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('api') ||
      error.message.toLowerCase().includes('connection')

    return { 
      hasError: true, 
      error,
      isNetworkError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log API-specific errors
    logError(error, {
      category: 'api',
      errorInfo,
      context: {
        component: 'ApiErrorBoundary',
        isNetworkError: this.state.isNetworkError,
        retryCount: this.state.retryCount
      }
    })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }))
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { isNetworkError, error, retryCount } = this.state

      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              {isNetworkError ? (
                <WifiOff className="w-8 h-8 text-red-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isNetworkError ? 'Connection Error' : 'API Error'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isNetworkError 
                  ? 'Unable to connect to our servers. Please check your internet connection.'
                  : 'We encountered an error while processing your request.'}
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="default"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              {retryCount > 2 && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Refresh Page
                </Button>
              )}
            </div>

            {retryCount > 0 && (
              <p className="text-xs text-gray-500">
                Retry attempt: {retryCount}
              </p>
            )}

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}