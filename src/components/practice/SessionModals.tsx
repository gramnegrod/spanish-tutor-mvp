'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SessionModalsProps {
  showTimeWarning: boolean
  timeWarningMinutes: number
  showSessionComplete: boolean
  showMaxSessions: boolean
  costs?: {
    totalCost: number
  }
  onDismissWarning: () => void
  onSessionContinue: (extend: boolean) => void
  onDisconnect: () => void
}

export function SessionModals({
  showTimeWarning,
  timeWarningMinutes,
  showSessionComplete,
  showMaxSessions,
  costs,
  onDismissWarning,
  onSessionContinue,
  onDisconnect
}: SessionModalsProps) {
  const router = useRouter()
  
  if (showTimeWarning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Time Warning</h3>
          <p className="text-gray-600 mb-4">
            You have {timeWarningMinutes} {timeWarningMinutes === 1 ? 'minute' : 'minutes'} remaining in this session.
          </p>
          <div className="text-sm text-gray-600 mb-4">
            Current session cost: ${costs?.totalCost.toFixed(4) || '0.0000'}
          </div>
          <Button onClick={onDismissWarning} className="w-full">Got it</Button>
        </div>
      </div>
    )
  }
  
  if (showSessionComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Session Complete</h3>
          <p className="text-gray-600 mb-4">
            Your 10-minute session has ended. You can extend for another 10 minutes (up to 2 times).
          </p>
          <div className="text-sm mb-4">
            <div className="font-semibold">Total cost: ${costs?.totalCost.toFixed(4) || '0.0000'}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onSessionContinue(false)} className="flex-1">
              End Session
            </Button>
            <Button onClick={() => onSessionContinue(true)} className="flex-1">
              Continue (10 more minutes)
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  if (showMaxSessions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Maximum Session Time Reached</h3>
          <p className="text-gray-600 mb-4">
            You've reached the maximum session time of 30 minutes. Please start a new session if you'd like to continue practicing.
          </p>
          <div className="text-sm mb-4">
            <div className="font-semibold">Final session cost: ${costs?.totalCost.toFixed(4) || '0.0000'}</div>
          </div>
          <Button onClick={() => {
            onDisconnect()
            router.push('/dashboard')
          }} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }
  
  return null
}