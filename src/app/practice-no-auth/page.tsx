'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationUI } from '@/components/audio/ConversationUI'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { ArrowLeft, RefreshCw, Mic, Loader2 } from 'lucide-react'
import { ConversationTranscript } from '@/types'
import { detectComprehension, generateAdaptivePrompt, PEDAGOGICAL_SITUATIONS, extractHiddenAnalysis, updateProfileFromAnalysis, LearnerProfile } from '@/lib/pedagogical-system'
import { UnifiedStorageService } from '@/lib/unified-storage'
import { GuestModeHeader } from '@/components/layout/GuestModeHeader'

// Guest Progress Component
function GuestProgressCard() {
  const [progress, setProgress] = useState({ totalMinutes: 0, conversationsCompleted: 0, vocabulary: [] });
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  useEffect(() => {
    const loadProgress = () => {
      const guestProgress = UnifiedStorageService.getStorageInfo();
      if (guestProgress.type === 'guest') {
        setProgress({
          totalMinutes: Math.floor(guestProgress.totalSize / 100), // Rough estimate
          conversationsCompleted: guestProgress.conversationCount,
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

// Helper function to extract Spanish words from text
function extractSpanishWords(text: string): string[] {
  // Extract Spanish words from user input
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
  
  // Handle phrases (not just single words)
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
  
  // Smart adaptation state - use consecutive tracking instead of time cooldown
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const REQUIRED_CONFIRMATIONS = 2; // Need 2 consecutive confirmations to switch modes
  
  // Load guest learner profile on mount
  useEffect(() => {
    const loadGuestProfile = async () => {
      const savedProfile = await UnifiedStorageService.getLearnerProfile();
      if (savedProfile) {
        console.log('[Practice-NoAuth] Loaded guest profile:', savedProfile);
        setLearnerProfile(savedProfile);
        updateAIInstructions(savedProfile);
      }
    };
    
    loadGuestProfile();
  }, []);
  
  // Save profile changes to guest storage
  const saveProfileToStorage = async (profile: LearnerProfile) => {
    await UnifiedStorageService.saveLearnerProfile(profile);
    console.log('[Practice-NoAuth] Saved profile to guest storage');
  };

  // Function to update AI instructions based on learner profile
  const updateAIInstructions = (profile: LearnerProfile) => {
    const adaptivePrompt = generateAdaptivePrompt(
      'friendly Mexican taco vendor (taquero) Don Roberto in Mexico City at a busy street stand',
      currentScenario,
      profile
    );
    
    console.log('🔄 ADAPTIVE LEARNING UPDATE:', {
      needsMoreEnglish: profile.needsMoreEnglish,
      level: profile.level,
      masteredPhrases: profile.masteredPhrases.length,
      strugglingWords: profile.strugglingWords.length,
      mode: profile.needsMoreEnglish ? 'BILINGUAL HELPER' : 'SPANISH FOCUS',
      promptLength: adaptivePrompt.length
    });
    
    console.log('📝 GENERATED PROMPT:', adaptivePrompt);
    
    if (updateInstructions) {
      console.log('✅ SENDING TO OPENAI:', 'Instructions update triggered');
      updateInstructions(adaptivePrompt);
    } else {
      console.error('❌ FAILED TO UPDATE:', 'updateInstructions function not available');
    }
  };

  // Store ref to disconnect function to use in cleanup
  const disconnectRef = useRef<(() => void) | null>(null);

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
    // Enable input transcription - Whisper's struggles with poor pronunciation
    // actually help our adaptive learning detect when users need help!
    enableInputTranscription: true,
    instructions: `You are a friendly Mexican taco vendor (taquero) in Mexico City at a busy street stand.

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

LANGUAGE APPROACH:
- Start in simple, friendly Mexican Spanish
- If customer seems confused, IMMEDIATELY switch to Spanglish
- Example: "¿Qué le doy, joven?... Ah, you don't understand? No problem! What can I get you? Tengo tacos de pastor, carnitas..."
- When teaching, say things like: "Mira, 'al pastor' is like... es pork pero with pineapple, ¿me entiendes?"

TEACHING STYLE:
- Never give grammar lessons
- Correct by example: If they say "Yo querer tacos" you say "Ah, ¿quieres tacos? ¡Claro que sí!"
- Celebrate attempts: "¡Órale! ¡Muy bien!" "¡Eso, así se dice!"
- Share culture: "You know, aquí en México we eat tacos for breakfast too!"

MENU & PRICES:
- Al pastor (con piña): 15 pesos
- Carnitas: 12 pesos  
- Suadero: 12 pesos
- Bistec: 15 pesos
- Quesadillas: 20 pesos

REMEMBER: You're not a language teacher, you're a taco vendor who happens to help tourists learn Spanish naturally.`,
    voice: 'alloy',
    autoConnect: false,
    turnDetection: {
      type: 'server_vad',
      threshold: 0.7,
      prefixPaddingMs: 500,
      silenceDurationMs: 800
    },
    onTranscript: (role, text) => {
      console.log('[PracticeNoAuth] onTranscript fired:', { role, text });
      let displayText = text;
      
      // Process assistant responses for hidden analysis
      if (role === 'assistant') {
        const { cleanText, analysis } = extractHiddenAnalysis(text);
        displayText = cleanText;
        
        if (analysis) {
          console.log('[Practice] Hidden analysis extracted:', analysis);
          
          // Update learner profile with analysis
          const updatedProfile = updateProfileFromAnalysis(learnerProfile, analysis);
          setLearnerProfile(updatedProfile);
          saveProfileToStorage(updatedProfile);
          
          // Log for debugging
          console.log('[Practice] Profile updated from analysis:', {
            pronunciation: updatedProfile.pronunciation,
            fluency: updatedProfile.fluency,
            confidence: updatedProfile.averageConfidence,
            level: updatedProfile.level
          });
        }
      }
      
      setTranscripts(prev => [...prev, {
        id: crypto.randomUUID(),
        speaker: role as 'user' | 'assistant',
        text: displayText, // Use cleaned text without analysis
        timestamp: new Date()
      }]);
      setCurrentSpeaker(role);
      setTimeout(() => setCurrentSpeaker(null), 1000);
      
      // Analyze comprehension if user spoke
      if (role === 'user') {
        // Add empty transcript validation
        if (!text || text.trim().length === 0) {
          console.log('[Practice-NoAuth] Empty user transcript, skipping analysis');
          return;
        }
        
        const { understood, confidence, indicators } = detectComprehension(text);
        console.log('[Practice] Comprehension analysis:', { understood, confidence, indicators, text });
        
        // Track vocabulary usage and errors
        const spanishWords = extractSpanishWords(text);
        const newMasteredPhrases = [...learnerProfile.masteredPhrases];
        const newStrugglingWords = [...learnerProfile.strugglingWords];
        
        // Add new Spanish words as mastered if used correctly
        if (understood && spanishWords.length > 0) {
          spanishWords.forEach(word => {
            if (!newMasteredPhrases.includes(word)) {
              newMasteredPhrases.push(word);
            }
          });
        }
        
        // Track confusion indicators as struggling words
        if (!understood && indicators.length > 0) {
          indicators.forEach(indicator => {
            if (!newStrugglingWords.includes(indicator)) {
              newStrugglingWords.push(indicator);
            }
          });
        }
        
        // Smart adaptation using consecutive tracking instead of time cooldown
        if (!understood && confidence < 0.3) {
          // User struggling - increment failure count, reset success count
          const newFailures = consecutiveFailures + 1;
          setConsecutiveFailures(newFailures);
          setConsecutiveSuccesses(0);
          
          // Switch to helper mode after consecutive failures
          if (newFailures >= REQUIRED_CONFIRMATIONS && !learnerProfile.needsMoreEnglish) {
            console.log('🚨 USER STRUGGLING - Switching to Bilingual Helper mode', {
              consecutiveFailures: newFailures,
              confidence,
              indicators
            });
            
            const newProfile = { 
              ...learnerProfile, 
              needsMoreEnglish: true,
              strugglingWords: newStrugglingWords,
              masteredPhrases: newMasteredPhrases
            };
            setLearnerProfile(newProfile);
            saveProfileToStorage(newProfile);
            updateAIInstructions(newProfile);
            
            // Reset counters after mode switch
            setConsecutiveFailures(0);
          } else if (learnerProfile.needsMoreEnglish) {
            console.log('⚠️ STILL STRUGGLING - Staying in Bilingual Helper mode', {
              consecutiveFailures: newFailures,
              confidence
            });
          } else {
            console.log('⚠️ STRUGGLING BUT NEED MORE CONFIRMATION', {
              consecutiveFailures: newFailures,
              requiredConfirmations: REQUIRED_CONFIRMATIONS,
              confidence
            });
          }
        } else if (understood && confidence > 0.7) {
          // User succeeding - increment success count, reset failure count
          const newSuccesses = consecutiveSuccesses + 1;
          setConsecutiveSuccesses(newSuccesses);
          setConsecutiveFailures(0);
          
          // Switch to Spanish focus after consecutive successes
          if (newSuccesses >= REQUIRED_CONFIRMATIONS && learnerProfile.needsMoreEnglish) {
            console.log('🎉 USER SUCCEEDING - Switching to Spanish Focus mode', {
              consecutiveSuccesses: newSuccesses,
              confidence,
              spanishWords
            });
            
            const newProfile = { 
              ...learnerProfile, 
              needsMoreEnglish: false,
              strugglingWords: newStrugglingWords,
              masteredPhrases: newMasteredPhrases
            };
            setLearnerProfile(newProfile);
            saveProfileToStorage(newProfile);
            updateAIInstructions(newProfile);
            
            // Reset counters after mode switch
            setConsecutiveSuccesses(0);
          } else if (!learnerProfile.needsMoreEnglish) {
            console.log('✅ STILL SUCCEEDING - Staying in Spanish Focus mode', {
              consecutiveSuccesses: newSuccesses,
              confidence
            });
          } else {
            console.log('✅ SUCCEEDING BUT NEED MORE CONFIRMATION', {
              consecutiveSuccesses: newSuccesses,
              requiredConfirmations: REQUIRED_CONFIRMATIONS,
              confidence
            });
          }
        } else {
          // Neutral performance - don't change counters, just log
          console.log('➖ NEUTRAL PERFORMANCE - No adaptation triggered', {
            understood,
            confidence,
            consecutiveSuccesses,
            consecutiveFailures,
            currentMode: learnerProfile.needsMoreEnglish ? 'Bilingual Helper' : 'Spanish Focus'
          });
        }
      }
    }
  })

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

  // Don't auto-connect - let user start when ready
  // This prevents confusion after ending a session

  // Debug connection status and errors
  useEffect(() => {
    console.log('[PracticeNoAuth] Connection status:', { isConnected, isConnecting, error });
    if (error) {
      console.error('[PracticeNoAuth] Connection error:', error);
    }
  }, [isConnected, isConnecting, error]);
  
  // Debug connection status
  useEffect(() => {
    console.log('[PracticeNoAuth] Connection status changed:', { isConnected });
  }, [isConnected]);

  // Start conversation timer when first transcript appears
  useEffect(() => {
    if (transcripts.length > 0 && !conversationStartTime) {
      setConversationStartTime(new Date())
    }
  }, [transcripts, conversationStartTime])

  const handleRestart = () => {
    setTranscripts([])
    setConversationStartTime(null)
    disconnect()
    setTimeout(() => connect(), 500)
  }
  
  const handleEndSession = async () => {
    console.log('[Practice-NoAuth] Ending session...');
    setIsProcessing(true);
    
    try {
      // Disconnect first
      disconnect();
      
      // Save conversation if we have transcripts
      if (transcripts.length > 0 && conversationStartTime) {
        // Debug: Log transcript info
        console.log('[Practice-NoAuth] Session summary:', {
          totalTranscripts: transcripts.length,
          userTranscripts: transcripts.filter(t => t.speaker === 'user').length,
          assistantTranscripts: transcripts.filter(t => t.speaker === 'assistant').length,
          adaptationsMade: lastAdaptationTime > 0,
          finalMode: learnerProfile.needsMoreEnglish ? 'Bilingual Helper' : 'Spanish Focus'
        });
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
    }
    } catch (error) {
      console.error('[Practice-NoAuth] Error saving session:', error);
    } finally {
      // Reset state
      setTranscripts([]);
      setConversationStartTime(null);
      
      // Also reset the learner profile for a fresh session
      setLearnerProfile({
        level: 'beginner',
        comfortWithSlang: false,
        needsMoreEnglish: true,
        strugglingWords: [],
        masteredPhrases: []
      });
      setConsecutiveSuccesses(0); // Reset adaptation counters
      setConsecutiveFailures(0);
      setIsProcessing(false);
    }
  }

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
                  <span className="text-red-600">Error: {error.message || error}</span>
                ) : isConnected ? (
                  'Speak naturally in Spanish'
                ) : isConnecting ? (
                  'Connecting...'
                ) : (
                  'Not connected'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {/* Hidden audio element for voice playback */}
              <audio ref={audioRef} autoPlay hidden />
              
              {/* Connection Status */}
              <div className="text-center">
                {isConnected ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <Mic className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">Connected - Speak anytime</p>
                  </div>
                ) : isConnecting ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-sm text-gray-600">Connecting to tutor...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Mic className="h-10 w-10 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Not connected</p>
                    <Button onClick={connect} size="sm">
                      Start New Session
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Tips */}
              <div className="text-sm text-gray-600 space-y-2 text-center">
                <p className="font-semibold">Conversation starters:</p>
                <ul className="space-y-1">
                  <li>"Hola, ¿qué tal?"</li>
                  <li>"Quiero tacos, por favor"</li>
                  <li>"¿De qué son?"</li>
                  <li>"¿Cuánto cuesta?"</li>
                </ul>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="font-semibold text-xs mb-2">Today's Menu:</p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>🐷 Al Pastor (pork + 🍍)</span>
                      <span>$15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥩 Carnitas (crispy pork)</span>
                      <span>$12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥩 Suadero (beef)</span>
                      <span>$12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🧀 Quesadilla</span>
                      <span>$20</span>
                    </div>
                  </div>
                </div>
                
                {/* Adaptive Learning Section */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="font-semibold text-xs mb-2">🧠 Adaptive Learning:</p>
                  <div className="text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span>Comprehension:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${learnerProfile.needsMoreEnglish ? 'bg-orange-500' : 'bg-green-500'}`}
                          style={{ width: `${learnerProfile.needsMoreEnglish ? '30%' : '70%'}` }}
                        />
                      </div>
                      <span className={`text-xs ${learnerProfile.needsMoreEnglish ? 'text-orange-600' : 'text-green-600'}`}>
                        {learnerProfile.needsMoreEnglish ? 'Needs help' : 'Doing well'}
                      </span>
                    </div>
                    
                    <div className="text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span>✅ Mastered:</span>
                        <span className="text-green-600">{learnerProfile.masteredPhrases.length} words</span>
                      </div>
                      {learnerProfile.masteredPhrases.length > 0 && (
                        <div className="text-green-600 truncate">
                          {learnerProfile.masteredPhrases.slice(-3).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    {learnerProfile.strugglingWords.length > 0 && (
                      <div className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span>⚠️ Struggling:</span>
                          <span className="text-orange-600">{learnerProfile.strugglingWords.length} items</span>
                        </div>
                        <div className="text-orange-600 truncate">
                          {learnerProfile.strugglingWords.slice(-3).join(', ')}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs pt-1 border-t border-gray-300">
                      <div className="flex items-center gap-2">
                        <span>🤖 AI Mode:</span>
                        <span className={`font-medium px-2 py-1 rounded text-white ${learnerProfile.needsMoreEnglish ? 'bg-blue-600' : 'bg-purple-600'}`}>
                          {learnerProfile.needsMoreEnglish ? 'BILINGUAL HELPER' : 'SPANISH FOCUS'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {learnerProfile.needsMoreEnglish 
                          ? 'Using 70% English, 30% Spanish - Lots of help and translations'
                          : 'Using 10% English, 90% Spanish - Advanced immersion mode'
                        }
                      </div>
                    </div>
                    
                    {/* Hidden Analysis Results */}
                    {(learnerProfile.pronunciation || learnerProfile.fluency) && (
                      <div className="text-xs pt-1 border-t border-gray-300 space-y-1">
                        {learnerProfile.pronunciation && (
                          <div className="flex items-center gap-2">
                            <span>🗣️ Pronunciation:</span>
                            <span className={`font-medium ${
                              learnerProfile.pronunciation === 'excellent' ? 'text-green-600' :
                              learnerProfile.pronunciation === 'good' ? 'text-blue-600' :
                              learnerProfile.pronunciation === 'fair' ? 'text-yellow-600' :
                              'text-orange-600'
                            }`}>
                              {learnerProfile.pronunciation}
                            </span>
                          </div>
                        )}
                        {learnerProfile.fluency && (
                          <div className="flex items-center gap-2">
                            <span>💬 Fluency:</span>
                            <span className={`font-medium ${
                              learnerProfile.fluency === 'fluent' ? 'text-green-600' :
                              learnerProfile.fluency === 'conversational' ? 'text-blue-600' :
                              learnerProfile.fluency === 'developing' ? 'text-yellow-600' :
                              'text-orange-600'
                            }`}>
                              {learnerProfile.fluency}
                            </span>
                          </div>
                        )}
                        {learnerProfile.averageConfidence !== undefined && (
                          <div className="flex items-center gap-2">
                            <span>📊 Confidence:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                              <div 
                                className="h-1.5 rounded-full bg-blue-500 transition-all"
                                style={{ width: `${learnerProfile.averageConfidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {Math.round(learnerProfile.averageConfidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  )
}