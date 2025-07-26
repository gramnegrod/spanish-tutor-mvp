'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getAvailableModules, getModule, registerAllModules } from '@/lib/modules'
import { LanguageLearningDB } from '@/lib/language-learning-db'
import { useAuthStore } from '@/store/authStore'
import type { LearningModule, ModuleProgress } from '@/lib/modules/core/types'

interface ModuleCardProps {
  module: LearningModule
  progress?: ModuleProgress
  onSelect: (module: LearningModule) => void
  isAuthenticated: boolean
}

function ModuleCard({ module, progress, onSelect, isAuthenticated }: ModuleCardProps) {
  const completionRate = progress?.statistics?.completionRate || 0
  const isLocked = module.features.progressive && !progress?.isUnlocked && module.id !== 'free-practice'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      className={`relative bg-gray-700 rounded-xl p-6 ${
        isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-600'
      } transition-all`}
      onClick={() => !isLocked && onSelect(module)}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-xl">
          <span className="text-4xl">🔒</span>
        </div>
      )}
      
      {/* Module icon and info */}
      <div className="flex items-start gap-4">
        <span className="text-5xl">{module.icon}</span>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-100 mb-1">
            {module.name}
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            {module.description}
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-3">
            {module.features.progressive && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                Progressive
              </span>
            )}
            {module.features.adaptive && (
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                Adaptive
              </span>
            )}
            {!isAuthenticated && module.features.offline && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">
                Guest Mode
              </span>
            )}
          </div>
          
          {/* Progress bar */}
          {progress && !isLocked && (
            <div className="w-full bg-gray-600 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate * 100}%` }}
                className="bg-accent-primary h-full rounded-full"
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          )}
          
          {/* Estimated time */}
          <p className="text-gray-400 text-xs mt-2">
            ~{module.estimatedTime} minutes per session
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function ModuleSelectionDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [modules, setModules] = useState<LearningModule[]>([])
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({})
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Register all modules on component mount
    registerAllModules()
    
    // Load available modules
    const availableModules = getAvailableModules()
    setModules(availableModules)
    
    // Load progress if authenticated
    if (user) {
      loadModuleProgress(user.id)
    }
    
    setLoading(false)
  }, [user])
  
  async function loadModuleProgress(userId: string) {
    try {
      const db = LanguageLearningDB.getInstance()
      const progress: Record<string, ModuleProgress> = {}
      
      for (const module of modules) {
        const moduleProgress = await db.modules?.getProgress(userId, module.id, 'es')
        if (moduleProgress) {
          progress[module.id] = moduleProgress
        }
      }
      
      setModuleProgress(progress)
    } catch (error) {
      console.error('Failed to load module progress:', error)
    }
  }
  
  function handleModuleSelect(module: LearningModule) {
    // Navigate based on module type
    if (module.id === 'free-practice') {
      // Free practice goes to existing practice page
      router.push(user ? '/practice-v2' : '/practice-no-auth')
    } else if (module.id === 'guided-journey') {
      // Guided journey will have its own dashboard
      router.push(`/modules/${module.id}`)
    } else {
      // Future modules
      console.log('Module not yet implemented:', module.id)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    )
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Choose Your Learning Path
        </h1>
        <p className="text-xl text-gray-300">
          Select a module to start practicing your Spanish
        </p>
        {!user && (
          <p className="text-sm text-yellow-400 mt-2">
            🔓 Playing as guest - Sign in to save progress and unlock all features
          </p>
        )}
      </motion.div>
      
      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <AnimatePresence>
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ModuleCard
                module={module}
                progress={moduleProgress[module.id]}
                onSelect={handleModuleSelect}
                isAuthenticated={!!user}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Coming soon section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800 rounded-xl p-6 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-100 mb-4">
          More Modules Coming Soon!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 opacity-50">
            <span className="text-3xl mb-2 block">📰</span>
            <h3 className="font-semibold text-gray-200">Daily News Reader</h3>
            <p className="text-sm text-gray-400">Practice with real Mexican news</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 opacity-50">
            <span className="text-3xl mb-2 block">📚</span>
            <h3 className="font-semibold text-gray-200">Grammar Coach</h3>
            <p className="text-sm text-gray-400">Master Spanish grammar rules</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 opacity-50">
            <span className="text-3xl mb-2 block">📖</span>
            <h3 className="font-semibold text-gray-200">Book Club</h3>
            <p className="text-sm text-gray-400">Read stories adapted to your level</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}