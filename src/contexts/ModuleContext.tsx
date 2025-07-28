'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { registerAllModules, getModule } from '@/lib/modules'
import { ModuleLifecycle } from '@/lib/modules/core/ModuleLifecycle'
import { LanguageLearningDB } from '@/lib/language-learning-db'
import { useAuthStore } from '@/store/authStore'
import type { LearningModule, ModuleProgress } from '@/lib/modules/core/types'

interface ModuleContextValue {
  // Module management
  activeModule: LearningModule | null
  moduleLifecycle: ModuleLifecycle | null
  moduleProgress: Record<string, ModuleProgress>
  
  // Actions
  activateModule: (moduleId: string) => Promise<void>
  deactivateModule: () => Promise<void>
  updateModuleProgress: (moduleId: string, progress: Partial<ModuleProgress>) => Promise<void>
  
  // State
  loading: boolean
  error: string | null
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined)

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null)
  const [moduleLifecycle, setModuleLifecycle] = useState<ModuleLifecycle | null>(null)
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize modules on mount
  useEffect(() => {
    registerAllModules()
  }, [])
  
  // Load module progress when user changes
  useEffect(() => {
    if (user) {
      loadAllModuleProgress(user.id)
    }
  }, [user?.id])
  
  async function loadAllModuleProgress(userId: string) {
    try {
      // TODO: Implement database integration
      // const db = new LanguageLearningDB(config)
      // if (!db.modules) return
      
      // Load progress for all registered modules
      const modules = ['free-practice', 'guided-journey'] // TODO: Get from registry
      const progress: Record<string, ModuleProgress> = {}
      
      // for (const moduleId of modules) {
      //   const moduleProgress = await db.modules.getProgress(userId, moduleId, 'es')
      //   if (moduleProgress) {
      //     progress[moduleId] = moduleProgress
      //   }
      // }
      
      setModuleProgress(progress)
    } catch (err) {
      console.error('Failed to load module progress:', err)
    }
  }
  
  async function activateModule(moduleId: string) {
    try {
      setLoading(true)
      setError(null)
      
      // Get the module
      const module = getModule(moduleId)
      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }
      
      // TODO: Implement proper module lifecycle management
      // const lifecycle = new ModuleLifecycle(registry)
      // await lifecycle.initialize(...)
      // await lifecycle.start(moduleId, context)
      
      setActiveModule(module)
      // setModuleLifecycle(lifecycle)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate module')
      setLoading(false)
      console.error('Module activation error:', err)
    }
  }
  
  async function deactivateModule() {
    try {
      // TODO: Implement lifecycle cleanup
      // if (moduleLifecycle) {
      //   await moduleLifecycle.stop()
      //   moduleLifecycle.cleanup()
      // }
      
      setActiveModule(null)
      setModuleLifecycle(null)
    } catch (err) {
      console.error('Module deactivation error:', err)
    }
  }
  
  async function updateModuleProgress(moduleId: string, progress: Partial<ModuleProgress>) {
    try {
      // TODO: Implement database integration
      // const db = new LanguageLearningDB(config)
      const userId = user?.id || 'guest'
      
      // if (db.modules) {
      //   await db.modules.updateProgress(userId, moduleId, 'es', progress)
      //   
      //   // Reload progress
      //   const updated = await db.modules.getProgress(userId, moduleId, 'es')
      //   if (updated) {
      //     setModuleProgress(prev => ({
      //       ...prev,
      //       [moduleId]: updated
      //     }))
      //   }
      // }
    } catch (err) {
      console.error('Failed to update module progress:', err)
    }
  }
  
  const value: ModuleContextValue = {
    activeModule,
    moduleLifecycle,
    moduleProgress,
    activateModule,
    deactivateModule,
    updateModuleProgress,
    loading,
    error
  }
  
  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModules() {
  const context = useContext(ModuleContext)
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider')
  }
  return context
}