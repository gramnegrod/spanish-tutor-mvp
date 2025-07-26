'use client'

import React, { Suspense } from 'react'
import { NPCSelector } from '@/components/destination/NPCSelector'
import { Loader2 } from 'lucide-react'

export default function SelectNPCPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <NPCSelector />
    </Suspense>
  )
}