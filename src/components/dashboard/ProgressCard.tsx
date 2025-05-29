'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@prisma/client'
import { TrendingUp, Book, Mic, Brain, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressCardProps {
  progress: Progress | null
  streak: number
}

export function ProgressCard({ progress, streak }: ProgressCardProps) {
  const skills = [
    { 
      name: 'Pronunciation', 
      value: progress?.pronunciation || 0, 
      icon: Mic,
      color: 'bg-blue-500'
    },
    { 
      name: 'Grammar', 
      value: progress?.grammar || 0, 
      icon: Book,
      color: 'bg-green-500'
    },
    { 
      name: 'Fluency', 
      value: progress?.fluency || 0, 
      icon: TrendingUp,
      color: 'bg-yellow-500'
    },
    { 
      name: 'Cultural Knowledge', 
      value: progress?.culturalKnowledge || 0, 
      icon: Globe,
      color: 'bg-purple-500'
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Progress</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <span className="text-orange-500">🔥</span>
            <span>{streak} day streak</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{progress?.totalMinutes || 0}</p>
            <p className="text-sm text-gray-600">Minutes Practiced</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{progress?.wordsLearned || 0}</p>
            <p className="text-sm text-gray-600">Words Learned</p>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-4">
          {skills.map((skill) => {
            const Icon = skill.icon
            return (
              <div key={skill.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{skill.value}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full", skill.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Vocabulary Preview */}
        {progress?.vocabulary && (
          <div>
            <p className="text-sm font-medium mb-2">Recent Vocabulary</p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                try {
                  const vocab = JSON.parse(progress.vocabulary)
                  return vocab.slice(-5).map((word: string) => (
                    <span
                      key={word}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {word}
                    </span>
                  ))
                } catch {
                  return null
                }
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}