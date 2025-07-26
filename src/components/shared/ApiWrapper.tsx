'use client'

import { ReactNode } from 'react'
import { ApiErrorBoundary } from '@/components/error-boundaries'

interface ApiWrapperProps {
  children: ReactNode
  onRetry?: () => void
  fallback?: ReactNode
}

export function ApiWrapper({ children, onRetry, fallback }: ApiWrapperProps) {
  return (
    <ApiErrorBoundary onRetry={onRetry} fallback={fallback}>
      {children}
    </ApiErrorBoundary>
  )
}