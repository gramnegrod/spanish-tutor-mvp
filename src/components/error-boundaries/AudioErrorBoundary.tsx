'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { MicOff, Settings, RefreshCw, ExternalLink } from 'lucide-react'
import { logError } from '@/lib/error-logging'

interface Props {
  children: ReactNode
  onPermissionRequest?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorType: 'permission' | 'browser' | 'device' | 'unknown'
}

export class AudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      errorType: 'unknown'
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    let errorType: State['errorType'] = 'unknown'
    
    const errorMessage = error.message.toLowerCase()
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      errorType = 'permission'
    } else if (errorMessage.includes('browser') || errorMessage.includes('supported')) {
      errorType = 'browser'
    } else if (errorMessage.includes('device') || errorMessage.includes('microphone')) {
      errorType = 'device'
    }

    return { 
      hasError: true, 
      error,
      errorType
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log audio-specific errors
    logError(error, {
      category: 'audio',
      errorInfo,
      context: {
        component: 'AudioErrorBoundary',
        errorType: this.state.errorType,
        userAgent: navigator.userAgent
      }
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handlePermissionRequest = () => {
    this.handleReset()
    this.props.onPermissionRequest?.()
  }

  renderErrorContent() {
    const { errorType } = this.state

    switch (errorType) {
      case 'permission':
        return {
          icon: MicOff,
          title: 'Microphone Permission Required',
          description: 'Please allow microphone access to use voice features.',
          actions: (
            <>
              <Button onClick={this.handlePermissionRequest}>
                <Settings className="w-4 h-4 mr-2" />
                Grant Permission
              </Button>
              <a
                href="https://support.google.com/chrome/answer/2693767"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                How to enable microphone
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )
        }

      case 'browser':
        return {
          icon: MicOff,
          title: 'Browser Not Supported',
          description: 'Your browser doesn\'t support the audio features required. Please use Chrome, Firefox, or Safari.',
          actions: (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Recommended browsers:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li>Google Chrome (latest)</li>
                <li>Mozilla Firefox (latest)</li>
                <li>Safari 14+</li>
              </ul>
            </div>
          )
        }

      case 'device':
        return {
          icon: MicOff,
          title: 'No Microphone Detected',
          description: 'We couldn\'t find a microphone. Please check your device settings.',
          actions: (
            <>
              <Button onClick={this.handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <p className="text-sm text-gray-600">
                Make sure your microphone is connected and not being used by another app.
              </p>
            </>
          )
        }

      default:
        return {
          icon: MicOff,
          title: 'Audio Error',
          description: 'There was a problem with the audio system.',
          actions: (
            <Button onClick={this.handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )
        }
    }
  }

  render() {
    if (this.state.hasError) {
      const { icon: Icon, title, description, actions } = this.renderErrorContent()

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
              <Icon className="w-8 h-8 text-orange-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>

            <div className="space-y-3">
              {actions}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
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