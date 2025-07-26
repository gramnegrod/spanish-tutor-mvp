/**
 * Spanish Tutor Module System
 * 
 * Central export point for all learning modules
 */

// Core module infrastructure
export { ModuleRegistry } from './core/ModuleRegistry'
export { ModuleLifecycle } from './core/ModuleLifecycle'
export { ModuleProgressTracker } from './core/ModuleProgressTracker'
export * from './core/types'

// Learning modules
export { freePracticeModule } from './free-practice'
export { guidedJourneyModule } from './guided-journey'

// Module registration helper
import { ModuleRegistry } from './core/ModuleRegistry'
import { freePracticeModule } from './free-practice'
import { guidedJourneyModule } from './guided-journey'

/**
 * Register all available modules
 * Call this during app initialization
 */
export function registerAllModules(): void {
  const registry = ModuleRegistry.getInstance()
  
  // Register built-in modules
  registry.register(freePracticeModule)
  registry.register(guidedJourneyModule)
  
  console.log('Registered modules:', registry.getAllModules().map(m => m.id))
}

/**
 * Get all available modules for display
 */
export function getAvailableModules() {
  return ModuleRegistry.getInstance().getAllModules()
}

/**
 * Get a specific module by ID
 */
export function getModule(moduleId: string) {
  return ModuleRegistry.getInstance().getModule(moduleId)
}