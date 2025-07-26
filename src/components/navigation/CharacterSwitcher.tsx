'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface CharacterSwitcherProps {
  currentNpcId?: string
}

export function CharacterSwitcher({ currentNpcId }: CharacterSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
  const quickCharacters = [
    { id: 'taco_vendor', name: 'Don Roberto', emoji: '🌮' },
    { id: 'taxi_driver', name: 'Juan', emoji: '🚕' },
    { id: 'coffee_barista', name: 'Mariana', emoji: '☕' },
    { id: 'restaurant_waiter', name: 'Carlos', emoji: '🥗' },
  ]
  
  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          aria-label="Switch character"
        >
          {isOpen ? '✕' : '👥'}
        </Button>
      </div>
      
      {/* Character Menu */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 bg-white rounded-lg shadow-xl p-4 w-64">
          <h3 className="font-semibold text-gray-900 mb-3">Switch Character</h3>
          
          {/* Quick Characters */}
          <div className="space-y-2 mb-4">
            {quickCharacters.map((char) => (
              <button
                key={char.id}
                onClick={() => {
                  router.push(`/practice-v2?dest=mexico-city&npc=${char.id}`)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2 ${
                  currentNpcId === char.id ? 'bg-purple-50 text-purple-700' : ''
                }`}
              >
                <span className="text-2xl">{char.emoji}</span>
                <span>{char.name}</span>
              </button>
            ))}
          </div>
          
          {/* Browse All Button */}
          <Button
            onClick={() => {
              router.push('/practice-v2/select-npc')
              setIsOpen(false)
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Browse All 11 Characters
          </Button>
        </div>
      )}
    </>
  )
}