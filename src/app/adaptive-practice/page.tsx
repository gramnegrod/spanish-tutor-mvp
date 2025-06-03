'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime';
import { AudioRecorder, isAudioRecordingSupported } from '@/utils/audio-recorder';
import { ConversationAnalysisService, ConversationAnalysis } from '@/services/conversation-analysis';
import { ConversationUI } from '@/components/audio/ConversationUI';
import { ConversationTranscript } from '@/types';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { UserSettingsForm } from '@/components/practice/UserSettingsForm';
import { ScenarioPreview } from '@/components/practice/ScenarioPreview';
import { ConversationResults } from '@/components/practice/ConversationResults';
import { 
  LearningScenario, 
  UserAdaptations, 
  UserSettings
} from '@/types/adaptive-learning';
import { 
  learningScenarios, 
  getScenarioById, 
  personalizeSystemPrompt 
} from '@/config/learning-scenarios';
import { apiClient } from '@/lib/api-client';

type PageState = 'loading' | 'settings' | 'pre-conversation' | 'conversation' | 'analyzing' | 'results';

export default function AdaptivePracticePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>('loading');
  
  // User data
  const [userSettings, setUserSettings] = useState<UserSettings>({
    competency_level: 'beginner',
    speech_settings: {
      pause_duration: 2,
      speaking_speed: 'normal'
    },
    scenario_preferences: {}
  });
  const [userAdaptations, setUserAdaptations] = useState<UserAdaptations | null>(null);
  const [currentScenario, setCurrentScenario] = useState<LearningScenario | null>(null);
  
  // Conversation state
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const analysisService = useRef<ConversationAnalysisService | null>(null);
  const [conversationStartTime, setConversationStartTime] = useState<number>(0);
  const [recordingError, setRecordingError] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<ConversationAnalysis | null>(null);
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'assistant' | null>(null);
  
  // OpenAI Realtime hook - always provide config with onTranscript
  const realtimeConfig = {
    instructions: currentScenario ? personalizeSystemPrompt(
      currentScenario.system_prompt_template,
      {
        speaking_pace: userSettings.speech_settings.speaking_speed === 'slow' ? 0.8 : 
                      userSettings.speech_settings.speaking_speed === 'fast' ? 1.2 : 1.0,
        pause_duration: userSettings.speech_settings.pause_duration,
        common_errors: userAdaptations?.common_errors || [],
        struggle_areas: userAdaptations?.struggle_areas || [],
        mastered_concepts: userAdaptations?.mastered_concepts || []
      }
    ) : 'You are a helpful Spanish tutor. Please help the student practice their Spanish.',
    voice: 'alloy' as const,
    temperature: 0.7,
    // Don't use input transcription - Whisper is bad for multilingual
    // The AI understands audio perfectly without transcription
    enableInputTranscription: false,
    onTranscript: (role: string, text: string) => {
      console.log('[AdaptivePractice] Transcript received:', { role, text, transcriptsLength: transcripts.length });
      if (!text || text.trim() === '') {
        console.warn('[AdaptivePractice] Empty transcript received');
        return;
      }
      setTranscripts(prev => {
        const newTranscripts = [...prev, {
          id: crypto.randomUUID(),
          speaker: role as 'user' | 'assistant',
          text,
          timestamp: new Date()
        }];
        console.log('[AdaptivePractice] Updated transcripts:', newTranscripts.length);
        return newTranscripts;
      });
      setCurrentSpeaker(role as 'user' | 'assistant');
      setTimeout(() => setCurrentSpeaker(null), 1000);
    }
  };
  
  const {
    connect,
    disconnect,
    isConnected,
    costs,
    showTimeWarning,
    extendSession,
    sessionInfo,
    audioRef
  } = useOpenAIRealtime(realtimeConfig);
  
  // Load user data on mount
  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    loadUserData();
  }, [user, router]);
  
  // Start audio recording when conversation starts
  useEffect(() => {
    if (pageState === 'conversation' && isConnected && !audioRecorder.current.isRecording()) {
      startAudioRecording();
    }
  }, [pageState, isConnected]);
  
  // Track AI responses for event markers
  // TODO: Implement message tracking when we add transcript support
  
  async function loadUserData() {
    if (!user) return;
    
    try {
      // Load user adaptations from database
      console.log('[AdaptivePractice] Loading user adaptations...');
      const { adaptations } = await apiClient.getAdaptations();
      
      if (adaptations) {
        setUserAdaptations({
          user_id: user.id,
          speaking_pace_preference: 1.0, // Default normal speed
          needs_visual_aids: false, // Default false
          common_errors: adaptations.common_errors || [],
          struggle_areas: adaptations.struggle_areas || [],
          mastered_concepts: adaptations.mastered_concepts || []
        });
        
        // Infer competency level from mastered concepts
        if (adaptations.mastered_concepts.length > 20) {
          setUserSettings(prev => ({ ...prev, competency_level: 'advanced' }));
        } else if (adaptations.mastered_concepts.length > 10) {
          setUserSettings(prev => ({ ...prev, competency_level: 'intermediate' }));
        }
      } else {
        // First time user
        const defaultAdaptations: UserAdaptations = {
          user_id: user.id,
          speaking_pace_preference: 1.0, // Default normal speed
          needs_visual_aids: false, // Default false
          common_errors: [],
          struggle_areas: [],
          mastered_concepts: []
        };
        setUserAdaptations(defaultAdaptations);
      }
      
      // Load user progress to show stats
      const progressResponse = await fetch('/api/progress');
      const { progress } = await progressResponse.json();
      if (progress) {
        console.log('[AdaptivePractice] User progress:', {
          totalConversations: progress.conversations_completed,
          totalMinutes: progress.total_minutes_practiced,
          pronunciation: progress.pronunciation,
          grammar: progress.grammar,
          fluency: progress.fluency,
          vocabulary: progress.vocabulary?.length || 0
        });
        
        // Check if user has used adaptive practice before (not just any practice)
        // For now, always show settings first to let user configure
        // TODO: Add a flag to track if user has completed adaptive practice onboarding
        console.log('[AdaptivePractice] User has', progress.conversations_completed, 'total conversations');
        
        // Uncomment below to skip settings for returning users
        // if (progress.conversations_completed > 5) {
        //   const level = progress.fluency > 70 ? 'advanced' : 
        //                progress.fluency > 40 ? 'intermediate' : 'beginner';
        //   const scenario = learningScenarios.find(s => s.difficulty === level) || learningScenarios[0];
        //   setCurrentScenario(scenario);
        //   setPageState('pre-conversation');
        //   return;
        // }
      }
      
      // New user - show settings
      setPageState('settings');
    } catch (error) {
      console.error('Error loading user data:', error);
      setPageState('settings');
    }
  }
  
  async function startAudioRecording() {
    if (!isAudioRecordingSupported()) {
      setRecordingError('Audio recording is not supported in your browser');
      return;
    }
    
    try {
      await audioRecorder.current.startRecording();
      setRecordingError('');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingError('Failed to start audio recording. Please check permissions.');
    }
  }
  
  async function handleStartConversation() {
    if (!currentScenario) return;
    
    // Initialize analysis service
    const conversationId = `conv_${Date.now()}`;
    analysisService.current = new ConversationAnalysisService();
    
    setConversationStartTime(Date.now());
    setTranscripts([]); // Clear previous transcripts
    setPageState('conversation');
    
    await connect();
  }
  
  async function handleEndConversation() {
    setPageState('analyzing');
    
    // Disconnect from OpenAI
    await disconnect();
    
    try {
      // Stop recording and get audio
      const audioBlob = await audioRecorder.current.stopRecording();
      
      // Use real transcripts from the conversation
      if (transcripts.length === 0) {
        console.warn('[AdaptivePractice] No transcripts captured');
        setPageState('results');
        return;
      }
      
      // Perform analysis with real transcripts
      const analysis = await analysisService.current!.analyzeConversation(
        transcripts,
        userSettings.competency_level,
        currentScenario!.goals.map(g => g.description)
      );
      
      // Type assertion to handle conflicting ConversationAnalysis interfaces
      setAnalysisResults(analysis as any);
      
      // Save to database
      await saveConversationResults(analysis as any, audioBlob);
      
      setPageState('results');
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      // Still show results page even if analysis failed
      setPageState('results');
    }
  }
  
  async function saveConversationResults(analysis: ConversationAnalysis, audioBlob: Blob) {
    if (!user) {
      console.error('[AdaptivePractice] No user to save results for');
      return;
    }
    
    const duration = Math.floor((Date.now() - conversationStartTime) / 1000);
    
    try {
      // Save conversation to database
      console.log('[AdaptivePractice] Saving conversation to database...');
      const { conversation } = await apiClient.saveConversation({
        title: `${currentScenario?.title || 'Practice'} - ${new Date().toLocaleString()}`,
        persona: currentScenario?.context.role_ai || 'Spanish Tutor',
        transcript: transcripts,
        duration
      });
      
      // Save analysis to conversation
      await apiClient.updateConversationAnalysis(conversation.id, analysis);
      
      // Extract vocabulary for progress tracking
      const vocabulary = extractVocabularyFromTranscripts(transcripts);
      
      // Update user progress
      console.log('[AdaptivePractice] Updating user progress...');
      await apiClient.updateProgress({
        vocabulary,
        minutesPracticed: Math.ceil(duration / 60),
        pronunciationImprovement: analysis.quality_assessment?.engagement > 0.7 ? 2 : 1,
        grammarImprovement: analysis.mistakes?.length < 3 ? 2 : 1,
        fluencyImprovement: analysis.conversation_metrics?.wordsPerMinute > 60 ? 2 : 1,
        culturalImprovement: analysis.cultural_notes?.length > 0 ? 2 : 1
      });
      
      // Update user adaptations based on analysis
      console.log('[AdaptivePractice] Updating user adaptations...');
      
      // mistakes is string[] in ConversationAnalysisService
      const extractedErrors = analysis.mistakes || [];
      
      const newAdaptations = {
        user_id: user.id,
        common_errors: extractedErrors,
        mastered_concepts: analysis.wins || [],
        struggle_areas: analysis.recommendations || []
      };
      
      await apiClient.updateAdaptations({
        common_errors: newAdaptations.common_errors,
        mastered_concepts: newAdaptations.mastered_concepts,
        struggle_areas: newAdaptations.struggle_areas
      });
      
      console.log('[AdaptivePractice] Successfully saved all data to database');
    } catch (error) {
      console.error('[AdaptivePractice] Failed to save conversation results:', error);
    }
  }
  
  function extractVocabularyFromTranscripts(transcripts: ConversationTranscript[]): string[] {
    const vocabulary = new Set<string>();
    
    // Extract Spanish words from AI responses
    transcripts.forEach(t => {
      if (t.speaker === 'assistant') {
        const words = t.text.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3)
          .map(word => word.replace(/[.,!?¿¡]/g, ''));
        
        words.forEach(word => vocabulary.add(word));
      }
    });
    
    return Array.from(vocabulary).slice(0, 20); // Limit to 20 new words
  }
  
  function handleSaveSettings() {
    // TODO: Save to database
    
    // Select first scenario based on level
    const firstScenario = learningScenarios.find(
      s => s.difficulty === userSettings.competency_level
    ) || learningScenarios[0];
    
    setCurrentScenario(firstScenario);
    setPageState('pre-conversation');
  }
  
  function handleTryAgain() {
    setAnalysisResults(null);
    setPageState('pre-conversation');
  }
  
  function handleNextScenario() {
    // TODO: Get next scenario based on performance
    const nextScenario = learningScenarios.find(
      s => s.id !== currentScenario?.id
    );
    
    if (nextScenario) {
      setCurrentScenario(nextScenario);
      setAnalysisResults(null);
      setPageState('pre-conversation');
    }
  }
  
  // Render different states
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading your learning profile...</div>
      </div>
    );
  }
  
  if (pageState === 'settings') {
    return (
      <div className="min-h-screen bg-gray-900">
        <AuthHeader />
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <UserSettingsForm
              userSettings={userSettings}
              onSettingsChange={setUserSettings}
              onSave={handleSaveSettings}
            />
          </div>
        </div>
      </div>
    );
  }
  
  if (pageState === 'pre-conversation' && currentScenario) {
    return (
      <div className="min-h-screen bg-gray-900">
        <AuthHeader />
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <ScenarioPreview
              scenario={currentScenario}
              recordingError={recordingError}
              onStartConversation={handleStartConversation}
            />
          </div>
        </div>
      </div>
    );
  }
  
  if (pageState === 'conversation') {
    return (
      <div className="min-h-screen bg-gray-900">
        <AuthHeader />
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {currentScenario?.title}
              </h2>
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {/* TODO: Add session duration tracking */}
                </div>
                <div className="text-sm text-gray-400">
                  Cost: ${(costs?.totalCost || 0).toFixed(3)}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              {transcripts.length === 0 ? (
                <div className="h-96 overflow-y-auto bg-gray-700 rounded p-4">
                  <div className="text-gray-400 text-center">
                    {isConnected ? 'Start speaking to begin the conversation...' : 'Connecting...'}
                  </div>
                </div>
              ) : (
                <ConversationUI 
                  transcripts={transcripts}
                  currentSpeaker={currentSpeaker}
                  isProcessing={false}
                />
              )}
            </div>
            
            {/* Hidden audio element for voice playback */}
            <audio ref={audioRef} autoPlay hidden />
            
            {/* Speaking indicator */}
            {currentSpeaker && (
              <div className="mb-4 text-center">
                <span className="text-sm text-gray-400">
                  {currentSpeaker === 'user' ? 'You are speaking...' : 'AI is responding...'}
                </span>
              </div>
            )}
            
            <button
              onClick={handleEndConversation}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              End Conversation
            </button>
          </div>
          </div>
        </div>
        
        {/* Session warning modal */}
        {showTimeWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">
                2 Minutes Remaining
              </h3>
              <p className="text-gray-300 mb-6">
                Your conversation will end soon. Would you like to continue for another 10 minutes?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => extendSession()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Continue
                </button>
                <button
                  onClick={handleEndConversation}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  End Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  if (pageState === 'analyzing') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Analyzing your conversation...</div>
          <div className="text-gray-400">This may take a moment</div>
        </div>
      </div>
    );
  }
  
  if (pageState === 'results') {
    return (
      <div className="min-h-screen bg-gray-900">
        <AuthHeader />
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <ConversationResults
              analysisResults={analysisResults}
              onTryAgain={handleTryAgain}
              onNextScenario={handleNextScenario}
            />
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}