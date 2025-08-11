/**
 * NPC Selector Component
 * Displays available NPCs for a destination
 */

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAllNPCs } from '@/lib/npc-system'
import { NPC } from '@/lib/npc-system/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, MapPin, Clock, Target, Loader2 } from 'lucide-react'

export function NPCSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destinationId = searchParams.get('dest') || 'mexico-city'
  
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadNPCs() {
      setIsLoading(true)
      setError(null)
      
      try {
        const loadedNpcs = await getAllNPCs(destinationId)
        console.log('Loaded NPCs:', loadedNpcs) // Debug log
        setNpcs(loadedNpcs)
      } catch (err) {
        setError('Failed to load NPCs')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadNPCs()
  }, [destinationId])
  
  const handleNPCSelect = (npcId: string) => {
    router.push(`/practice-v2?dest=${destinationId}&npc=${npcId}`)
  }
  
  const handleAdventureMode = () => {
    const firstNpc = npcs.find(npc => npc.order === 0) || npcs[0]
    if (firstNpc) {
      router.push(`/practice-v2?dest=${destinationId}&npc=${firstNpc.id}&mode=adventure`)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button 
              className="mt-4"
              onClick={() => router.push('/practice-v2')}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Character</h1>
        <p className="text-gray-600">
          Select an NPC to practice with in {destinationId.replace('-', ' ')}
        </p>
      </div>
      
      {/* Adventure Mode Option */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Adventure Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Experience all {npcs.length} characters in a guided journey through {destinationId.replace('-', ' ')}.
            </p>
            <Button onClick={handleAdventureMode} className="w-full md:w-auto">
              Start Adventure
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* NPC Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {npcs.map((npc) => (
          <Card 
            key={npc.id}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
            onClick={() => handleNPCSelect(npc.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {npc.name} (ID: {npc.id})
              </CardTitle>
              <CardDescription>{npc.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {npc.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{npc.location}</span>
                  </div>
                )}
                {npc.estimatedDuration && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{npc.estimatedDuration} minutes</span>
                  </div>
                )}
                {npc.learning_goals && npc.learning_goals.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium mb-1">You&apos;ll practice:</p>
                    <ul className="list-disc list-inside text-gray-600">
                      {npc.learning_goals.slice(0, 2).map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}