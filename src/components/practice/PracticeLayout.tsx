'use client'

import React from 'react'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { GuestModeHeader } from '@/components/layout/GuestModeHeader'
import { VocabularyGuide } from '@/components/spanish-analysis/VocabularyGuide'

interface PracticeLayoutProps {
  title: string
  subtitle?: string
  npcName?: string
  scenario?: string
  isGuest?: boolean
  showVocabularyGuide?: boolean
  vocabularyWordsUsed?: string[]
  children: React.ReactNode
}

export function PracticeLayout({
  title,
  subtitle,
  npcName,
  scenario,
  isGuest = false,
  showVocabularyGuide = true,
  vocabularyWordsUsed = [],
  children
}: PracticeLayoutProps) {
  return (
    <div className="min-h-screen">
      {isGuest ? <GuestModeHeader /> : <AuthHeader />}
      
      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              {title}
              {npcName && ` with ${npcName}`}
            </h1>
            {subtitle && (
              <p className="text-gray-600 mt-2">{subtitle}</p>
            )}
          </div>

          {/* Vocabulary Guide */}
          {showVocabularyGuide && scenario && (
            <div className="mb-6">
              <VocabularyGuide 
                scenario={scenario}
                wordsUsed={vocabularyWordsUsed}
              />
            </div>
          )}

          {/* Main Content */}
          {children}
        </div>
      </div>
    </div>
  )
}