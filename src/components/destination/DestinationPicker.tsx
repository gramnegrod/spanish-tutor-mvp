/**
 * Destination Picker Component
 * Allows users to select between available practice destinations
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Plane } from 'lucide-react'

interface Destination {
  id: string
  name: string
  description: string
  npcCount: number
  flag: string
}

const destinations: Destination[] = [
  {
    id: 'mexico-city',
    name: 'Mexico City',
    description: 'Practice authentic Mexican Spanish with local characters',
    npcCount: 11,
    flag: '🇲🇽'
  },
  {
    id: 'london',
    name: 'London',
    description: 'Coming Soon: Spanish speakers in London',
    npcCount: 25,
    flag: '🇬🇧'
  }
]

export function DestinationPicker() {
  const router = useRouter()
  
  const handleDestinationClick = (destinationId: string) => {
    if (destinationId === 'london') {
      // London is not ready yet
      return
    }
    // Go to NPC selection for this destination
    router.push(`/practice-v2/select-npc?dest=${destinationId}`)
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Destination</h1>
        <p className="text-gray-600">Select a city to practice Spanish with local NPCs</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {destinations.map((destination) => (
          <Card 
            key={destination.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              destination.id === 'london' ? 'opacity-50' : 'hover:scale-105'
            }`}
            onClick={() => handleDestinationClick(destination.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{destination.flag}</span>
                  {destination.name}
                </CardTitle>
                {destination.id === 'london' ? (
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
                ) : (
                  <Plane className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {destination.description}
              </CardDescription>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{destination.npcCount} characters available</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}