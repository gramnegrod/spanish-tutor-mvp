import React from 'react'

interface SessionCostDisplayProps {
  totalCost: number
  audioInputSeconds: number
  audioOutputSeconds: number
  className?: string
}

export function SessionCostDisplay({ 
  totalCost, 
  audioInputSeconds, 
  audioOutputSeconds,
  className = ''
}: SessionCostDisplayProps) {
  return (
    <div className={`p-3 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Session Cost:</span>
        <span className="font-mono font-semibold text-green-600">
          ${totalCost.toFixed(4)}
        </span>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
        <span>You: {audioInputSeconds.toFixed(1)}s</span>
        <span>AI: {audioOutputSeconds.toFixed(1)}s</span>
      </div>
    </div>
  )
}