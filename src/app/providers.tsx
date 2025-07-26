'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <SWRConfig value={swrConfig}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SWRConfig>
    </ErrorBoundary>
  )
}