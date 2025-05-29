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