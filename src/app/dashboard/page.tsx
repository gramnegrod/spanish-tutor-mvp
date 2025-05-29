'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ProgressCard } from '@/components/dashboard/ProgressCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/types'
import { Mic, LogOut, Trophy, Calendar } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [progress, setProgress] = useState<Progress | null>(null)
  const [streak, setStreak] = useState(0)
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      // Fetch progress
      const progressResponse = await fetch('/api/progress')
      const progressData = await progressResponse.json()
      setProgress(progressData.progress)
      setStreak(progressData.streak)

      // Fetch recent conversations
      const conversationsResponse = await fetch('/api/conversations')
      const conversationsData = await conversationsResponse.json()
      setConversations(conversationsData.conversations || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">¡Hola, {session?.user?.name || 'amigo'}!</h1>
            <p className="text-gray-600">Ready to practice some Mexican Spanish?</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Start Practicing</h2>
                <p className="text-green-100">
                  Jump into a conversation with our friendly Taquero
                </p>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => router.push('/practice')}
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Conversation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Progress Card */}
          <ProgressCard progress={progress} streak={streak} />

          {/* Recent Conversations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>
                Your practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mic className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start practicing to see your history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.slice(0, 5).map((conversation) => (
                    <div
                      key={conversation.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{conversation.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDuration(conversation.duration || 0)}
                        </p>
                        {conversation.analysis?.keyLearnings && (
                          <p className="text-xs text-green-600">
                            {conversation.analysis.keyLearnings.length} learnings
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg ${streak >= 1 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <Calendar className={`h-8 w-8 mx-auto mb-2 ${streak >= 1 ? 'text-yellow-500' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">First Day</p>
                <p className="text-xs text-gray-600">Practice 1 day</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${streak >= 7 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <Calendar className={`h-8 w-8 mx-auto mb-2 ${streak >= 7 ? 'text-yellow-500' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">Week Warrior</p>
                <p className="text-xs text-gray-600">7 day streak</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${conversations.length >= 10 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <Mic className={`h-8 w-8 mx-auto mb-2 ${conversations.length >= 10 ? 'text-yellow-500' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">Chatty</p>
                <p className="text-xs text-gray-600">10 conversations</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${progress?.totalMinutes && progress.totalMinutes >= 60 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <Trophy className={`h-8 w-8 mx-auto mb-2 ${progress?.totalMinutes && progress.totalMinutes >= 60 ? 'text-yellow-500' : 'text-gray-400'}`} />
                <p className="text-sm font-medium">Hour Hero</p>
                <p className="text-xs text-gray-600">60 minutes total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}