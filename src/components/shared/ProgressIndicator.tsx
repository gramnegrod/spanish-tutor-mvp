'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface ProgressIndicatorProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProgressIndicator({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = 'default',
  size = 'md',
  className
}: ProgressIndicatorProps) {
  const percentage = Math.round((value / max) * 100)
  
  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className={cn("space-y-1", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="text-gray-600">{label}</span>}
          {showPercentage && (
            <span className="text-gray-500 font-medium">{percentage}%</span>
          )}
        </div>
      )}
      <Progress 
        value={percentage} 
        className={cn("w-full", sizeClasses[size])}
      />
    </div>
  )
}

// Circular progress indicator
interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  showValue?: boolean
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function CircularProgress({
  value,
  max = 100,
  size = 60,
  strokeWidth = 4,
  showValue = true,
  variant = 'default',
  className
}: CircularProgressProps) {
  const percentage = Math.round((value / max) * 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const variantColors = {
    default: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="text-gray-200"
          stroke="currentColor"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={cn("transition-all duration-300", variantColors[variant])}
          stroke="currentColor"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-medium">
          {percentage}%
        </span>
      )}
    </div>
  )
}

// Step progress indicator
interface StepProgressProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
  className?: string
}

export function StepProgress({
  currentStep,
  totalSteps,
  labels,
  className
}: StepProgressProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center",
              i < totalSteps - 1 && "flex-1"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                i < currentStep
                  ? "bg-blue-600 text-white"
                  : i === currentStep
                  ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600"
                  : "bg-gray-200 text-gray-400"
              )}
            >
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-colors",
                  i < currentStep ? "bg-blue-600" : "bg-gray-200"
                )}
              />
            )}
          </div>
        ))}
      </div>
      {labels && (
        <div className="flex justify-between">
          {labels.map((label, i) => (
            <div
              key={i}
              className={cn(
                "text-xs text-center",
                i <= currentStep ? "text-gray-700" : "text-gray-400"
              )}
              style={{ width: `${100 / totalSteps}%` }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}