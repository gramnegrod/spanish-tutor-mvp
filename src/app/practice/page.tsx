'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ConversationUI } from '@/components/audio/ConversationUI'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { ArrowLeft, RefreshCw, Mic, Loader2 } from 'lucide-react'
import { generateAdaptivePrompt, LearnerProfile } from '@/lib/pedagogical-system'
import { ConversationTranscript } from '@/types'
import { ConversationAnalysisService } from '@/services/conversation-analysis'
import { useConversationEngine } from '@/hooks/useConversationEngine'
import { usePracticeAdaptation } from '@/hooks/usePracticeAdaptation'
import { ProgressFeedback } from '@/components/practice/ProgressFeedback'
import { SessionStatsDisplay } from '@/components/practice/SessionStats'
import { VoiceControl } from '@/components/practice/VoiceControl'

export default function PracticePage() {
  console.log('[Practice] Component rendering...');
  const router = useRouter()
  const { user, loading } = useAuth()
  console.log('[Practice] Auth state:', { user: !!user, loading });
  
  // Basic state
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Track learner profile
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>({
    level: 'beginner',
    comfortWithSlang: false,
    needsMoreEnglish: true,
    strugglingWords: [],
    masteredPhrases: []
  });
  
  // Current scenario state
  const [currentScenario] = useState('taco_ordering');
  
  // Store ref to disconnect function to use in cleanup
  const disconnectRef = useRef<(() => void) | null>(null);
  
  // Save profile to Supabase
  const saveUserAdaptations = async (profile: LearnerProfile) => {
    if (!user) return;
    
    try {
      console.log('[Practice] Saving user adaptations:', profile);
      await fetch('/api/adaptations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          common_errors: profile.strugglingWords,
          mastered_concepts: profile.masteredPhrases,
          struggle_areas: profile.needsMoreEnglish ? ['comprehension'] : []
        })
      });
    } catch (error) {
      console.error('[Practice] Failed to save user adaptations:', error);
    }
  };
  
  // Generate AI instructions
  const generateInstructions = (profile: LearnerProfile) => {
    const adaptivePrompt = generateAdaptivePrompt(
      'friendly Mexican taco vendor (taquero) Don Roberto in Mexico City at a busy street stand',
      currentScenario,
      profile
    );
    
    return `${adaptivePrompt}

PERSONALITY:
- Name: Don Roberto, 45 years old, been selling tacos for 20 years
- Warm, patient, loves to chat with customers
- Proud of your tacos, especially your al pastor
- Call people "güero/güera", "joven", "amigo/amiga"

IMPORTANT RULES:
- Wait for the customer to speak first before greeting
- If you hear silence or unclear sounds, DO NOT respond
- Only greet ONCE when you hear clear speech
- Never repeat greetings

MENU & PRICES:
- Al pastor (con piña): 15 pesos
- Carnitas: 12 pesos
- Suadero: 12 pesos  
- Bistec: 15 pesos
- Quesadillas: 20 pesos

REMEMBER: You're not a language teacher, you're a taco vendor who happens to help tourists learn Spanish naturally.`;
  };

  // Initialize conversation engine first (it has no dependencies on OpenAI hook)
  const conversationEngine = useConversationEngine({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    onSaveProfile: saveUserAdaptations
  });

  // Refs to hold the latest hooks for callback access
  const conversationEngineRef = useRef(conversationEngine);
  const adaptationSystemRef = useRef<any>(null);

  // Update refs when hooks change
  useEffect(() => {
    conversationEngineRef.current = conversationEngine;
  }, [conversationEngine]);

  // Create stable callback for transcript processing
  const handleTranscript = useCallback(async (role: 'user' | 'assistant', text: string) => {
    console.log('[Practice] onTranscript fired:', { role, text: text.substring(0, 50) + '...' });
    
    // Process transcript through conversation engine
    const { displayText, updatedProfile } = await conversationEngineRef.current.processTranscript(role, text);
    
    // Add to transcript display
    setTranscripts(prev => [...prev, {
      id: crypto.randomUUID(),
      speaker: role as 'user' | 'assistant',
      text: displayText,
      timestamp: new Date()
    }]);
    setCurrentSpeaker(role);
    setTimeout(() => setCurrentSpeaker(null), 1000);
    
    // Process adaptation for user speech
    if (role === 'user' && text && text.trim().length > 0 && adaptationSystemRef.current) {
      // Import detectComprehension for adaptation processing
      const { detectComprehension } = await import('@/lib/pedagogical-system');
      const { understood, confidence } = detectComprehension(text);
      
      await adaptationSystemRef.current.processPerformance(understood, confidence);
    }
  }, []);

  // Initialize OpenAI Realtime with stable callback
  const {
    isConnected,
    costs,
    showTimeWarning,
    timeWarningMinutes,
    showSessionComplete,
    sessionInfo,
    showMaxSessions,
    extendSession,
    handleSessionContinue,
    startFreshSession,
    dismissWarning,
    updateInstructions,
    connect,
    disconnect,
    audioRef
  } = useOpenAIRealtime({
    enableInputTranscription: true,
    instructions: generateInstructions(learnerProfile),
    voice: 'alloy',
    autoConnect: false,
    turnDetection: {
      type: 'server_vad',
      threshold: 0.7,
      prefixPaddingMs: 500,
      silenceDurationMs: 800
    },
    onTranscript: handleTranscript
  });

  // Initialize adaptation system (now that we have updateInstructions)
  const adaptationSystem = usePracticeAdaptation({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    onInstructionsUpdate: updateInstructions,
    onSaveProfile: saveUserAdaptations,
    generateInstructions
  });

  // Update adaptation system ref
  useEffect(() => {
    adaptationSystemRef.current = adaptationSystem;
  }, [adaptationSystem]);

  // Auth redirect effect
  useEffect(() => {
    if (!loading && !user) {
      console.log('[Practice] No user found, redirecting to login...');
      router.push('/login');
    } else if (!loading && user) {
      console.log('[Practice] User found:', user.email);
    }
  }, [user, loading, router]);
  
  // Cleanup effect
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);
  
  useEffect(() => {
    return () => {
      console.log('[Practice] Component unmounting, disconnecting...');
      if (disconnectRef.current) {
        disconnectRef.current();
      }
    };
  }, []);

  // Load user adaptations when user is available
  useEffect(() => {
    if (user) {
      loadUserAdaptations();
    }
  }, [user]);

  const loadUserAdaptations = async () => {
    if (!user) return;
    
    try {
      console.log('[Practice] Loading user adaptations...');
      const response = await fetch('/api/adaptations');
      
      if (response.ok) {
        const { adaptations } = await response.json();
        
        if (adaptations) {
          const profile = {
            level: 'beginner' as const,
            comfortWithSlang: false,
            needsMoreEnglish: adaptations.common_errors.length > 3,
            strugglingWords: adaptations.common_errors,
            masteredPhrases: adaptations.mastered_concepts
          };
          
          console.log('[Practice] Loaded adaptations:', profile);
          setLearnerProfile(profile);
        } else {
          console.log('[Practice] No existing adaptations found, using defaults');
        }
      }
    } catch (error) {
      console.error('[Practice] Failed to load user adaptations:', error);
    }
  };

  // Simplified connection state
  const [hasManuallyConnected, setHasManuallyConnected] = useState(false);
  
  const handleConnect = async () => {
    if (!user) {
      console.error('[Practice] No user for connection');
      return;
    }
    
    console.log('[Practice] Manual connect triggered...');
    setHasManuallyConnected(true);
    
    try {
      await connect();
      console.log('[Practice] Manual connect successful');
    } catch (err) {
      console.error('[Practice] Manual connect failed:', err);
      setHasManuallyConnected(false);
    }
  };

  // Start conversation timer when first transcript appears
  useEffect(() => {
    if (transcripts.length > 0 && !conversationStartTime) {
      setConversationStartTime(new Date());
    }
  }, [transcripts, conversationStartTime]);

  const handleEndConversation = async () => {
    if (transcripts.length === 0) return;

    disconnect();
    setHasManuallyConnected(false);
    
    setIsAnalyzing(true);
    const endTime = new Date();
    const duration = conversationStartTime 
      ? Math.floor((endTime.getTime() - conversationStartTime.getTime()) / 1000)
      : 0;

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save conversation and analyze
      console.log('[Practice] Saving conversation to Supabase...');
      const saveResponse = await fetch('/api/conversations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Taco Ordering Practice',
          persona: 'TAQUERO',
          transcript: transcripts,
          duration
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save conversation');
      }

      const { conversation } = await saveResponse.json();
      console.log('[Practice] Conversation saved with ID:', conversation.id);

      // Analyze conversation
      const analysisService = new ConversationAnalysisService();
      const analysis = await analysisService.analyzeConversation(
        transcripts,
        'beginner',
        ['order_food', 'ask_price', 'polite_interaction']
      );
      
      // Update conversation with analysis
      await fetch('/api/conversations/update-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          analysis
        })
      });

      // Update user progress
      const vocabulary = analysisService.extractVocabulary(transcripts);
      console.log('[Practice] Updating user progress...');
      const progressResponse = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vocabulary,
          minutesPracticed: Math.ceil(duration / 60),
          pronunciationImprovement: analysis.quality_assessment.engagement > 0.7 ? 2 : 1,
          grammarImprovement: analysis.mistakes.length < 3 ? 2 : 1,
          fluencyImprovement: analysis.conversation_metrics.wordsPerMinute > 60 ? 2 : 1,
          culturalImprovement: analysis.cultural_notes.length > 0 ? 2 : 1
        })
      });

      if (!progressResponse.ok) {
        throw new Error(`Failed to save progress: ${progressResponse.status}`);
      }

      // Show session feedback
      const userResponses = transcripts.filter(t => t.speaker === 'user').length;
      const stats = conversationEngine.sessionStats;
      const successRate = stats.totalResponses > 0 ? Math.round((stats.goodResponses / stats.totalResponses) * 100) : 0;
      const confidenceScore = Math.round(stats.averageConfidence * 100);
      
      const sessionFeedback = `🎉 Great practice session!\n\n` +
        `📊 Your Performance:\n` +
        `• ${userResponses} conversation exchanges\n` +
        `• ${successRate}% success rate\n` +
        `• ${confidenceScore}% average confidence\n` +
        `• ${learnerProfile.masteredPhrases.length} words mastered\n` +
        `• ${Math.ceil(duration / 60)} minutes practiced\n\n` +
        `${stats.improvementTrend === 'improving' ? '📈 You\'re improving during the session!' :
          stats.improvementTrend === 'declining' ? '💪 Keep practicing - you\'re learning!' :
          '🎯 Consistent performance throughout!'}\n\n` +
        `📝 Full analysis saved to your progress!`;
      
      alert(sessionFeedback);
      
    } catch (error) {
      console.error('Failed to save conversation:', error);
      alert('Session completed but analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRestart = () => {
    setTranscripts([]);
    setConversationStartTime(null);
    conversationEngine.resetSession();
    adaptationSystem.resetAdaptation();
    startFreshSession();
  };

  const handleExtendSession = () => {
    extendSession();
    dismissWarning();
  };
  
  const handleDismissWarning = () => {
    dismissWarning();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Get current state from hooks
  const { sessionStats, lastComprehensionFeedback } = conversationEngine;
  const { showAdaptationNotification, getAdaptationProgress } = adaptationSystem;
  const adaptationProgress = getAdaptationProgress();

  return (
    <div className="min-h-screen">
      <AuthHeader />
      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold">Practice with Taquero</h1>
            <p className="text-gray-600 mt-2">Order tacos from a friendly Mexican street vendor</p>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Conversation Display */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>
                  Practice ordering tacos from a friendly street vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConversationUI 
                  transcripts={transcripts}
                  isProcessing={isProcessing}
                  currentSpeaker={currentSpeaker as 'user' | 'assistant' | null}
                />
                
                {/* Live Conversation Quality Indicator */}
                {isConnected && (
                  <SessionStatsDisplay sessionStats={sessionStats} />
                )}
                
                {/* Cost Display */}
                {costs && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Session Cost:</span>
                      <span className="font-mono font-semibold text-green-600">
                        ${costs.totalCost.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                      <span>You: {costs.audioInputSeconds.toFixed(1)}s</span>
                      <span>AI: {costs.audioOutputSeconds.toFixed(1)}s</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button 
                    onClick={handleRestart}
                    variant="outline"
                    className="flex-1"
                    disabled={transcripts.length === 0 || isAnalyzing}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start Over
                  </Button>
                  <Button 
                    onClick={handleEndConversation}
                    className="flex-1"
                    disabled={transcripts.length === 0 || isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'End & Analyze'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Voice Control */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Control</CardTitle>
                <CardDescription>
                  {isConnected ? 'Speak naturally in Spanish' : 'Click Connect to start practicing'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Hidden audio element for voice playback */}
                <audio ref={audioRef} autoPlay hidden />
                
                {/* Real-time Progress Feedback */}
                <ProgressFeedback 
                  lastComprehensionFeedback={lastComprehensionFeedback}
                  showAdaptationNotification={showAdaptationNotification}
                />

                <VoiceControl
                  isConnected={isConnected}
                  currentSpeaker={currentSpeaker as 'user' | 'assistant' | null}
                  learnerProfile={learnerProfile}
                  onConnect={handleConnect}
                  hasManuallyConnected={hasManuallyConnected}
                  adaptationProgress={adaptationProgress}
                >
                  <SessionStatsDisplay sessionStats={sessionStats} compact />
                </VoiceControl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Time Warning Modal */}
      {showTimeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Time Warning</h3>
            <p className="text-gray-600 mb-4">
              You have {timeWarningMinutes} {timeWarningMinutes === 1 ? 'minute' : 'minutes'} remaining in this session.
            </p>
            <div className="text-sm text-gray-600 mb-4">
              Current session cost: ${costs?.totalCost.toFixed(4) || '0.0000'}
            </div>
            <Button onClick={handleDismissWarning} className="w-full">Got it</Button>
          </div>
        </div>
      )}

      {/* Session Complete Modal */}
      {showSessionComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Session Complete</h3>
            <p className="text-gray-600 mb-4">
              Your 10-minute session has ended. You can extend for another 10 minutes (up to 2 times).
            </p>
            <div className="text-sm mb-4">
              <div className="font-semibold">Total cost: ${costs?.totalCost.toFixed(4) || '0.0000'}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSessionContinue(false)} className="flex-1">
                End Session
              </Button>
              <Button onClick={() => handleSessionContinue(true)} className="flex-1">
                Continue (10 more minutes)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Max Sessions Modal */}
      {showMaxSessions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Maximum Session Time Reached</h3>
            <p className="text-gray-600 mb-4">
              You've reached the maximum session time of 30 minutes. Please start a new session if you'd like to continue practicing.
            </p>
            <div className="text-sm mb-4">
              <div className="font-semibold">Final session cost: ${costs?.totalCost.toFixed(4) || '0.0000'}</div>
            </div>
            <Button onClick={() => {
              disconnect();
              router.push('/dashboard');
            }} className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}