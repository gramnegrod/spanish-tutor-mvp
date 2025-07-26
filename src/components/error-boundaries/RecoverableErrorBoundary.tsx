'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Save, Download } from 'lucide-react'
import { logError } from '@/lib/error-logging'

interface Props {
  children: ReactNode
  onRecover?: () => Promise<void>
  saveState?: () => any
  restoreState?: (state: any) => void
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  isRecovering: boolean
  savedState?: any
}

export class RecoverableErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      isRecovering: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Save state before error
    const savedState = this.props.saveState?.()
    
    // Log error
    logError(error, {
      category: 'general',
      errorInfo,
      context: {
        component: 'RecoverableErrorBoundary',
        hasSavedState: !!savedState
      }
    })
    
    this.setState({ savedState })
  }

  handleRecover = async () => {
    this.setState({ isRecovering: true })
    
    try {
      // Try custom recovery
      if (this.props.onRecover) {
        await this.props.onRecover()
      }
      
      // Restore saved state if available
      if (this.state.savedState && this.props.restoreState) {
        this.props.restoreState(this.state.savedState)
      }
      
      // Reset error state
      this.setState({ 
        hasError: false, 
        error: undefined,
        isRecovering: false 
      })
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError)
      this.setState({ isRecovering: false })
    }
  }

  handleDownloadState = () => {
    if (!this.state.savedState) return
    
    const dataStr = JSON.stringify(this.state.savedState, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `app-state-${Date.now()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, isRecovering, savedState } = this.state

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle>Recoverable Error</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                We encountered an error but your data might be recoverable.
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRecover}
                  disabled={isRecovering}
                  variant="default"
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Recovering...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Recovery
                    </>
                  )}
                </Button>
                
                {savedState && (
                  <Button
                    onClick={this.handleDownloadState}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save Data
                  </Button>
                )}
              </div>
              
              {savedState && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Save className="w-3 h-3" />
                  Your work has been saved locally
                </div>
              )}

              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {error.toString()}
                  </pre>
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