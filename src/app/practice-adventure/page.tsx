'use client';

// Force dynamic rendering to avoid prerender issues with browser APIs
export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getScenarioById, getNextScenario } from '@/config/mexico-city-adventure';
import { generateNPCPrompt } from '@/lib/npc-personality-system';
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime';
import { 
  loadAdventureProgress, 
  saveAdventureProgress, 
  completeScenario,
  updateScenarioProgress 
} from '@/lib/adventure-progression';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mic, MicOff } from 'lucide-react';
import { safeFormatTime } from '@/lib/utils';

interface ConversationTranscript {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: Date | string; // Allow both Date objects and ISO strings
}

export default function PracticeAdventurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scenarioId = searchParams.get('scenario');
  const adventureId = searchParams.get('adventure');

  const [scenario, setScenario] = useState<any>(null);
  const [npcPrompt, setNpcPrompt] = useState('');
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Completion tracking
  const [completionChecklist, setCompletionChecklist] = useState<{
    hasGreeted: boolean;
    hasUsedKeyVocabulary: boolean;
    hasHadMeaningfulExchange: boolean;
    hasCompletedGoals: boolean;
  }>({
    hasGreeted: false,
    hasUsedKeyVocabulary: false,
    hasHadMeaningfulExchange: false,
    hasCompletedGoals: false
  });

  useEffect(() => {
    if (scenarioId) {
      const foundScenario = getScenarioById(scenarioId);
      if (foundScenario) {
        console.log('[Practice Adventure] Setting scenario:', foundScenario.id);
        setScenario(foundScenario);
        
        // Generate NPC prompt
        const prompt = generateNPCPrompt({
          scenario: foundScenario,
          userLevel: 'beginner',
          supportLevel: 'MODERATE_SUPPORT'
        });
        
        console.log('[Practice Adventure] Generated prompt for:', foundScenario.npc.name);
        console.log('[Practice Adventure] Prompt length:', prompt.length);
        console.log('[Practice Adventure] Prompt preview:', prompt.substring(0, 300));
        
        setNpcPrompt(prompt);
      }
    }
  }, [scenarioId]);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to check if conversation meets completion criteria based on exchanges
  const checkCompletionCriteria = useCallback((userText: string, allTranscripts: ConversationTranscript[]) => {
    console.log('[checkCompletionCriteria] CALLED with:', { 
      userText: userText.substring(0, 50) + '...', 
      transcriptCount: allTranscripts.length,
      scenarioId: scenario?.id || 'NULL',
      scenarioLoaded: !!scenario 
    });

    if (!scenario) {
      console.warn('[checkCompletionCriteria] EARLY EXIT: No scenario loaded yet, cannot check completion');
      return;
    }

    const lowerText = userText.toLowerCase();
    const allUserText = allTranscripts
      .filter(t => t.speaker === 'user')
      .map(t => t.text.toLowerCase())
      .join(' ');

    console.log('[checkCompletionCriteria] Processing completion criteria:');
    console.log('- Current user text:', userText);
    console.log('- All user text:', allUserText);
    console.log('- Scenario vocabulary:', scenario.vocabulary.essential);
    console.log('- User exchanges count:', allTranscripts.filter(t => t.speaker === 'user').length);

    setCompletionChecklist(prev => {
      const updated = { ...prev };

      // Check greeting (hola, buenos días, etc.)
      if (!updated.hasGreeted) {
        const greetings = ['hola', 'buenos', 'buenas', 'buen día', 'saludos', 'hello'];
        updated.hasGreeted = greetings.some(greeting => allUserText.includes(greeting));
        console.log('- Greeting check:', updated.hasGreeted, 'Found words:', greetings.filter(g => allUserText.includes(g)));
      }

      // Check key vocabulary usage
      if (!updated.hasUsedKeyVocabulary) {
        const keyWords = scenario.vocabulary.essential;
        const usedWords = keyWords.filter((word: string) => {
          const wordLower = word.toLowerCase();
          return allUserText.includes(wordLower);
        });
        updated.hasUsedKeyVocabulary = usedWords.length >= 1; // Need at least 1 key word (reduced from 2)
        console.log('- Vocabulary check:', updated.hasUsedKeyVocabulary, 'Used words:', usedWords, 'Looking for:', keyWords, 'In text:', allUserText);
      }

      // Check meaningful exchange (at least 3 back-and-forth)
      if (!updated.hasHadMeaningfulExchange) {
        const userExchanges = allTranscripts.filter(t => t.speaker === 'user').length;
        updated.hasHadMeaningfulExchange = userExchanges >= 3;
        console.log('- Exchange check:', updated.hasHadMeaningfulExchange, 'User exchanges:', userExchanges, '(need 3+)');
      }

      // Check scenario-specific goals
      if (!updated.hasCompletedGoals) {
        if (scenario.id === 'travel-agent') {
          // Travel agent: ask about itinerary, adventure, or plans
          const goalWords = ['itinerario', 'aventura', 'planes', 'viaje', 'méxico', 'mexico', 'trip', 'travel'];
          const foundGoalWords = goalWords.filter(word => allUserText.includes(word));
          updated.hasCompletedGoals = foundGoalWords.length > 0;
          console.log('- Travel agent goal check:', updated.hasCompletedGoals, 'Found goal words:', foundGoalWords);
        } else if (scenario.id === 'immigration') {
          // Immigration: provide purpose and duration
          const goalWords = ['turista', 'días', 'vacaciones', 'visita', 'tourist', 'vacation'];
          updated.hasCompletedGoals = goalWords.some(word => allUserText.includes(word));
        } else if (scenario.id === 'taxi-ride') {
          // Taxi: give destination and discuss fare
          const goalWords = ['hotel', 'centro', 'cuánto', 'cuesta'];
          updated.hasCompletedGoals = goalWords.some(word => allUserText.includes(word));
        } else {
          // Default: meaningful conversation counts as goal completion
          updated.hasCompletedGoals = updated.hasHadMeaningfulExchange;
        }
      }

      console.log('- Final checklist state:', updated);
      return updated;
    });
  }, [scenario, setCompletionChecklist]);

  // Alternative completion tracking based on conversation flow
  const checkConversationFlow = useCallback((allTranscripts: ConversationTranscript[]) => {
    console.log('[checkConversationFlow] CALLED with:', {
      transcriptCount: allTranscripts.length,
      scenarioId: scenario?.id || 'NULL',
      scenarioLoaded: !!scenario
    });

    if (!scenario) {
      console.warn('[checkConversationFlow] EARLY EXIT: No scenario loaded yet, cannot check flow');
      return;
    }

    const totalExchanges = allTranscripts.length;
    const assistantResponses = allTranscripts.filter(t => t.speaker === 'assistant');
    
    console.log('[checkConversationFlow] Processing conversation flow with', totalExchanges, 'total exchanges');
    
    // Look for engagement patterns in AI responses
    const allAssistantText = assistantResponses.map(t => t.text.toLowerCase()).join(' ');
    
    setCompletionChecklist(prev => {
      const updated = { ...prev };

      // Progressive completion based on conversation length and AI response patterns
      if (totalExchanges >= 2 && !updated.hasGreeted) {
        updated.hasGreeted = true; // If conversation started, greeting happened
        console.log('- Flow greeting: Auto-complete based on conversation start');
      }

      if (totalExchanges >= 4 && !updated.hasUsedKeyVocabulary) {
        // Check if AI is responding about scenario-specific topics
        const scenarioWords = scenario.vocabulary.essential.map((w: string) => w.toLowerCase());
        const foundInAI = scenarioWords.some((word: string) => allAssistantText.includes(word));
        if (foundInAI) {
          updated.hasUsedKeyVocabulary = true;
          console.log('- Flow vocabulary: Auto-complete based on AI topic engagement');
        }
      }

      if (totalExchanges >= 6 && !updated.hasHadMeaningfulExchange) {
        updated.hasHadMeaningfulExchange = true;
        console.log('- Flow exchange: Auto-complete based on exchange count');
      }

      if (totalExchanges >= 8 && !updated.hasCompletedGoals) {
        // For travel agent: check if AI mentioned Mexico City activities
        if (scenario.id === 'travel-agent') {
          const travelWords = ['méxico', 'city', 'ciudad', 'lugares', 'sitios', 'visitar', 'turismo', 'aventura'];
          const foundTravel = travelWords.some(word => allAssistantText.includes(word));
          if (foundTravel) {
            updated.hasCompletedGoals = true;
            console.log('- Flow goals: Auto-complete based on travel topic engagement');
          }
        } else {
          updated.hasCompletedGoals = true; // Default completion for other scenarios
        }
      }

      console.log('- Final flow state:', updated);
      return updated;
    });
  }, [scenario, setCompletionChecklist]);

  const {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    audioRef,
    updateInstructions
  } = useOpenAIRealtime({
    enableInputTranscription: true,
    instructions: npcPrompt || 'You are a helpful assistant.',
    voice: scenario?.npc?.voice || 'alloy',
    autoConnect: false,
    turnDetection: {
      type: 'server_vad',
      threshold: 0.6,        // Higher threshold = less sensitive
      prefixPaddingMs: 500,  // More padding before speech
      silenceDurationMs: 1200 // Longer silence before turn ends (was 200)
    },
    onTranscript: (role: 'user' | 'assistant', text: string) => {
      console.log(`[onTranscript] ${scenario?.npc?.name || 'NPC'} ${role}: ${text}`);
      console.log('[onTranscript] State check:', { scenarioLoaded: !!scenario, scenarioId: scenario?.id });
      
      // Start conversation timer if first transcript
      if (!conversationStartTime) {
        setConversationStartTime(new Date());
      }
      
      // Add to transcript display
      const newTranscript = {
        id: `${Date.now()}-${Math.random()}`,
        speaker: role,
        text: text,
        timestamp: new Date()
      };
      
      setTranscripts(prev => {
        const updated = [...prev, newTranscript];
        
        // ARCHITECTURAL FIX: Remove setTimeout timing dependency
        // Check completion immediately with current state
        console.log('[onTranscript] About to call completion functions');
        
        // Only call completion functions if scenario is loaded
        if (scenario) {
          console.log('[onTranscript] Scenario loaded, calling completion functions');
          
          // Original method (if user transcripts work)
          if (role === 'user') {
            checkCompletionCriteria(text, updated);
          }
          
          // Fallback method based on conversation flow (always run)
          checkConversationFlow(updated);
        } else {
          console.warn('[onTranscript] Scenario not loaded yet, deferring completion check');
        }
        
        return updated;
      });
      
      setCurrentSpeaker(role);
      setTimeout(() => setCurrentSpeaker(null), 1000);
    }
  });

  // Note: Completion checking happens only in onTranscript callback to avoid circular dependencies

  // Update instructions when NPC prompt is ready
  useEffect(() => {
    if (npcPrompt && updateInstructions) {
      console.log('[Practice Adventure] Updating NPC instructions for:', scenario?.npc?.name);
      console.log('[Practice Adventure] Instructions preview:', npcPrompt.substring(0, 200) + '...');
      updateInstructions(npcPrompt);
    }
  }, [npcPrompt, updateInstructions, scenario?.npc?.name]);

  if (!scenario || !isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/mexico-city-adventure')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Adventure
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">
                {!scenario ? 'Scenario Not Found' : 'Loading...'}
              </h2>
              <p className="text-gray-600">
                {!scenario 
                  ? `The scenario "${scenarioId}" could not be found.`
                  : 'Preparing your adventure...'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/mexico-city-adventure')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Adventure
          </Button>
        </div>

        {/* Combined Scenario Info & Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">
                {scenario.id === 'travel-agent' && '🗺️'}
                {scenario.id === 'immigration' && '✈️'}
                {scenario.id === 'taxi-ride' && '🚕'}
                {scenario.id === 'hotel-checkin' && '🏨'}
                {scenario.id === 'luggage-help' && '🛎️'}
                {scenario.id === 'taco-stand' && '🌮'}
                {scenario.id === 'art-museum' && '🎨'}
                {scenario.id === 'coffee-shop' && '☕'}
                {scenario.id === 'restaurant' && '🍽️'}
                {scenario.id === 'pharmacy' && '💊'}
                {scenario.id === 'bus-ride' && '🚌'}
              </span>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{scenario.title}</h1>
                <p className="text-gray-600">{scenario.location}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">Progress</div>
                <div className="text-lg font-bold text-green-600">
                  {isMounted ? Object.values(completionChecklist).filter(Boolean).length : 0}/4
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Character Info */}
              <div>
                <h3 className="font-semibold mb-2">Meet {scenario.npc.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{scenario.npc.role}</p>
                <p className="text-xs text-gray-700 mb-2">{scenario.npc.personality}</p>
                
                {/* Special accent notice for pharmacy scenario */}
                {scenario.id === 'pharmacy' && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-blue-600">🇬🇧</span>
                      <span className="text-xs font-medium text-blue-800">British Accent</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Intentional pronunciation quirks like dropped R's
                    </p>
                  </div>
                )}
              </div>

              {/* Learning Goals */}
              <div>
                <h3 className="font-semibold mb-2">Learning Goals</h3>
                <ul className="text-sm space-y-1">
                  {scenario.learningGoals.map((goal: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Progress */}
              <div>
                <h3 className="font-semibold mb-2">Quick Progress</h3>
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${completionChecklist.hasGreeted ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{completionChecklist.hasGreeted ? '✅' : '⭕'}</span>
                    <span>Greeting</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${completionChecklist.hasUsedKeyVocabulary ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{completionChecklist.hasUsedKeyVocabulary ? '✅' : '⭕'}</span>
                    <span>Key Words</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${completionChecklist.hasHadMeaningfulExchange ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{completionChecklist.hasHadMeaningfulExchange ? '✅' : '⭕'}</span>
                    <span>Conversation</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${completionChecklist.hasCompletedGoals ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>{completionChecklist.hasCompletedGoals ? '✅' : '⭕'}</span>
                    <span>Goal Complete</span>
                  </div>
                </div>
                
                {/* Completion Status */}
                {Object.values(completionChecklist).every(Boolean) && (
                  <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-center">
                    <div className="text-green-800 font-bold text-sm">🎉 All Done!</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Display - Enhanced */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Conversation with {scenario.npc.name}</span>
              <span className="text-sm font-normal text-gray-500">
                {isMounted ? transcripts.length : 0} messages
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              id="conversation-container"
              className="h-[calc(100vh-20rem)] min-h-[600px] overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-6 space-y-4 scroll-smooth border"
              style={{ scrollBehavior: 'smooth' }}
            >
              {transcripts.length === 0 ? (
                <div className="text-center text-gray-500 h-full flex flex-col justify-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg font-medium">Ready to start your conversation?</p>
                  <p className="text-sm mt-2">Click "Start Conversation" below to begin speaking with {scenario.npc.name}</p>
                </div>
              ) : (
                transcripts.map((transcript, index) => (
                  <div
                    key={transcript.id}
                    className={`flex ${transcript.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                    ref={index === transcripts.length - 1 ? (el) => {
                      // Auto-scroll to latest message
                      if (el && typeof window !== 'undefined') {
                        setTimeout(() => {
                          const container = document.getElementById('conversation-container');
                          if (container) {
                            container.scrollTop = container.scrollHeight;
                          }
                        }, 100);
                      }
                    } : undefined}
                  >
                    <div className={`max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-lg shadow-sm ${
                      transcript.speaker === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200'
                    } ${currentSpeaker === transcript.speaker ? 'ring-2 ring-green-400 ring-opacity-50' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium opacity-80">
                          {transcript.speaker === 'user' ? 'You' : scenario.npc.name}
                        </div>
                        <div className="text-xs opacity-60">
                          {safeFormatTime(transcript.timestamp)}
                        </div>
                      </div>
                      <div className="text-sm leading-relaxed">{transcript.text}</div>
                    </div>
                  </div>
                ))
              )}
              {currentSpeaker && (
                <div className="flex justify-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                    <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      {currentSpeaker === 'user' ? 'You are speaking...' : `${scenario.npc.name} is responding...`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voice Control */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mb-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 text-sm">{error.message}</p>
                  </div>
                )}
                
                <div className="flex justify-center gap-3 mb-4">
                  <Button
                    size="lg"
                    onClick={isConnected ? disconnect : connect}
                    disabled={isConnecting}
                    className={`px-8 py-6 text-lg ${
                      isConnected 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </>
                    ) : isConnected ? (
                      <>
                        <MicOff className="mr-2 h-5 w-5" />
                        End Conversation
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-5 w-5" />
                        Start Conversation
                      </>
                    )}
                  </Button>
                  
                  {/* Scenario Completion/Exit Options */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={Object.values(completionChecklist).every(Boolean) ? "default" : "outline"}
                      onClick={() => {
                        disconnect();
                        
                        // Calculate performance metrics
                        const userExchanges = transcripts.filter(t => t.speaker === 'user').length;
                        const totalExchanges = transcripts.length;
                        const conversationDuration = conversationStartTime 
                          ? Math.round((Date.now() - conversationStartTime.getTime()) / 1000 / 60)
                          : 0;
                        
                        // Load current adventure progress
                        let adventureProgress = loadAdventureProgress();
                        if (!adventureProgress) {
                          // This shouldn't happen, but handle gracefully
                          alert('❌ Adventure progress not found. Please restart from the adventure map.');
                          router.push('/mexico-city-adventure');
                          return;
                        }
                        
                        // Create performance data
                        const performance = {
                          comprehensionRate: 0.8, // Simplified for now
                          successfulExchanges: Math.max(1, userExchanges), // At least 1 for completion
                          totalExchanges: Math.max(1, totalExchanges),
                          strugglingPhrases: [],
                          masteredPhrases: scenario.vocabulary.essential
                        };
                        
                        // Get next scenario
                        const nextScenario = getNextScenario(scenario.id);
                        
                        // Complete scenario and unlock next
                        const updatedProgress = completeScenario(
                          adventureProgress,
                          scenario.id,
                          performance,
                          nextScenario?.id
                        );
                        
                        // Update time spent
                        updatedProgress.globalStats.totalTimeMinutes += conversationDuration;
                        
                        // Save progress
                        saveAdventureProgress(updatedProgress);
                        
                        // Show completion message
                        const completedCount = Object.values(updatedProgress.scenarios)
                          .filter(s => s.status === 'completed').length;
                        const totalScenarios = Object.keys(updatedProgress.scenarios).length;
                        
                        if (nextScenario) {
                          alert(`🎉 Scenario "${scenario.title}" completed!\n\n` +
                            `Progress: ${completedCount}/${totalScenarios} scenarios\n` +
                            `Time: ${conversationDuration} minutes\n` +
                            `Next: ${nextScenario.title} is now unlocked!`);
                        } else {
                          alert(`🎊 Adventure completed! Congratulations!\n\n` +
                            `You've finished all ${totalScenarios} scenarios!\n` +
                            `Total time: ${updatedProgress.globalStats.totalTimeMinutes} minutes`);
                        }
                        
                        router.push('/mexico-city-adventure');
                      }}
                      className={`px-4 py-2 ${
                        Object.values(completionChecklist).every(Boolean) 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : ''
                      }`}
                    >
                      {Object.values(completionChecklist).every(Boolean) 
                        ? '🎉 Complete Scenario (All Goals Met!)' 
                        : `📝 Complete Scenario (${isMounted ? Object.values(completionChecklist).filter(Boolean).length : 0}/4 goals)`
                      }
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={() => {
                        disconnect();
                        router.push('/mexico-city-adventure');
                      }}
                      className="px-4 py-2 text-sm"
                    >
                      ❌ Exit Adventure
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  {isConnected 
                    ? `Speaking with ${scenario.npc.name} - Complete when ready!`
                    : `Ready to meet ${scenario.npc.name}? Click to start!`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Element */}
        <audio ref={audioRef} autoPlay className="hidden" />

        {/* Debug Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🐛 Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div><strong>Voice:</strong> {scenario.npc.voice}</div>
              <div><strong>Prompt Ready:</strong> {npcPrompt ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Prompt Length:</strong> {npcPrompt?.length || 0} characters</div>
              
              {/* Completion Debug */}
              <div><strong>Total Exchanges:</strong> {transcripts.length}</div>
              <div><strong>User Transcripts:</strong> {transcripts.filter(t => t.speaker === 'user').length}</div>
              <div><strong>Assistant Transcripts:</strong> {transcripts.filter(t => t.speaker === 'assistant').length}</div>
              <div><strong>All User Text:</strong></div>
              <div className="bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                {transcripts.filter(t => t.speaker === 'user').map(t => t.text).join(' ') || 'No user text yet'}
              </div>
              <div><strong>All Assistant Text:</strong></div>
              <div className="bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                {transcripts.filter(t => t.speaker === 'assistant').map(t => t.text).join(' ') || 'No assistant text yet'}
              </div>
              <div><strong>Target Vocabulary:</strong> {scenario.vocabulary.essential.join(', ')}</div>
              <div><strong>Checklist State:</strong></div>
              <div className="bg-gray-50 p-2 rounded text-xs">
                Greeted: {completionChecklist.hasGreeted ? '✅' : '❌'} | 
                Vocabulary: {completionChecklist.hasUsedKeyVocabulary ? '✅' : '❌'} | 
                Exchange: {completionChecklist.hasHadMeaningfulExchange ? '✅' : '❌'} | 
                Goals: {completionChecklist.hasCompletedGoals ? '✅' : '❌'}
              </div>
              <div><strong>Flow Tracking:</strong> Progressive completion based on conversation exchanges</div>
              
              {npcPrompt && (
                <details>
                  <summary className="cursor-pointer font-medium">Show Prompt Preview</summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-xs max-h-40 overflow-y-auto">
                    {npcPrompt.substring(0, 500)}...
                  </div>
                </details>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vocabulary Helper */}
        <Card>
          <CardHeader>
            <CardTitle>Essential Vocabulary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {scenario.vocabulary.essential.map((word: string, i: number) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                  <span className="font-medium">{word}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}