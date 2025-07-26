'use client'

import { Mic, MicOff, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingState'

interface ConnectionStatusProps {
  isConnected: boolean
  isConnecting?: boolean
  showMicIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ConnectionStatus({
  isConnected,
  isConnecting = false,
  showMicIcon = true,
  size = 'md',
  className
}: ConnectionStatusProps) {
  const sizeClasses = {
    sm: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-xs'
    },
    md: {
      container: 'w-20 h-20',
      icon: 'w-10 h-10',
      text: 'text-sm'
    },
    lg: {
      container: 'w-24 h-24',
      icon: 'w-12 h-12',
      text: 'text-base'
    }
  }

  const currentSize = sizeClasses[size]

  if (isConnecting) {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className={cn(
          "rounded-full bg-gray-100 flex items-center justify-center",
          currentSize.container
        )}>
          <LoadingSpinner size={size} className="text-gray-400" />
        </div>
        <p className={cn("text-gray-600", currentSize.text)}>Connecting...</p>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className={cn(
          "rounded-full bg-green-100 flex items-center justify-center animate-pulse",
          currentSize.container
        )}>
          {showMicIcon ? (
            <Mic className={cn("text-green-600", currentSize.icon)} />
          ) : (
            <Wifi className={cn("text-green-600", currentSize.icon)} />
          )}
        </div>
        <p className={cn("text-green-600 font-medium", currentSize.text)}>
          Connected - Speak anytime
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className={cn(
        "rounded-full bg-gray-100 flex items-center justify-center",
        currentSize.container
      )}>
        {showMicIcon ? (
          <MicOff className={cn("text-gray-400", currentSize.icon)} />
        ) : (
          <WifiOff className={cn("text-gray-400", currentSize.icon)} />
        )}
      </div>
      <p className={cn("text-gray-500 font-medium", currentSize.text)}>
        Not connected
      </p>
    </div>
  )
}

// Simple connection indicator badge
export function ConnectionBadge({
  isConnected,
  className
}: {
  isConnected: boolean
  className?: string
}) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
      isConnected
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-600",
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
      )} />
      {isConnected ? "Connected" : "Disconnected"}
    </div>
  )
}