'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { getModule } from '@/lib/modules'
import { guidedJourneyModule } from '@/lib/modules/guided-journey'
import { JourneyMap } from '@/lib/modules/guided-journey'
import { useAuthStore } from '@/store/authStore'
import type { JourneyProgress } from '@/lib/modules/guided-journey'

export default function ModulePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const moduleId = params.moduleId as string
  
  const [loading, setLoading] = useState(true)
  const [journeyProgress, setJourneyProgress] = useState<JourneyProgress | null>(null)
  
  const loadModuleData = useCallback(async () => {
    try {
      const moduleData = getModule(moduleId)
      
      if (!moduleData) {
        router.push('/modules')
        return
      }
      
      // For now, only guided journey is implemented
      if (moduleId === 'guided-journey') {
        const userId = user?.id || 'guest'
        const progress = await guidedJourneyModule.getUserProgress(userId)
        setJourneyProgress(progress)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to load module:', error)
      setLoading(false)
    }
  }, [moduleId, user, router])
  
  useEffect(() => {
    loadModuleData()
  }, [loadModuleData])
  
  function handleScenarioSelect(scenarioId: string) {
    const route = guidedJourneyModule.getPracticeRoute(scenarioId, !!user)
    router.push(route)
  }
  
  // function handleBack() {
  //   router.push('/modules')
  // }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    )
  }
  
  // Render module-specific content
  if (moduleId === 'guided-journey' && journeyProgress) {
    return (
      <div className="min-h-screen bg-gray-900">
        <JourneyMap
          currentProgress={journeyProgress}
          onScenarioSelect={handleScenarioSelect}
        />
      </div>
    )
  }
  
  // Fallback for unimplemented modules
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">
          Module Not Found
        </h1>
        <button
          onClick={() => router.push('/modules')}
          className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80"
        >
          Back to Modules
        </button>
      </div>
    </div>
  )
}