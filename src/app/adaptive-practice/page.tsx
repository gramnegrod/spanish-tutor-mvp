'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime';
import { AudioRecorder, isAudioRecordingSupported } from '@/utils/audio-recorder';
import { ConversationAnalysisService } from '@/services/conversation-analysis';
import { 
  LearningScenario, 
  UserAdaptations, 
  UserSettings,
  ConversationAnalysis 
} from '@/types/adaptive-learning';
import { 
  learningScenarios, 
  getScenarioById, 
  personalizeSystemPrompt 
} from '@/config/learning-scenarios';

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
  
  // OpenAI Realtime hook
  const realtimeConfig = currentScenario ? {
    instructions: personalizeSystemPrompt(
      currentScenario.system_prompt_template,
      {
        speaking_pace: userSettings.speech_settings.speaking_speed === 'slow' ? 0.8 : 
                      userSettings.speech_settings.speaking_speed === 'fast' ? 1.2 : 1.0,
        pause_duration: userSettings.speech_settings.pause_duration,
        common_errors: userAdaptations?.common_errors || [],
        struggle_areas: userAdaptations?.struggle_areas || [],
        mastered_concepts: userAdaptations?.mastered_concepts || []
      }
    ),
    voice: 'alloy' as const,
    temperature: 0.7
  } : undefined;
  
  const {
    connect,
    disconnect,
    isConnected,
    costs,
    showTimeWarning,
    extendSession,
    sessionInfo
  } = useOpenAIRealtime(realtimeConfig || {});
  
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
    try {
      // TODO: Load from Supabase
      // For now, use mock data
      const mockAdaptations: UserAdaptations = {
        user_id: user!.id,
        speaking_pace_preference: 0.9,
        needs_visual_aids: false,
        common_errors: [],
        mastered_concepts: [],
        struggle_areas: []
      };
      
      setUserAdaptations(mockAdaptations);
      
      // Check if returning user or first time
      const hasCompletedOnboarding = false; // TODO: Check from DB
      
      if (hasCompletedOnboarding) {
        // Load their current scenario
        const savedScenarioId = 'travel_agency_booking'; // TODO: From DB
        const scenario = getScenarioById(savedScenarioId);
        setCurrentScenario(scenario || learningScenarios[0]);
        setPageState('pre-conversation');
      } else {
        setPageState('settings');
      }
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
      
      // Perform analysis (using dummy transcripts for now since we don't have real-time transcription)
      const dummyTranscripts = [
        { id: '1', speaker: 'user' as const, text: 'Hola, ¿cómo estás?', timestamp: new Date() },
        { id: '2', speaker: 'assistant' as const, text: 'Muy bien, gracias. ¿Y tú?', timestamp: new Date() }
      ];
      const analysis = await analysisService.current!.analyzeConversation(
        dummyTranscripts,
        userSettings.competency_level,
        currentScenario!.goals.map(g => g.description)
      );
      
      // Type assertion to handle conflicting ConversationAnalysis interfaces
      setAnalysisResults(analysis as any);
      
      // TODO: Save to database
      await saveConversationResults(analysis as any, audioBlob);
      
      setPageState('results');
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      // Still show results page even if analysis failed
      setPageState('results');
    }
  }
  
  async function saveConversationResults(analysis: ConversationAnalysis, audioBlob: Blob) {
    // TODO: Implement actual database save
    console.log('Saving conversation results:', {
      duration: Date.now() - conversationStartTime,
      analysis,
      audioSize: audioBlob.size
    });
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
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-6">
              Welcome to Adaptive Learning!
            </h1>
            
            <p className="text-gray-300 mb-6">
              Let's customize your learning experience. These settings help us adapt to your needs.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What's your current Spanish level?
                </label>
                <select
                  value={userSettings.competency_level}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    competency_level: e.target.value as any
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                >
                  <option value="beginner">Beginner - I know basic phrases</option>
                  <option value="intermediate">Intermediate - I can have simple conversations</option>
                  <option value="advanced">Advanced - I'm comfortable in most situations</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  How fast should the AI speak?
                </label>
                <select
                  value={userSettings.speech_settings.speaking_speed}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    speech_settings: {
                      ...userSettings.speech_settings,
                      speaking_speed: e.target.value as any
                    }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                >
                  <option value="slow">Slow - Give me time to process</option>
                  <option value="normal">Normal - Natural pace</option>
                  <option value="fast">Fast - Challenge me!</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pause duration between sentences (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  value={userSettings.speech_settings.pause_duration}
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    speech_settings: {
                      ...userSettings.speech_settings,
                      pause_duration: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded"
                />
              </div>
            </div>
            
            <button
              onClick={handleSaveSettings}
              className="mt-8 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Learning
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (pageState === 'pre-conversation' && currentScenario) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            ← Back
          </button>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              {currentScenario.title}
            </h1>
            
            <p className="text-gray-300 mb-6">
              {currentScenario.description}
            </p>
            
            <div className="mb-6 p-4 bg-gray-700 rounded">
              <h3 className="font-semibold text-white mb-2">Your Goals:</h3>
              <ul className="space-y-2">
                {currentScenario.goals.filter(g => g.required).map(goal => (
                  <li key={goal.id} className="text-gray-300 flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    {goal.description}
                  </li>
                ))}
              </ul>
              {currentScenario.goals.some(g => !g.required) && (
                <>
                  <h4 className="font-semibold text-white mt-3 mb-1">Bonus Goals:</h4>
                  <ul className="space-y-1">
                    {currentScenario.goals.filter(g => !g.required).map(goal => (
                      <li key={goal.id} className="text-gray-400 flex items-start text-sm">
                        <span className="text-yellow-400 mr-2">★</span>
                        {goal.description}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            
            <div className="mb-6 p-4 bg-blue-900/30 rounded">
              <h3 className="font-semibold text-blue-300 mb-2">Context:</h3>
              <p className="text-gray-300 text-sm mb-2">
                <strong>Setting:</strong> {currentScenario.context.setting}
              </p>
              <p className="text-gray-300 text-sm mb-2">
                <strong>Your role:</strong> {currentScenario.context.role_student}
              </p>
              <p className="text-gray-300 text-sm">
                <strong>AI's role:</strong> {currentScenario.context.role_ai}
              </p>
            </div>
            
            <div className="mb-6 p-4 bg-yellow-900/20 rounded">
              <h3 className="font-semibold text-yellow-300 mb-2">Cultural Tips:</h3>
              <ul className="space-y-1">
                {currentScenario.context.cultural_notes?.map((note, i) => (
                  <li key={i} className="text-gray-300 text-sm">• {note}</li>
                ))}
              </ul>
            </div>
            
            {recordingError && (
              <div className="mb-4 p-3 bg-red-900/50 rounded text-red-300 text-sm">
                {recordingError}
              </div>
            )}
            
            <button
              onClick={handleStartConversation}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Start Conversation
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (pageState === 'conversation') {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
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
            
            <div className="mb-4 h-96 overflow-y-auto bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-center">
                {isConnected ? 'Start speaking to begin the conversation...' : 'Connecting...'}
              </div>
              {/* TODO: Add message display when we implement transcript tracking */}
            </div>
            
            {/* TODO: Add speaking indicator */}
            
            <button
              onClick={handleEndConversation}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              End Conversation
            </button>
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
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            ← Back to Dashboard
          </button>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-6">
              Conversation Results
            </h1>
            
            {analysisResults ? (
              <>
                <div className="mb-6 p-4 bg-green-900/30 rounded">
                  <h3 className="font-semibold text-green-300 mb-2">What You Did Well:</h3>
                  <ul className="space-y-1">
                    {(analysisResults.wins || []).map((win, i) => (
                      <li key={i} className="text-gray-300">✓ {win}</li>
                    ))}
                  </ul>
                </div>
                
                {analysisResults.mistakes && analysisResults.mistakes.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-900/30 rounded">
                    <h3 className="font-semibold text-yellow-300 mb-2">Areas to Improve:</h3>
                    <ul className="space-y-2">
                      {analysisResults.mistakes.map((mistake, i) => (
                        <li key={i} className="text-gray-300">
                          <span className="text-yellow-400">→</span> {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mb-6 p-4 bg-blue-900/30 rounded">
                  <h3 className="font-semibold text-blue-300 mb-2">Comprehension Score:</h3>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-700 rounded-full h-4 mr-4">
                      <div 
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ 
                          width: `${analysisResults.quality_assessment?.completeness ? 
                                    analysisResults.quality_assessment.completeness * 100 : 50}%` 
                        }}
                      />
                    </div>
                    <span className="text-white">
                      {Math.round((analysisResults.quality_assessment?.completeness || 0.5) * 100)}%
                    </span>
                  </div>
                </div>
                
                {analysisResults.recommendations.length > 0 && (
                  <div className="mb-6 p-4 bg-purple-900/30 rounded">
                    <h3 className="font-semibold text-purple-300 mb-2">Recommendations:</h3>
                    <ul className="space-y-1">
                      {analysisResults.recommendations.map((rec, i) => (
                        <li key={i} className="text-gray-300">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400 text-center py-8">
                Analysis results unavailable. Your conversation was still recorded for future review.
              </div>
            )}
            
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleTryAgain}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Try Again
              </button>
              <button
                onClick={handleNextScenario}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next Scenario
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}