'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProgressCard } from '@/components/dashboard/ProgressCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/types'
import { Mic, LogOut, Trophy, Calendar } from 'lucide-react'
import { formatDuration, safeFormatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [progress, setProgress] = useState<Progress | null>(null)
  const [streak, setStreak] = useState(0)
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user) {
      fetchData()
    }
  }, [user, loading, router])

  const fetchData = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      // Fetch progress
      const progressResponse = await fetch('/api/progress')
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setProgress(progressData.progress)
        setStreak(progressData.streak)
      } else {
        console.warn('Failed to fetch progress:', progressResponse.status)
      }

      // Fetch recent conversations
      const conversationsResponse = await fetch('/api/conversations')
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json()
        setConversations(conversationsData.conversations || [])
      } else {
        console.warn('Failed to fetch conversations:', conversationsResponse.status)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">¡Hola, {user?.email?.split('@')[0] || 'amigo'}!</h1>
            <p className="text-gray-600">Ready to practice some Mexican Spanish?</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-8">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Quick Practice</h2>
                  <p className="text-green-100">
                    Jump into a conversation with our friendly Taquero
                  </p>
                </div>
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => router.push('/practice-v2?dest=mexico-city&npc=taco_vendor')}
                  className="bg-white text-green-600 hover:bg-gray-100 mt-4 w-full"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Conversation
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardContent className="p-8">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">🇲🇽 Mexico City Adventure</h2>
                  <p className="text-orange-100">
                    Complete journey through 11 authentic conversations
                  </p>
                </div>
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => router.push('/practice-v2/select-npc')}
                  className="bg-white text-orange-600 hover:bg-gray-100 mt-4 w-full"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Adventure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
                          {safeFormatDate(conversation.createdAt)}
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
              <div className={`text-center p-4 rounded-lg ${progress?.total_minutes_practiced && progress.total_minutes_practiced >= 60 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                <Trophy className={`h-8 w-8 mx-auto mb-2 ${progress?.total_minutes_practiced && progress.total_minutes_practiced >= 60 ? 'text-yellow-500' : 'text-gray-400'}`} />
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