/**
 * Tests for usePracticeSession hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { usePracticeSession } from '../usePracticeSession';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenAIRealtime } from '../useOpenAIRealtime';
import { useNPCLoader } from '../useNPCLoader';
import { useSessionPersistence } from '../useSessionPersistence';
import { useSessionAnalytics } from '../useSessionAnalytics';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../useOpenAIRealtime', () => ({
  useOpenAIRealtime: jest.fn()
}));

// Mock new hooks
jest.mock('../useNPCLoader', () => ({
  useNPCLoader: jest.fn()
}));

jest.mock('../useSessionPersistence', () => ({
  useSessionPersistence: jest.fn()
}));

jest.mock('../useSessionAnalytics', () => ({
  useSessionAnalytics: jest.fn()
}));

// Mock for useConversationState - define default implementation
const mockAddTranscript = jest.fn(async (role, text) => {});
const mockClearConversation = jest.fn();
const mockSetCurrentSpeaker = jest.fn();
const mockGetFullSpanishAnalysis = jest.fn(() => ({}));
const mockGetDatabaseAnalysis = jest.fn(() => ({}));

jest.mock('../useConversationState', () => ({
  useConversationState: jest.fn((params) => ({
    // Combined state
    transcripts: [],
    currentSpeaker: null,
    conversationStartTime: null,
    sessionStats: { 
      totalResponses: 0,
      goodResponses: 0,
      strugglingResponses: 0,
      averageConfidence: 0,
      improvementTrend: 'neutral',
      streakCount: 0,
      lastFewConfidences: [],
      spanishWordsUsed: 0,
      mexicanExpressionsUsed: 0,
      essentialVocabCoverage: 0,
      grammarAccuracy: 0
    },
    lastComprehensionFeedback: null,
    conversationHistory: [],
    currentSpanishAnalysis: null,
    // Combined methods
    addTranscript: mockAddTranscript,
    clearConversation: mockClearConversation,
    setCurrentSpeaker: mockSetCurrentSpeaker,
    getFullSpanishAnalysis: mockGetFullSpanishAnalysis,
    getDatabaseAnalysis: mockGetDatabaseAnalysis,
    spanishAnalyzer: {}
  }))
}));

jest.mock('../usePracticeAdaptation', () => ({
  usePracticeAdaptation: jest.fn(() => ({
    resetAdaptation: jest.fn(),
    showAdaptationNotification: false,
    getAdaptationProgress: jest.fn(() => ({ level: 'beginner' }))
  }))
}));


describe('usePracticeSession', () => {
  const mockPush = jest.fn();
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  
  // Mock functions for new hooks
  const mockSaveSession = jest.fn();
  const mockLoadProfile = jest.fn();
  const mockSaveProfile = jest.fn();
  
  const defaultOptions = {
    scenario: 'restaurant',
    npcName: 'María',
    npcDescription: 'A friendly waiter at a Mexican restaurant',
    destinationId: 'mexico-city',
    npcId: 'maria'
  };

  const mockOpenAIRealtimeReturn = {
    isConnected: false,
    isConnecting: false,
    error: null,
    costs: null,
    showTimeWarning: false,
    timeWarningMinutes: 0,
    showSessionComplete: false,
    showMaxSessions: false,
    sessionInfo: null,
    extendSession: jest.fn(),
    handleSessionContinue: jest.fn(),
    startFreshSession: jest.fn(),
    dismissWarning: jest.fn(),
    updateInstructions: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    audioRef: { current: null }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mock functions
    mockAddTranscript.mockClear();
    mockClearConversation.mockClear();
    mockSetCurrentSpeaker.mockClear();
    mockGetFullSpanishAnalysis.mockClear();
    mockGetDatabaseAnalysis.mockClear();
    mockSaveSession.mockClear();
    mockLoadProfile.mockClear();
    mockSaveProfile.mockClear();
    
    // Reset mock return values
    mockGetFullSpanishAnalysis.mockReturnValue({});
    mockGetDatabaseAnalysis.mockReturnValue({});
    mockSaveSession.mockResolvedValue(undefined);
    mockLoadProfile.mockResolvedValue(null);
    mockSaveProfile.mockResolvedValue(undefined);
    
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });
    (useOpenAIRealtime as jest.Mock).mockReturnValue(mockOpenAIRealtimeReturn);
    
    // Mock new hooks
    (useNPCLoader as jest.Mock).mockReturnValue({
      npc: {
        id: 'maria',
        name: 'María',
        description: 'A friendly waiter at a Mexican restaurant',
        personality: 'friendly',
        culturalBackground: 'Mexico'
      },
      isLoading: false,
      error: null,
      customPrompt: 'You are María, a friendly waiter...'
    });
    
    (useSessionPersistence as jest.Mock).mockReturnValue({
      saveSession: mockSaveSession,
      loadProfile: mockLoadProfile,
      saveProfile: mockSaveProfile,
      isReady: true
    });
    
    (useSessionAnalytics as jest.Mock).mockReturnValue({
      sessionStats: {
        totalResponses: 0,
        goodResponses: 0,
        strugglingResponses: 0,
        averageConfidence: 0,
        improvementTrend: 'neutral',
        streakCount: 0,
        lastFewConfidences: [],
        spanishWordsUsed: 0,
        mexicanExpressionsUsed: 0,
        essentialVocabCoverage: 0,
        grammarAccuracy: 0,
        successRate: 0,
        vocabularyDiversity: 0,
        culturalEngagement: 0,
        isImproving: false
      },
      lastFeedback: null,
      trackEvent: jest.fn(),
      getAnalysis: jest.fn()
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.showSummary).toBe(false);
      expect(result.current.learnerProfile).toEqual({
        level: 'beginner',
        comfortWithSlang: false,
        needsMoreEnglish: true,
        strugglingWords: [],
        masteredPhrases: []
      });
    });

    it('should merge initial profile with defaults', () => {
      const initialProfile = {
        level: 'intermediate' as const,
        comfortWithSlang: true
      };

      const { result } = renderHook(() => 
        usePracticeSession({
          ...defaultOptions,
          initialProfile
        })
      );

      expect(result.current.learnerProfile).toEqual({
        level: 'intermediate',
        comfortWithSlang: true,
        needsMoreEnglish: true,
        strugglingWords: [],
        masteredPhrases: []
      });
    });

    it('should redirect to login when auth is enabled and no user', () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });

      renderHook(() => usePracticeSession(defaultOptions));

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should not redirect when auth is disabled', () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });

      renderHook(() => 
        usePracticeSession({
          ...defaultOptions,
          enableAuth: false
        })
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Hook Integration', () => {
    it('should initialize with new hooks', () => {
      renderHook(() => usePracticeSession(defaultOptions));

      expect(useNPCLoader).toHaveBeenCalledWith({
        destinationId: 'mexico-city',
        npcId: 'maria',
        learnerProfile: expect.objectContaining({
          level: 'beginner',
          comfortWithSlang: false,
          needsMoreEnglish: true
        }),
        scenario: 'restaurant'
      });
      
      expect(useSessionPersistence).toHaveBeenCalledWith({ enableAuth: true });
      expect(useSessionAnalytics).toHaveBeenCalled();
    });

    it('should load user profile on mount', async () => {
      const mockProfile = {
        level: 'intermediate' as const,
        comfortWithSlang: true,
        needsMoreEnglish: false,
        strugglingWords: ['subjuntivo'],
        masteredPhrases: ['presente']
      };

      mockLoadProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      await waitFor(() => {
        expect(mockLoadProfile).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.learnerProfile).toEqual(mockProfile);
      });
    });

    it('should use NPC data in return values', () => {
      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      expect(result.current.npc).toEqual({
        id: 'maria',
        name: 'María',
        description: 'A friendly waiter at a Mexican restaurant',
        personality: 'friendly',
        culturalBackground: 'Mexico'
      });
      expect(result.current.npcLoading).toBe(false);
      expect(result.current.npcError).toBeNull();
    });
  });

  describe('Connection Management', () => {
    it('should handle manual connection', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        connect: mockConnect
      });

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      await act(async () => {
        await result.current.connect();
      });

      expect(mockConnect).toHaveBeenCalled();
    });

    it('should prevent connection when auth required but no user', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
      const mockConnect = jest.fn();
      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        connect: mockConnect
      });

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      await act(async () => {
        await result.current.connect();
      });

      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('should handle disconnect', () => {
      const mockDisconnect = jest.fn();
      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        disconnect: mockDisconnect
      });

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      act(() => {
        result.current.disconnect();
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should auto-connect when specified', async () => {
      const mockConnect = jest.fn();
      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        connect: mockConnect
      });

      renderHook(() => 
        usePracticeSession({
          ...defaultOptions,
          autoConnect: true
        })
      );

      // Verify OpenAIRealtime was called with autoConnect: true
      expect(useOpenAIRealtime).toHaveBeenCalledWith(
        expect.objectContaining({
          autoConnect: true
        })
      );
    });
  });

  describe('Custom Instructions', () => {
    it('should use custom instructions when provided', () => {
      const customInstructions = jest.fn((profile) => `Custom prompt for ${profile.level}`);

      // Mock NPC loader to not provide a custom prompt so custom instructions are used
      (useNPCLoader as jest.Mock).mockReturnValue({
        npc: {
          id: 'maria',
          name: 'María',
          description: 'A friendly waiter at a Mexican restaurant',
          personality: 'friendly',
          culturalBackground: 'Mexico'
        },
        isLoading: false,
        error: null,
        customPrompt: null // No custom prompt from NPC
      });

      renderHook(() => 
        usePracticeSession({
          ...defaultOptions,
          customInstructions
        })
      );

      expect(customInstructions).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'beginner'
        })
      );

      expect(useOpenAIRealtime).toHaveBeenCalledWith(
        expect.objectContaining({
          instructions: 'Custom prompt for beginner'
        })
      );
    });

    it('should update instructions when profile changes', async () => {
      const mockUpdateInstructions = jest.fn();
      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        isConnected: true,
        updateInstructions: mockUpdateInstructions
      });

      const customInstructions = jest.fn((profile) => `Custom prompt for ${profile.level}`);

      const { rerender } = renderHook(
        (props) => usePracticeSession(props),
        {
          initialProps: {
            ...defaultOptions,
            customInstructions,
            initialProfile: { level: 'beginner' as const }
          }
        }
      );

      // Change to intermediate level
      rerender({
        ...defaultOptions,
        customInstructions,
        initialProfile: { level: 'intermediate' as const }
      });

      await waitFor(() => {
        expect(mockUpdateInstructions).toHaveBeenCalled();
      });
    });
  });

  describe('Session Management', () => {
    it('should handle end conversation', async () => {
      const mockDisconnect = jest.fn();

      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        disconnect: mockDisconnect
      });

      // Mock transcript data
      const mockTranscriptManager = {
        transcripts: [
          { role: 'user', text: 'Hola' },
          { role: 'assistant', text: 'Hola, bienvenido' }
        ],
        currentSpeaker: null,
        conversationStartTime: new Date(Date.now() - 60000), // 1 minute ago
        addTranscript: jest.fn(),
        clearTranscripts: jest.fn(),
        setCurrentSpeaker: jest.fn()
      };

      jest.requireMock('../useConversationState').useConversationState.mockReturnValue({
        ...mockTranscriptManager,
        sessionStats: { 
          totalResponses: 0,
          goodResponses: 0,
          strugglingResponses: 0,
          averageConfidence: 0,
          improvementTrend: 'neutral',
          streakCount: 0,
          lastFewConfidences: [],
          spanishWordsUsed: 0,
          mexicanExpressionsUsed: 0,
          essentialVocabCoverage: 0,
          grammarAccuracy: 0
        },
        lastComprehensionFeedback: null,
        conversationHistory: [],
        currentSpanishAnalysis: null,
        addTranscript: mockAddTranscript,
        clearConversation: mockTranscriptManager.clearTranscripts,
        setCurrentSpeaker: mockSetCurrentSpeaker,
        getFullSpanishAnalysis: mockGetFullSpanishAnalysis,
        getDatabaseAnalysis: mockGetDatabaseAnalysis,
        spanishAnalyzer: {}
      });

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      await act(async () => {
        await result.current.handleEndConversation();
      });

      expect(mockDisconnect).toHaveBeenCalled();
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.showSummary).toBe(true);

      expect(mockSaveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('María'),
          persona: 'María',
          transcript: [
            { id: undefined, speaker: undefined, text: 'Hola', timestamp: undefined },
            { id: undefined, speaker: undefined, text: 'Hola, bienvenido', timestamp: undefined }
          ],
          duration: expect.any(Number),
          language: 'es',
          scenario: 'restaurant'
        })
      );
    });

    it('should handle restart', () => {
      const mockResetAdaptation = jest.fn();
      const mockStartFreshSession = jest.fn();

      jest.requireMock('../useConversationState').useConversationState.mockReturnValue({
        transcripts: [],
        currentSpeaker: null,
        conversationStartTime: null,
        sessionStats: { 
          totalResponses: 0,
          goodResponses: 0,
          strugglingResponses: 0,
          averageConfidence: 0,
          improvementTrend: 'neutral',
          streakCount: 0,
          lastFewConfidences: [],
          spanishWordsUsed: 0,
          mexicanExpressionsUsed: 0,
          essentialVocabCoverage: 0,
          grammarAccuracy: 0
        },
        lastComprehensionFeedback: null,
        conversationHistory: [],
        currentSpanishAnalysis: null,
        addTranscript: mockAddTranscript,
        clearConversation: mockClearConversation,
        setCurrentSpeaker: mockSetCurrentSpeaker,
        getFullSpanishAnalysis: mockGetFullSpanishAnalysis,
        getDatabaseAnalysis: mockGetDatabaseAnalysis,
        spanishAnalyzer: {}
      });

      jest.requireMock('../usePracticeAdaptation').usePracticeAdaptation.mockReturnValue({
        resetAdaptation: mockResetAdaptation,
        showAdaptationNotification: false,
        getAdaptationProgress: jest.fn()
      });

      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        startFreshSession: mockStartFreshSession
      });

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      act(() => {
        result.current.handleRestart();
      });

      expect(mockClearConversation).toHaveBeenCalled();
      expect(mockResetAdaptation).toHaveBeenCalled();
      expect(mockStartFreshSession).toHaveBeenCalled();
    });

    it('should handle close summary', async () => {
      const mockDisconnect = jest.fn();
      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        disconnect: mockDisconnect
      });

      const mockTranscriptManager = {
        transcripts: [{ role: 'user', text: 'Test' }],
        currentSpeaker: null,
        conversationStartTime: new Date(),
        addTranscript: jest.fn(),
        clearTranscripts: jest.fn(),
        setCurrentSpeaker: jest.fn()
      };

      jest.requireMock('../useConversationState').useConversationState.mockReturnValue({
        ...mockTranscriptManager,
        sessionStats: { 
          totalResponses: 0,
          goodResponses: 0,
          strugglingResponses: 0,
          averageConfidence: 0,
          improvementTrend: 'neutral',
          streakCount: 0,
          lastFewConfidences: [],
          spanishWordsUsed: 0,
          mexicanExpressionsUsed: 0,
          essentialVocabCoverage: 0,
          grammarAccuracy: 0
        },
        lastComprehensionFeedback: null,
        conversationHistory: [],
        currentSpanishAnalysis: null,
        addTranscript: mockAddTranscript,
        clearConversation: mockTranscriptManager.clearTranscripts,
        setCurrentSpeaker: mockSetCurrentSpeaker,
        getFullSpanishAnalysis: mockGetFullSpanishAnalysis,
        getDatabaseAnalysis: mockGetDatabaseAnalysis,
        spanishAnalyzer: {}
      });

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      // First trigger end conversation to set showSummary to true
      await act(async () => {
        await result.current.handleEndConversation();
      });

      expect(result.current.showSummary).toBe(true);

      // Then close the summary
      act(() => {
        result.current.handleCloseSummary();
      });

      expect(result.current.showSummary).toBe(false);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Error Handling', () => {
    it('should handle conversation save failure gracefully', async () => {
      mockSaveSession.mockRejectedValue(new Error('Save failed'));

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockTranscriptManager = {
        transcripts: [{ role: 'user', text: 'Test' }],
        currentSpeaker: null,
        conversationStartTime: new Date(),
        addTranscript: jest.fn(),
        clearTranscripts: jest.fn(),
        setCurrentSpeaker: jest.fn()
      };

      jest.requireMock('../useConversationState').useConversationState.mockReturnValue({
        ...mockTranscriptManager,
        sessionStats: { 
          totalResponses: 0,
          goodResponses: 0,
          strugglingResponses: 0,
          averageConfidence: 0,
          improvementTrend: 'neutral',
          streakCount: 0,
          lastFewConfidences: [],
          spanishWordsUsed: 0,
          mexicanExpressionsUsed: 0,
          essentialVocabCoverage: 0,
          grammarAccuracy: 0
        },
        lastComprehensionFeedback: null,
        conversationHistory: [],
        currentSpanishAnalysis: null,
        addTranscript: mockAddTranscript,
        clearConversation: mockTranscriptManager.clearTranscripts,
        setCurrentSpeaker: mockSetCurrentSpeaker,
        getFullSpanishAnalysis: mockGetFullSpanishAnalysis,
        getDatabaseAnalysis: mockGetDatabaseAnalysis,
        spanishAnalyzer: {}
      });

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      await act(async () => {
        await result.current.handleEndConversation();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[usePracticeSession] Failed to save conversation:',
        expect.any(Error)
      );

      expect(alertSpy).toHaveBeenCalledWith(
        'Session completed but analysis failed: Save failed'
      );

      expect(result.current.isAnalyzing).toBe(false);

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle profile load failure', async () => {
      mockLoadProfile.mockRejectedValue(new Error('Load failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => usePracticeSession(defaultOptions));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[usePracticeSession] Failed to load profile:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Adaptation Features', () => {
    it('should disable adaptation when specified', () => {
      const mockAdaptation = {
        resetAdaptation: jest.fn(),
        showAdaptationNotification: false,
        getAdaptationProgress: jest.fn(() => null)
      };

      jest.requireMock('../usePracticeAdaptation').usePracticeAdaptation.mockReturnValue(mockAdaptation);

      const { result } = renderHook(() => 
        usePracticeSession({
          ...defaultOptions,
          enableAdaptation: false
        })
      );

      expect(result.current.adaptationProgress).toBe(null);
    });

    it('should save user adaptations', async () => {
      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      // Wait for the hook to initialize
      await waitFor(() => {
        expect(result.current.learnerProfile).toBeDefined();
      });

      // Get the callbacks that were passed to useConversationState
      const mockConversationState = jest.requireMock('../useConversationState').useConversationState;
      const lastCall = mockConversationState.mock.calls[mockConversationState.mock.calls.length - 1];
      const { onProfileUpdate, onSaveProfile } = lastCall[0];

      const newProfile = {
        level: 'intermediate' as const,
        comfortWithSlang: true,
        needsMoreEnglish: false,
        strugglingWords: ['subjuntivo'],
        masteredPhrases: ['saludos', 'despedidas']
      };

      // Update profile
      act(() => {
        onProfileUpdate(newProfile);
      });

      // Wait for state update
      await waitFor(() => {
        expect(result.current.learnerProfile).toEqual(newProfile);
      });

      // Save profile
      if (onSaveProfile) {
        await act(async () => {
          await onSaveProfile(newProfile);
        });

        expect(mockSaveProfile).toHaveBeenCalledWith(newProfile);
      }
    });
  });
});