'use client'

import dynamic from 'next/dynamic'

const ErrorLogViewer = dynamic(
  () => import('./ErrorLogViewer').then(mod => mod.ErrorLogViewer),
  { ssr: false }
)

export function ErrorLogViewerWrapper() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return <ErrorLogViewer />
}