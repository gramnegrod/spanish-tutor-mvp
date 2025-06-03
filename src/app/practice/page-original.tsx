'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ConversationUI } from '@/components/audio/ConversationUI'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'
import { ArrowLeft, RefreshCw, Mic, Loader2 } from 'lucide-react'
import { detectComprehension, generateAdaptivePrompt, PEDAGOGICAL_SITUATIONS, extractHiddenAnalysis, updateProfileFromAnalysis, LearnerProfile } from '@/lib/pedagogical-system'
import { ConversationTranscript } from '@/types'
// Remove direct database imports - use API routes instead
import { ConversationAnalysisService } from '@/services/conversation-analysis'

export default function PracticePage() {
  console.log('[Practice] Component rendering...');
  const router = useRouter()
  const { user, loading } = useAuth()
  console.log('[Practice] Auth state:', { user: !!user, loading });
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
  const [currentScenario] = useState('taco_ordering'); // Can be dynamic later
  
  // Smart adaptation state - use consecutive tracking instead of time cooldown
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const REQUIRED_CONFIRMATIONS = 2; // Need 2 consecutive confirmations to switch modes
  
  // Real-time feedback state
  const [lastComprehensionFeedback, setLastComprehensionFeedback] = useState<{
    level: 'excellent' | 'good' | 'struggling' | 'confused';
    message: string;
    confidence: number;
    timestamp: Date;
  } | null>(null);
  const [showAdaptationNotification, setShowAdaptationNotification] = useState<{
    type: 'switched_to_helper' | 'switched_to_immersion' | 'building_confidence' | 'need_practice';
    message: string;
  } | null>(null);
  
  // Session progress tracking
  const [sessionStats, setSessionStats] = useState({
    totalResponses: 0,
    goodResponses: 0,
    strugglingResponses: 0,
    averageConfidence: 0,
    improvementTrend: 'neutral' as 'improving' | 'declining' | 'neutral',
    streakCount: 0,
    lastFewConfidences: [] as number[]
  });
  
  // Function to update AI instructions based on learner profile
  // Store ref to disconnect function to use in cleanup
  const disconnectRef = useRef<(() => void) | null>(null);
  
  const updateAIInstructions = (profile: typeof learnerProfile) => {
    console.log('[Practice] updateAIInstructions called with profile:', {
      level: profile.level,
      needsMoreEnglish: profile.needsMoreEnglish,
      strugglingWords: profile.strugglingWords.length,
      masteredPhrases: profile.masteredPhrases.length
    });
    
    const adaptivePrompt = generateAdaptivePrompt(
      'friendly Mexican taco vendor (taquero) Don Roberto in Mexico City at a busy street stand',
      currentScenario,
      profile
    );
    
    // Add the specific menu and personality details
    const fullPrompt = `${adaptivePrompt}

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
    
    if (updateInstructions) {
      console.log('[Practice] Sending updated instructions to OpenAI. Profile state:', {
        needsMoreEnglish: profile.needsMoreEnglish,
        mode: profile.needsMoreEnglish ? 'Bilingual Helper' : 'Spanish Focus'
      });
      updateInstructions(fullPrompt);
      console.log('[Practice] Instructions updated successfully');
    } else {
      console.warn('[Practice] updateInstructions function not available!');
    }
  };

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
    autoConnect: false, // Changed to false to prevent race conditions
    turnDetection: {
      type: 'server_vad',
      threshold: 0.7, // Increased from default 0.5 to reduce false triggers
      prefixPaddingMs: 500, // Increased from 300ms
      silenceDurationMs: 800 // Increased from 200ms to wait longer before responding
    },
    onTranscript: (role, text) => {
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
          
          // Save updated profile to database
          saveUserAdaptations(updatedProfile);
          
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
          console.log('[Practice] Empty user transcript, skipping analysis');
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
        
        // Update session statistics
        const newStats = { ...sessionStats };
        newStats.totalResponses += 1;
        if (confidence > 0.6) {
          newStats.goodResponses += 1;
          newStats.streakCount = (newStats.streakCount || 0) + 1;
        } else {
          newStats.strugglingResponses += 1;
          newStats.streakCount = 0;
        }
        
        // Track last few confidences for trend analysis
        newStats.lastFewConfidences = [...newStats.lastFewConfidences, confidence].slice(-5);
        newStats.averageConfidence = newStats.lastFewConfidences.reduce((a, b) => a + b, 0) / newStats.lastFewConfidences.length;
        
        // Determine improvement trend
        if (newStats.lastFewConfidences.length >= 3) {
          const recent = newStats.lastFewConfidences.slice(-3);
          const earlier = newStats.lastFewConfidences.slice(0, -1);
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
          
          newStats.improvementTrend = recentAvg > earlierAvg + 0.1 ? 'improving' :
                                      recentAvg < earlierAvg - 0.1 ? 'declining' : 'neutral';
        }
        
        setSessionStats(newStats);
        
        // Real-time comprehension feedback
        const feedbackLevel = confidence > 0.8 ? 'excellent' : 
                              confidence > 0.6 ? 'good' : 
                              confidence > 0.3 ? 'struggling' : 'confused';
        
        const feedbackMessage = confidence > 0.8 ? '¡Excelente! Great Spanish usage!' :
                                confidence > 0.6 ? 'Good job! Keep practicing' :
                                confidence > 0.3 ? 'Keep trying - you\'re learning!' :
                                'Don\'t worry, let\'s work on this together';
        
        setLastComprehensionFeedback({
          level: feedbackLevel,
          message: feedbackMessage,
          confidence,
          timestamp: new Date()
        });
        
        // Auto-hide feedback after 3 seconds
        setTimeout(() => setLastComprehensionFeedback(null), 3000);
        
        // Smart adaptation using consecutive tracking instead of time cooldown
        if (!understood && confidence < 0.3) {
          // User struggling - increment failure count, reset success count
          const newFailures = consecutiveFailures + 1;
          setConsecutiveFailures(newFailures);
          setConsecutiveSuccesses(0);
          
          // Show building towards helper mode notification
          if (newFailures === 1 && !learnerProfile.needsMoreEnglish) {
            setShowAdaptationNotification({
              type: 'need_practice',
              message: 'I noticed you might need some help. Let me know if you need more English!'
            });
            setTimeout(() => setShowAdaptationNotification(null), 4000);
          }
          
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
            updateAIInstructions(newProfile);
            saveUserAdaptations(newProfile);
            
            // Show mode switch notification
            setShowAdaptationNotification({
              type: 'switched_to_helper',
              message: '🤝 Switching to Helper Mode! I\'ll use more English to help you learn.'
            });
            setTimeout(() => setShowAdaptationNotification(null), 5000);
            
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
          
          // Show building towards immersion mode notification
          if (newSuccesses === 1 && learnerProfile.needsMoreEnglish) {
            setShowAdaptationNotification({
              type: 'building_confidence',
              message: '¡Muy bien! You\'re doing great! Keep it up for full Spanish immersion!'
            });
            setTimeout(() => setShowAdaptationNotification(null), 4000);
          }
          
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
            updateAIInstructions(newProfile);
            saveUserAdaptations(newProfile);
            
            // Show mode switch notification
            setShowAdaptationNotification({
              type: 'switched_to_immersion',
              message: '🚀 Switching to Immersion Mode! Ready for more Spanish challenge!'
            });
            setTimeout(() => setShowAdaptationNotification(null), 5000);
            
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

  useEffect(() => {
    if (!loading && !user) {
      console.log('[Practice] No user found, redirecting to login...');
      router.push('/login')
    } else if (!loading && user) {
      console.log('[Practice] User found:', user.email);
    }
  }, [user, loading, router])
  
  // Store disconnect ref and cleanup on unmount
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
  }, [])

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
          // Convert database adaptations to learner profile format
          const profile = {
            level: 'beginner' as const, // TODO: Determine level from adaptations
            comfortWithSlang: false, // TODO: Add to database schema
            needsMoreEnglish: adaptations.common_errors.length > 3, // Infer from errors
            strugglingWords: adaptations.common_errors,
            masteredPhrases: adaptations.mastered_concepts
          };
          
          console.log('[Practice] Loaded adaptations:', profile);
          setLearnerProfile(profile);
          
          // Update AI instructions with loaded profile
          updateAIInstructions(profile);
        } else {
          console.log('[Practice] No existing adaptations found, using defaults');
        }
      }
    } catch (error) {
      console.error('[Practice] Failed to load user adaptations:', error);
    }
  };


  const saveUserAdaptations = async (profile: typeof learnerProfile) => {
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

  // Simplified connection state - no auto-connect
  const [hasManuallyConnected, setHasManuallyConnected] = useState(false);
  
  // Manual connect function for button
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
      setConversationStartTime(new Date())
    }
  }, [transcripts, conversationStartTime])

  const handleEndConversation = async () => {
    if (transcripts.length === 0) return

    // Disconnect the voice service first
    disconnect();
    setHasManuallyConnected(false);
    
    setIsAnalyzing(true)
    const endTime = new Date()
    const duration = conversationStartTime 
      ? Math.floor((endTime.getTime() - conversationStartTime.getTime()) / 1000)
      : 0

    // Debug: Log session summary
    console.log('[Practice] Session summary:', {
      totalTranscripts: transcripts.length,
      userTranscripts: transcripts.filter(t => t.speaker === 'user').length,
      assistantTranscripts: transcripts.filter(t => t.speaker === 'assistant').length,
      adaptationsMade: consecutiveSuccesses > 0 || consecutiveFailures > 0,
      finalMode: learnerProfile.needsMoreEnglish ? 'Bilingual Helper' : 'Spanish Focus',
      duration: `${duration}s`
    });

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Save conversation to Supabase via API
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

      // Analyze conversation using text-only analysis
      const analysisService = new ConversationAnalysisService()
      const analysis = await analysisService.analyzeConversation(
        transcripts,
        'beginner', // TODO: Get actual user level
        ['order_food', 'ask_price', 'polite_interaction']
      )
      
      // Debug log to see what analysis contains
      console.log('[Practice] Analysis results:', JSON.stringify(analysis, null, 2))

      // Update conversation with analysis via API
      await fetch('/api/conversations/update-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          analysis
        })
      })

      // Extract vocabulary for progress tracking
      const vocabulary = analysisService.extractVocabulary(transcripts)

      // Update user progress via API
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
        const errorData = await progressResponse.json();
        console.error('[Practice] Progress save failed:', {
          status: progressResponse.status,
          error: errorData
        });
        throw new Error(`Failed to save progress: ${progressResponse.status}`);
      }

      const { progress } = await progressResponse.json();
      console.log('[Practice] Progress updated:', {
        totalConversations: progress.conversations_completed,
        totalMinutes: progress.total_minutes_practiced,
        pronunciation: progress.pronunciation,
        grammar: progress.grammar,
        fluency: progress.fluency,
        cultural: progress.cultural_knowledge
      });

      // Show detailed session feedback
      const userResponses = transcripts.filter(t => t.speaker === 'user').length;
      const successRate = sessionStats.totalResponses > 0 ? Math.round((sessionStats.goodResponses / sessionStats.totalResponses) * 100) : 0;
      const confidenceScore = Math.round(sessionStats.averageConfidence * 100);
      
      const sessionFeedback = `🎉 Great practice session!\n\n` +
        `📊 Your Performance:\n` +
        `• ${userResponses} conversations exchanges\n` +
        `• ${successRate}% success rate\n` +
        `• ${confidenceScore}% average confidence\n` +
        `• ${learnerProfile.masteredPhrases.length} words mastered\n` +
        `• ${Math.ceil(duration / 60)} minutes practiced\n\n` +
        `${sessionStats.improvementTrend === 'improving' ? '📈 You\'re improving during the session!' :
          sessionStats.improvementTrend === 'declining' ? '💪 Keep practicing - you\'re learning!' :
          '🎯 Consistent performance throughout!'}\n\n` +
        `📝 Full analysis saved to your progress!`;
      
      alert(sessionFeedback);
      console.log('[Practice] Analysis results:', JSON.stringify(analysis, null, 2));
      
    } catch (error) {
      console.error('Failed to save conversation:', error);
      
      // Create fallback analysis if detailed analysis fails
      const analysisService = new ConversationAnalysisService();
      const fallbackAnalysis = ConversationAnalysisService.createFallbackAnalysis(transcripts);
      
      alert(`Conversation saved with basic analysis. Used ${fallbackAnalysis.vocabulary_used.length} vocabulary words.`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleRestart = () => {
    setTranscripts([])
    setConversationStartTime(null)
    setConsecutiveSuccesses(0); // Reset adaptation counters
    setConsecutiveFailures(0);
    setSessionStats({
      totalResponses: 0,
      goodResponses: 0,
      strugglingResponses: 0,
      averageConfidence: 0,
      improvementTrend: 'neutral',
      streakCount: 0,
      lastFewConfidences: []
    });
    startFreshSession()
  }

  const handleExtendSession = () => {
    extendSession()
    dismissWarning()
  }
  
  const handleDismissWarning = () => {
    dismissWarning()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

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
              {isConnected && sessionStats.totalResponses > 0 && (
                <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">
                      🗣️ Conversation Quality
                    </div>
                    <div className={`text-sm font-bold ${
                      sessionStats.averageConfidence > 0.7 ? 'text-green-600' :
                      sessionStats.averageConfidence > 0.5 ? 'text-yellow-600' :
                      'text-orange-600'
                    }`}>
                      {Math.round(sessionStats.averageConfidence * 100)}%
                    </div>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        sessionStats.averageConfidence > 0.7 ? 'bg-green-500' :
                        sessionStats.averageConfidence > 0.5 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      }`}
                      style={{ width: `${sessionStats.averageConfidence * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>{sessionStats.goodResponses} good</span>
                    <span>{sessionStats.strugglingResponses} need practice</span>
                  </div>
                </div>
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
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-gray-400" />
                    </div>
                    <Button 
                      onClick={handleConnect}
                      disabled={!user || hasManuallyConnected}
                      className="px-8"
                    >
                      {hasManuallyConnected ? 'Connecting...' : 'Connect'}
                    </Button>
                    <p className="text-sm text-gray-600">Ready to start your Spanish practice</p>
                  </div>
                )}
              </div>
              
              {/* Speaking Indicator */}
              {currentSpeaker === 'user' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-blue-600 animate-pulse"></div>
                    <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm font-medium">Analyzing your Spanish...</span>
                </div>
              )}
              
              {/* Assistant Speaking Indicator */}
              {currentSpeaker === 'assistant' && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-green-600 animate-pulse"></div>
                    <div className="w-1 h-4 bg-green-600 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-4 bg-green-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm font-medium">
                    {learnerProfile.needsMoreEnglish ? 'Teaching with English...' : 'Immersing in Spanish...'}
                  </span>
                </div>
              )}
              
              {/* Real-time Comprehension Feedback */}
              {lastComprehensionFeedback && (
                <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                  lastComprehensionFeedback.level === 'excellent' ? 'bg-green-50 border-green-200 text-green-800' :
                  lastComprehensionFeedback.level === 'good' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                  lastComprehensionFeedback.level === 'struggling' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  'bg-orange-50 border-orange-200 text-orange-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      lastComprehensionFeedback.level === 'excellent' ? 'bg-green-500' :
                      lastComprehensionFeedback.level === 'good' ? 'bg-blue-500' :
                      lastComprehensionFeedback.level === 'struggling' ? 'bg-yellow-500' :
                      'bg-orange-500'
                    }`} />
                    <span className="text-sm font-medium">{lastComprehensionFeedback.message}</span>
                  </div>
                  <div className="mt-1 text-xs opacity-75">
                    Confidence: {Math.round(lastComprehensionFeedback.confidence * 100)}%
                  </div>
                </div>
              )}
              
              {/* Adaptation Notifications */}
              {showAdaptationNotification && (
                <div className={`p-3 rounded-lg border-2 transition-all duration-500 animate-pulse ${
                  showAdaptationNotification.type === 'switched_to_helper' ? 'bg-blue-50 border-blue-300 text-blue-800' :
                  showAdaptationNotification.type === 'switched_to_immersion' ? 'bg-purple-50 border-purple-300 text-purple-800' :
                  showAdaptationNotification.type === 'building_confidence' ? 'bg-green-50 border-green-300 text-green-800' :
                  'bg-yellow-50 border-yellow-300 text-yellow-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="text-lg">
                      {showAdaptationNotification.type === 'switched_to_helper' ? '🤝' :
                       showAdaptationNotification.type === 'switched_to_immersion' ? '🚀' :
                       showAdaptationNotification.type === 'building_confidence' ? '📈' : '💪'}
                    </div>
                    <span className="text-sm font-medium">{showAdaptationNotification.message}</span>
                  </div>
                </div>
              )}
              
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
                  <p className="font-semibold text-xs">Need help?</p>
                  <p className="text-xs mt-1">Say "explícame" or "teach me" to get explanations</p>
                  <p className="text-xs">Say "in English" for English explanations</p>
                </div>
                
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
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs">🧠 AI Tutor Mode</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${learnerProfile.needsMoreEnglish ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {learnerProfile.needsMoreEnglish ? '🤝 Helping' : '🚀 Immersion'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {learnerProfile.needsMoreEnglish 
                        ? 'Using lots of English to help you learn'
                        : 'Mostly Spanish for faster learning'
                      }
                    </div>
                    
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
                    
                    {/* Adaptation Progress */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Adaptation Progress:</span>
                        <span className="text-gray-500">
                          {learnerProfile.needsMoreEnglish ? (
                            consecutiveSuccesses > 0 ? `${consecutiveSuccesses}/2 successes` : 'Ready to help'
                          ) : (
                            consecutiveFailures > 0 ? `${consecutiveFailures}/2 struggles` : 'Doing great'
                          )}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full ${
                            learnerProfile.needsMoreEnglish ? (
                              i < consecutiveSuccesses ? 'bg-green-400' : 'bg-gray-200'
                            ) : (
                              i < consecutiveFailures ? 'bg-orange-400' : 'bg-gray-200'
                            )
                          }`} />
                        ))}
                      </div>
                      {consecutiveSuccesses >= 2 && learnerProfile.needsMoreEnglish && (
                        <div className="text-xs text-green-600 mt-1 font-medium">🎉 Ready to switch to Spanish focus!</div>
                      )}
                      {consecutiveFailures >= 2 && !learnerProfile.needsMoreEnglish && (
                        <div className="text-xs text-orange-600 mt-1 font-medium">🤝 Ready to switch to helper mode!</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs space-y-2">
                    
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
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-green-600 font-medium">{learnerProfile.masteredPhrases.length}</div>
                          <div className="text-gray-600">Words learned</div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-orange-600 font-medium">{learnerProfile.strugglingWords.length}</div>
                          <div className="text-gray-600">Need practice</div>
                        </div>
                      </div>
                      
                      {/* Quick Tips Based on Performance */}
                      {sessionStats.totalResponses > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-center">
                          <div className="text-xs font-medium text-blue-800 mb-1">💡 Quick Tip</div>
                          <div className="text-xs text-blue-700">
                            {sessionStats.averageConfidence > 0.7 ?
                              "You're doing great! Try using more complex sentences." :
                              sessionStats.averageConfidence > 0.5 ?
                              "Keep practicing! Don't worry about making mistakes." :
                              "Take your time and use simple phrases. I'm here to help!"}
                          </div>
                        </div>
                      )}
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
              disconnect(); // Disconnect voice service first
              router.push('/dashboard');
            }} className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function extractVocabulary(transcripts: any[]): string[] {
  // Simple vocabulary extraction - can be improved
  const words = new Set<string>()
  transcripts.forEach(t => {
    if (t.speaker === 'assistant') {
      const spanishWords = t.text.toLowerCase().split(/\s+/)
      spanishWords.forEach((word: string) => {
        if (word.length > 3) {
          words.add(word.replace(/[.,!?]/g, ''))
        }
      })
    }
  })
  return Array.from(words).slice(0, 10)
}

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