import React from 'react'
import { Card } from '@/components/ui/card'

interface AdventureProgressBarProps {
  adventureId: string
  currentScenarioId: string
}

export function AdventureProgressBar({ adventureId, currentScenarioId }: AdventureProgressBarProps) {
  // This is a placeholder component that can be enhanced later
  // with full adventure progression tracking
  return (
    <Card className="mb-4 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Adventure: {adventureId}
        </div>
        <div className="text-sm text-gray-600">
          Current Scenario: {currentScenarioId}
        </div>
      </div>
    </Card>
  )
}