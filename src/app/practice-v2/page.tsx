'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMultiDestinationSession } from '@/hooks/useMultiDestinationSession'
import { PracticeLayout } from '@/components/practice/PracticeLayout'
import { ConversationSession } from '@/components/practice/ConversationSession'
import { VoiceControl } from '@/components/practice/VoiceControl'
import { DynamicSpanishAnalyticsDashboard } from '@/components/practice/DynamicSpanishAnalyticsDashboard'
import { DynamicSessionModals } from '@/components/practice/DynamicSessionModals'
import { DynamicSessionSummaryWithAnalysis } from '@/components/spanish-analysis/DynamicSessionSummary'
import { CharacterSwitcher } from '@/components/navigation/CharacterSwitcher'
import { GuestModeHeader } from '@/components/layout/GuestModeHeader'
import { AdventureProgressBar } from '@/components/adventure/AdventureProgressBar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Loader2 } from 'lucide-react'

function PracticeContent() {
  const searchParams = useSearchParams()
  const destinationId = searchParams.get('dest') || 'mexico-city'
  const npcId = searchParams.get('npc') || 'taco_vendor'
  const mode = searchParams.get('mode') || 'single'
  const guestMode = searchParams.get('guest') === 'true'
  const adventureId = searchParams.get('adventure')
  const scenarioId = searchParams.get('scenario')
  
  const session = useMultiDestinationSession({
    destinationId,
    npcId,
    mode: mode as 'single' | 'adventure',
    enableAuth: !guestMode,  // Disable auth for guest mode
    enableAdaptation: true,
    enableAnalysis: true,
    autoConnect: false,  // Don't auto-connect, wait for manual connection
    adventureId,  // Pass adventure ID if present
    scenarioId    // Pass scenario ID if present
  })
  
  const {
    // NPC data
    npc,
    isLoading,
    error,
    
    // Connection state
    isConnected,
    connect,
    disconnect,
    
    // Transcript management
    transcripts,
    currentSpeaker,
    conversationStartTime,
    
    // Session management
    isAnalyzing,
    showSummary,
    handleEndConversation,
    handleRestart,
    handleCloseSummary,
    
    // Analytics
    sessionStats,
    lastComprehensionFeedback,
    getFullSpanishAnalysis,
    costs,
    
    // Learner profile
    learnerProfile,
    
    // Adaptation
    adaptationProgress,
    
    // Audio ref
    audioRef,
    
    // Time warnings
    showTimeWarning,
    timeWarningMinutes,
    showSessionComplete,
    showMaxSessions,
    dismissWarning,
    handleSessionContinue
  } = session
  
  const currentAnalysis = getFullSpanishAnalysis()
  const duration = conversationStartTime 
    ? Math.floor((Date.now() - conversationStartTime.getTime()) / 1000)
    : 0
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }
  
  if (error || !npc) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Practice Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error?.message || 'NPC not found'}</p>
            <p className="mt-2 text-sm text-gray-600">
              Try selecting a different character or refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <>
      {/* Show guest mode header if in guest mode */}
      {guestMode && <GuestModeHeader />}
      
      {/* Show adventure progress if in adventure mode */}
      {mode === 'adventure' && adventureId && scenarioId && (
        <AdventureProgressBar 
          adventureId={adventureId} 
          currentScenarioId={scenarioId} 
        />
      )}
      
      <PracticeLayout
        title={`Practice with ${npc.name}`}
        npcName={npc.name}
        subtitle={npc.role}
        scenario={npc.scenario_type || 'general'}
        showVocabularyGuide={true}
        vocabularyWordsUsed={currentAnalysis?.wordsUsed?.map((w: any) => w.word) || []}
      >
      {/* Hidden audio element */}
      <audio ref={audioRef} autoPlay hidden />
      
      {/* Character Switcher FAB */}
      {/* <CharacterSwitcher currentNpcId={npcId} /> */}
      
      {/* Spanish Analytics Dashboard - Dynamically loaded */}
      <DynamicSpanishAnalyticsDashboard
        scenario={npc.scenario_type || 'general'}
        analysis={currentAnalysis}
        sessionStats={sessionStats}
        lastFeedback={lastComprehensionFeedback}
        className="mb-6"
      />
      
      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Conversation Display */}
        <ConversationSession
          title="Conversation"
          description={npc.backstory}
          transcripts={transcripts}
          isProcessing={false}
          currentSpeaker={currentSpeaker}
          isConnected={isConnected}
          sessionStats={sessionStats}
          costs={costs}
          isAnalyzing={isAnalyzing}
          onRestart={handleRestart}
          onEnd={handleEndConversation}
        />
        
        {/* Voice Control */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Control</CardTitle>
            <CardDescription>
              {isConnected ? 'Speak naturally in Spanish' : 'Click Connect to start practicing'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoiceControl
              isConnected={isConnected}
              isConnecting={isAnalyzing}
              currentSpeaker={currentSpeaker}
              learnerProfile={learnerProfile}
              onConnect={connect}
              hasManuallyConnected={isConnected}
              adaptationProgress={adaptationProgress}
              isUpdatingInstructions={false}
              onRetry={connect}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Session Modals - Dynamically loaded */}
      <DynamicSessionModals
        showTimeWarning={showTimeWarning}
        timeWarningMinutes={timeWarningMinutes}
        showSessionComplete={showSessionComplete}
        showMaxSessions={showMaxSessions}
        costs={costs}
        onDismissWarning={dismissWarning}
        onSessionContinue={handleSessionContinue}
        onDisconnect={disconnect}
      />
      
      {/* Session Summary - Dynamically loaded */}
      {showSummary && conversationStartTime && (
        <DynamicSessionSummaryWithAnalysis
          analysis={currentAnalysis}
          sessionStats={sessionStats}
          duration={duration}
          onClose={handleCloseSummary}
        />
      )}
      
      {/* Character Switcher FAB - hide in adventure mode */}
      {mode !== 'adventure' && <CharacterSwitcher currentNpcId={npcId} />}
    </PracticeLayout>
    </>
  )
}

export default function UniversalPracticePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  )
}