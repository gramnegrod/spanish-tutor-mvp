'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationUI } from '@/components/audio/ConversationUI'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { ArrowLeft, RefreshCw, Mic, Loader2 } from 'lucide-react'
import { ConversationTranscript } from '@/types'
import { generateAdaptivePrompt, LearnerProfile } from '@/lib/pedagogical-system'
import { UnifiedStorageService } from '@/lib/unified-storage'
import { GuestModeHeader } from '@/components/layout/GuestModeHeader'
import { useConversationEngine } from '@/hooks/useConversationEngine'
import { usePracticeAdaptation } from '@/hooks/usePracticeAdaptation'
import { ProgressFeedback } from '@/components/practice/ProgressFeedback'
import { VoiceControl } from '@/components/practice/VoiceControl'

// Guest Progress Component
function GuestProgressCard() {
  const [progress, setProgress] = useState({ totalMinutes: 0, conversationsCompleted: 0, vocabulary: [] });
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  useEffect(() => {
    const loadProgress = () => {
      const storageInfo = UnifiedStorageService.getStorageInfo();
      if (storageInfo.type === 'guest' && 'totalSize' in storageInfo) {
        setProgress({
          totalMinutes: Math.floor(storageInfo.totalSize / 100), // Rough estimate
          conversationsCompleted: storageInfo.conversationCount,
          vocabulary: []
        });
        setShowSignupPrompt(UnifiedStorageService.shouldPromptSignup());
      }
    };
    
    loadProgress();
    const interval = setInterval(loadProgress, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
        <CardDescription>Guest mode - progress saved locally</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{progress.conversationsCompleted}</div>
              <div className="text-sm text-gray-600">Conversations</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{progress.totalMinutes}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
          </div>
          
          {showSignupPrompt && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-semibold text-purple-800 mb-2">Save Your Progress!</h4>
              <p className="text-sm text-purple-700 mb-3">
                You're making great progress! Sign up to save your learning data permanently and access advanced features.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/register'}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Sign Up Free
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSignupPrompt(false)}
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 text-center">
            Progress is saved locally. Sign up to sync across devices!
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to extract Spanish words from text (moved from original)
function extractSpanishWords(text: string): string[] {
  const commonSpanishWords = [
    // Basic greetings and courtesy
    'hola', 'gracias', 'por favor', 'buenos', 'días', 'tardes', 'noches', 
    'adiós', 'hasta', 'luego', 'disculpe', 'perdón', 'con permiso',
    
    // Mexican cultural expressions
    'órale', 'ándale', 'güero', 'güera', 'joven', 'amigo', 'amiga',
    'mero', 'padrísimo', 'chido', 'sale', 'simón', 'nel', 'mande',
    
    // Food vocabulary (Mexican specific)
    'tacos', 'pastor', 'carnitas', 'suadero', 'bistec', 'quesadilla', 
    'tortilla', 'piña', 'cebolla', 'cilantro', 'salsa', 'verde', 'roja',
    'picante', 'limón', 'aguacate', 'frijoles', 'guacamole', 'chicharrón',
    
    // Ordering and transactions
    'quiero', 'me da', 'quisiera', 'deme', 'póngame', 'cuánto', 'cuesta',
    'cuántos', 'pesos', 'dinero', 'cambio', 'aquí', 'está', 'todo', 
    'nada', 'más', 'menos', 'con todo', 'sin', 'para llevar', 'para aquí',
    
    // Descriptions and reactions
    'muy', 'bien', 'rico', 'delicioso', 'sabroso', 'bueno', 'excelente',
    'perfecto', 'está', 'están', 'hay', 'tiene', 'quiere', 'puede',
    
    // Mexican diminutives
    'taquitos', 'salsita', 'limoncito', 'poquito', 'ahorita', 'cerquita'
  ];
  
  const mexicanPhrases = [
    'por favor', 'me da', 'con todo', 'para llevar', 'para aquí',
    'está bien', 'muy rico', 'qué rico', 'cuánto cuesta', 'cuánto es',
    'aquí tiene', 'con permiso', 'buenas tardes', 'hasta luego'
  ];
  
  const lowerText = text.toLowerCase();
  const detectedWords: string[] = [];
  
  // Check for phrases first
  mexicanPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      detectedWords.push(phrase);
    }
  });
  
  // Then check individual words
  const words = lowerText
    .replace(/[¿¡.,!?]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  words.forEach(word => {
    if (commonSpanishWords.includes(word) && !detectedWords.includes(word)) {
      detectedWords.push(word);
    }
  });
  
  return detectedWords;
}

export default function PracticeNoAuthPage() {
  const router = useRouter()
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null)
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Track learner profile - use LearnerProfile interface
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
  
  // Save profile to guest storage
  const saveProfileToStorage = async (profile: LearnerProfile) => {
    await UnifiedStorageService.saveLearnerProfile(profile);
    console.log('[Practice-NoAuth] Saved profile to guest storage');
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

  // Initialize conversation engine first (no dependencies)
  const conversationEngine = useConversationEngine({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    onSaveProfile: saveProfileToStorage
  });

  // Create refs for stable access
  const conversationEngineRef = useRef(conversationEngine);
  const adaptationSystemRef = useRef<any>(null);

  // Create stable callback for transcript handling
  const handleTranscript = useCallback(async (role: string, text: string) => {
    console.log('[PracticeNoAuth] onTranscript fired:', { role, text: text.substring(0, 50) + '...' });
    
    // Process transcript through conversation engine
    const { displayText, updatedProfile } = await conversationEngineRef.current.processTranscript(role as 'user' | 'assistant', text);
    
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
    if (role === 'user' && text && text.trim().length > 0) {
      // Import detectComprehension for adaptation processing
      const { detectComprehension } = await import('@/lib/pedagogical-system');
      const { understood, confidence } = detectComprehension(text);
      
      if (adaptationSystemRef.current) {
        await adaptationSystemRef.current.processPerformance(understood, confidence);
      }
    }
  }, []);

  // Initialize OpenAI Realtime with stable callback
  const {
    isConnected,
    isConnecting,
    error,
    costs,
    connect,
    disconnect,
    audioRef,
    updateInstructions
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

  // Initialize adaptation system after updateInstructions is available
  const adaptationSystem = usePracticeAdaptation({
    learnerProfile,
    onProfileUpdate: setLearnerProfile,
    onInstructionsUpdate: updateInstructions,
    onSaveProfile: saveProfileToStorage,
    generateInstructions
  });

  // Update refs when hooks change
  useEffect(() => {
    conversationEngineRef.current = conversationEngine;
    adaptationSystemRef.current = adaptationSystem;
  }, [conversationEngine, adaptationSystem]);

  // Load guest learner profile on mount
  useEffect(() => {
    const loadGuestProfile = async () => {
      const savedProfile = await UnifiedStorageService.getLearnerProfile();
      if (savedProfile) {
        console.log('[Practice-NoAuth] Loaded guest profile:', savedProfile);
        setLearnerProfile(savedProfile);
      }
    };
    
    loadGuestProfile();
  }, []);

  // Store disconnect ref and cleanup on unmount
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);
  
  useEffect(() => {
    return () => {
      console.log('[Practice-NoAuth] Component unmounting, disconnecting...');
      if (disconnectRef.current) {
        disconnectRef.current();
      }
    };
  }, []);

  // Debug connection status and errors
  useEffect(() => {
    console.log('[PracticeNoAuth] Connection status:', { isConnected, isConnecting, error });
    if (error) {
      console.error('[PracticeNoAuth] Connection error:', error);
    }
  }, [isConnected, isConnecting, error]);

  // Start conversation timer when first transcript appears
  useEffect(() => {
    if (transcripts.length > 0 && !conversationStartTime) {
      setConversationStartTime(new Date());
    }
  }, [transcripts, conversationStartTime]);

  const handleRestart = () => {
    setTranscripts([]);
    setConversationStartTime(null);
    conversationEngine.resetSession();
    adaptationSystem.resetAdaptation();
    disconnect();
    setTimeout(() => connect(), 500);
  };
  
  const handleEndSession = async () => {
    console.log('[Practice-NoAuth] Ending session...');
    setIsProcessing(true);
    
    try {
      // Disconnect first
      disconnect();
      
      // Save conversation if we have transcripts
      if (transcripts.length > 0 && conversationStartTime) {
        const duration = Math.floor((Date.now() - conversationStartTime.getTime()) / 1000);
        
        console.log('[Practice-NoAuth] Saving conversation to guest storage...');
        await UnifiedStorageService.saveConversation({
          title: `Taco Practice - ${new Date().toLocaleTimeString()}`,
          persona: 'Taquero',
          transcript: transcripts,
          duration: duration
        });
        
        // Update progress
        const minutes = Math.ceil(duration / 60);
        const vocabulary = extractSpanishWords(
          transcripts.filter(t => t.speaker === 'assistant').map(t => t.text).join(' ')
        );
        
        await UnifiedStorageService.updateProgress({
          minutes_practiced: minutes,
          conversations_completed: 1,
          vocabulary: vocabulary
        });
        
        console.log('[Practice-NoAuth] Session saved successfully:', {
          duration: `${minutes} minutes`,
          transcripts: transcripts.length,
          vocabulary: vocabulary.length
        });
        
        // Show detailed session feedback using hook data
        const userResponses = transcripts.filter(t => t.speaker === 'user').length;
        const stats = conversationEngine.sessionStats;
        const successRate = stats.totalResponses > 0 ? Math.round((stats.goodResponses / stats.totalResponses) * 100) : 0;
        const confidenceScore = Math.round(stats.averageConfidence * 100);
        
        const sessionFeedback = `🎉 Great practice session!\n\n` +
          `📊 Your Performance:\n` +
          `• ${userResponses} conversation exchanges\n` +
          `• ${successRate}% success rate\n` +
          `• ${confidenceScore}% average confidence\n` +
          `• ${learnerProfile.masteredPhrases.length} new words learned\n` +
          `• ${minutes} minutes practiced\n\n` +
          `${stats.improvementTrend === 'improving' ? '📈 You\'re improving during the session!' :
            stats.improvementTrend === 'declining' ? '💪 Keep practicing - you\'re learning!' :
            '🎯 Consistent performance throughout!'}`;
        
        alert(sessionFeedback);
      }
    } catch (error) {
      console.error('[Practice-NoAuth] Error saving session:', error);
    } finally {
      // Reset state
      setTranscripts([]);
      setConversationStartTime(null);
      conversationEngine.resetSession();
      adaptationSystem.resetAdaptation();
      setIsProcessing(false);
    }
  };

  // Get current state from hooks
  const { sessionStats, lastComprehensionFeedback } = conversationEngine;
  const { showAdaptationNotification, getAdaptationProgress } = adaptationSystem;
  const adaptationProgress = getAdaptationProgress();

  return (
    <div className="min-h-screen">
      <GuestModeHeader />
      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">Practice with Taquero</h1>
            <p className="text-gray-600 mt-1">Free practice mode - your progress is saved locally</p>
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
                    disabled={transcripts.length === 0}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start Over
                  </Button>
                  <Button 
                    onClick={handleEndSession}
                    className="flex-1"
                    disabled={transcripts.length === 0}
                  >
                    End Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Guest Progress & Signup Prompt */}
            <GuestProgressCard />

            {/* Voice Control */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Control</CardTitle>
                <CardDescription>
                  {error ? (
                    <span className="text-red-600">Error: {error instanceof Error ? error.message : String(error)}</span>
                  ) : isConnected ? (
                    'Speak naturally in Spanish'
                  ) : isConnecting ? (
                    'Connecting...'
                  ) : (
                    'Not connected'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Hidden audio element for voice playback */}
                <audio ref={audioRef} autoPlay hidden />
                
                {/* Progress Feedback Component */}
                <ProgressFeedback 
                  lastComprehensionFeedback={lastComprehensionFeedback}
                  showAdaptationNotification={showAdaptationNotification}
                />

                <VoiceControl
                  isConnected={isConnected}
                  isConnecting={isConnecting}
                  currentSpeaker={currentSpeaker as 'user' | 'assistant' | null}
                  learnerProfile={learnerProfile}
                  onConnect={connect}
                  adaptationProgress={adaptationProgress}
                >
                  {/* Live Session Progress */}
                  {sessionStats.totalResponses > 0 && (
                    <div className="mb-3 p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium mb-2">📊 Live Session Stats</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{sessionStats.totalResponses}</div>
                          <div className="text-gray-600">Exchanges</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">
                            {sessionStats.totalResponses > 0 ? Math.round((sessionStats.goodResponses / sessionStats.totalResponses) * 100) : 0}%
                          </div>
                          <div className="text-gray-600">Success</div>
                        </div>
                      </div>
                      {sessionStats.streakCount > 2 && (
                        <div className="text-xs text-green-600 mt-1 font-medium text-center">
                          🔥 {sessionStats.streakCount} streak!
                        </div>
                      )}
                      {sessionStats.improvementTrend !== 'neutral' && (
                        <div className={`text-xs mt-1 font-medium text-center ${
                          sessionStats.improvementTrend === 'improving' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {sessionStats.improvementTrend === 'improving' ? '📈 Improving!' : '💪 Keep practicing!'}
                        </div>
                      )}
                    </div>
                  )}
                </VoiceControl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}