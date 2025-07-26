'use client'

import { AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ErrorDisplayProps {
  error: string | Error | null
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'inline' | 'card' | 'fullscreen'
  className?: string
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss,
  variant = 'inline',
  className 
}: ErrorDisplayProps) {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-900/20 border border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
              <p className="text-red-300 text-sm">{errorMessage}</p>
              {(onRetry || onDismiss) && (
                <div className="flex gap-2 mt-4">
                  {onRetry && (
                    <Button 
                      onClick={onRetry} 
                      variant="outline" 
                      size="sm"
                      className="border-red-700 text-red-400 hover:bg-red-900/20"
                    >
                      Try Again
                    </Button>
                  )}
                  {onDismiss && (
                    <Button 
                      onClick={onDismiss} 
                      variant="ghost" 
                      size="sm"
                      className="text-red-400 hover:bg-red-900/20"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "bg-red-50 border border-red-200 rounded-lg p-4",
        className
      )}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 text-sm">{errorMessage}</p>
            {(onRetry || onDismiss) && (
              <div className="flex gap-2 mt-3">
                {onRetry && (
                  <Button onClick={onRetry} variant="outline" size="sm">
                    Try Again
                  </Button>
                )}
                {onDismiss && (
                  <Button onClick={onDismiss} variant="ghost" size="sm">
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default inline variant
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 bg-red-100 text-red-700 rounded text-sm",
      className
    )}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{errorMessage}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-700 hover:text-red-800"
          aria-label="Dismiss error"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Simple error message component
export function ErrorMessage({ 
  message, 
  className 
}: { 
  message: string
  className?: string 
}) {
  return (
    <div className={cn(
      "text-sm text-red-600 flex items-center gap-1",
      className
    )}>
      <AlertCircle className="w-3 h-3" />
      {message}
    </div>
  )
}