import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function calculateStreak(lastPractice: Date | null): number {
  if (!lastPractice) return 0
  
  const now = new Date()
  const lastPracticeDate = new Date(lastPractice)
  const diffInDays = Math.floor((now.getTime() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24))
  
  return diffInDays <= 1 ? 1 : 0
}

export function safeFormatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Unknown date'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return 'Unknown date'
    }
    return dateObj.toLocaleDateString()
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    return 'Unknown date'
  }
}

export function safeFormatTime(date: string | Date | null | undefined): string {
  if (!date) return '--:--'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date encountered in safeFormatTime:', date)
      return '--:--'
    }
    return dateObj.toLocaleTimeString()
  } catch (error) {
    console.warn('Error formatting time:', date, error)
    return '--:--'
  }
}