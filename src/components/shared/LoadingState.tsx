'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({ 
  message = 'Loading...', 
  fullScreen = false,
  size = 'md',
  className 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <Loader2 className={cn("animate-spin text-gray-400", sizeClasses[size])} />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

// Loading spinner for inline use
export function LoadingSpinner({ 
  size = 'sm', 
  className 
}: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  )
}