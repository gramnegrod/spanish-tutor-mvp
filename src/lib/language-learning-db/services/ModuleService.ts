/**
 * Module Service
 * 
 * Handles module progress tracking and analytics for the learning module system
 */

import type { StorageAdapter } from '../types'
import type { ModuleProgress } from '@/lib/modules/core/types'
import { ValidationError, StorageError } from '../types'

interface ModuleProgressWithId extends ModuleProgress {
  id: string
}

interface ModuleUsageStats {
  totalUsers: number
  avgCompletedSessions: number
  avgTimeSpent: number
  completionsByLevel: Record<string, number>
  topAchievements: Array<{ achievement: string; count: number }>
}

interface UserStreakData {
  currentStreak: number
  longestStreak: number
  streakHistory: Array<{ date: string; streak: number }>
  lastActiveDate: string
}

export class ModuleService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Get module progress for a specific user and module
   */
  async getModuleProgress(userId: string, moduleId: string): Promise<ModuleProgress | null> {
    const key = `${userId}:${moduleId}`
    const data = await this.getStorageData()
    return data.find(item => item.id === key) || null
  }

  /**
   * Save or update module progress
   */
  async saveModuleProgress(progress: ModuleProgress): Promise<void> {
    this.validateModuleProgress(progress)
    
    const key = `${progress.userId}:${progress.moduleId}`
    const data = await this.getStorageData()
    const existingIndex = data.findIndex(item => item.id === key)
    
    const progressWithId: ModuleProgressWithId = { ...progress, id: key }
    
    if (existingIndex >= 0) {
      data[existingIndex] = progressWithId
    } else {
      data.push(progressWithId)
    }
    
    await this.saveStorageData(data)
  }

  /**
   * Update specific fields of module progress
   */
  async updateModuleProgress(
    userId: string,
    moduleId: string,
    updates: Partial<ModuleProgress>
  ): Promise<void> {
    const existing = await this.getModuleProgress(userId, moduleId)
    if (!existing) {
      throw new StorageError(
        `Module progress not found for user ${userId} and module ${moduleId}`,
        'updateModuleProgress'
      )
    }
    
    const updated = { ...existing, ...updates }
    await this.saveModuleProgress(updated)
  }

  /**
   * Delete module progress
   */
  async deleteModuleProgress(userId: string, moduleId: string): Promise<void> {
    const key = `${userId}:${moduleId}`
    const data = await this.getStorageData()
    const filtered = data.filter(item => item.id !== key)
    
    if (filtered.length === data.length) {
      throw new StorageError(
        `Module progress not found for user ${userId} and module ${moduleId}`,
        'deleteModuleProgress'
      )
    }
    
    await this.saveStorageData(filtered)
  }

  /**
   * Get all module progress for a user
   */
  async getUserModules(userId: string): Promise<ModuleProgress[]> {
    const data = await this.getStorageData()
    return data
      .filter(item => item.userId === userId)
      .map(({ id, ...progress }) => progress as ModuleProgress)
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
  }

  /**
   * Batch get progress for multiple modules
   */
  async batchGetProgress(userId: string, moduleIds: string[]): Promise<ModuleProgress[]> {
    const data = await this.getStorageData()
    const keys = moduleIds.map(moduleId => `${userId}:${moduleId}`)
    
    return data
      .filter(item => keys.includes(item.id))
      .map(({ id, ...progress }) => progress as ModuleProgress)
  }

  /**
   * Batch update progress for multiple modules
   */
  async batchUpdateProgress(
    updates: Array<{ userId: string; moduleId: string; data: Partial<ModuleProgress> }>
  ): Promise<void> {
    const data = await this.getStorageData()
    
    for (const update of updates) {
      const key = `${update.userId}:${update.moduleId}`
      const index = data.findIndex(item => item.id === key)
      
      if (index >= 0) {
        data[index] = {
          ...data[index],
          ...update.data,
          id: key
        }
      }
    }
    
    await this.saveStorageData(data)
  }

  /**
   * Get module usage statistics
   */
  async getModuleUsageStats(moduleId: string): Promise<ModuleUsageStats> {
    const data = await this.getStorageData()
    const moduleData = data.filter(item => item.moduleId === moduleId)
    
    if (moduleData.length === 0) {
      return {
        totalUsers: 0,
        avgCompletedSessions: 0,
        avgTimeSpent: 0,
        completionsByLevel: {},
        topAchievements: []
      }
    }
    
    const completionsByLevel = moduleData.reduce((acc, item) => {
      const level = item.level || 'unknown'
      acc[level] = (acc[level] || 0) + item.completedSessions
      return acc
    }, {} as Record<string, number>)
    
    const achievementCounts = moduleData.reduce((acc, item) => {
      item.achievements.forEach(achievement => {
        acc[achievement] = (acc[achievement] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)
    
    const topAchievements = Object.entries(achievementCounts)
      .map(([achievement, count]) => ({ achievement, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return {
      totalUsers: new Set(moduleData.map(item => item.userId)).size,
      avgCompletedSessions: moduleData.reduce((sum, item) => sum + item.completedSessions, 0) / moduleData.length,
      avgTimeSpent: moduleData.reduce((sum, item) => sum + item.totalTimeSpent, 0) / moduleData.length,
      completionsByLevel,
      topAchievements
    }
  }

  /**
   * Get user streak data across all modules
   */
  async getUserStreakData(userId: string): Promise<UserStreakData> {
    const userModules = await this.getUserModules(userId)
    
    if (userModules.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakHistory: [],
        lastActiveDate: new Date().toISOString()
      }
    }
    
    // Get the most recent activity
    const mostRecent = userModules.reduce((latest, module) => 
      new Date(module.lastAccessed) > new Date(latest.lastAccessed) ? module : latest
    )
    
    // Calculate current streak from most active module
    const maxStreak = Math.max(...userModules.map(m => m.currentStreak))
    const longestStreak = Math.max(maxStreak, ...userModules.map(m => m.currentStreak))
    
    // Simple streak history (last 30 days)
    const streakHistory = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        streak: i === 0 ? maxStreak : Math.max(0, maxStreak - i)
      }
    }).reverse()
    
    return {
      currentStreak: maxStreak,
      longestStreak,
      streakHistory,
      lastActiveDate: mostRecent.lastAccessed.toString()
    }
  }

  // ============================================================================
  // Storage Helpers
  // ============================================================================

  private async getStorageData(): Promise<ModuleProgressWithId[]> {
    // Use localStorage for browser or in-memory storage for server
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('module-progress')
      return data ? JSON.parse(data) : []
    }
    return []
  }

  private async saveStorageData(data: ModuleProgressWithId[]): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('module-progress', JSON.stringify(data))
    }
  }

  private validateModuleProgress(progress: ModuleProgress): void {
    if (!progress.userId) {
      throw new ValidationError('User ID is required', 'userId', progress.userId)
    }
    if (!progress.moduleId) {
      throw new ValidationError('Module ID is required', 'moduleId', progress.moduleId)
    }
    if (progress.completedSessions < 0) {
      throw new ValidationError('Completed sessions cannot be negative', 'completedSessions', progress.completedSessions)
    }
    if (progress.totalTimeSpent < 0) {
      throw new ValidationError('Total time spent cannot be negative', 'totalTimeSpent', progress.totalTimeSpent)
    }
    if (progress.currentStreak < 0) {
      throw new ValidationError('Current streak cannot be negative', 'currentStreak', progress.currentStreak)
    }
  }
}