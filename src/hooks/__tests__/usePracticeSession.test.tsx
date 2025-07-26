/**
 * Tests for usePracticeSession hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { usePracticeSession } from '../usePracticeSession';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenAIRealtime } from '../useOpenAIRealtime';
import { LanguageLearningDB } from '@/lib/language-learning-db';

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

jest.mock('../useConversationEngine', () => ({
  useConversationEngine: jest.fn(() => ({
    processTranscript: jest.fn(async (role, text) => ({ displayText: text })),
    resetSession: jest.fn(),
    sessionStats: { totalWords: 0, uniqueWords: 0 },
    lastComprehensionFeedback: null,
    getFullSpanishAnalysis: jest.fn(() => ({}))
  }))
}));

jest.mock('../usePracticeAdaptation', () => ({
  usePracticeAdaptation: jest.fn(() => ({
    resetAdaptation: jest.fn(),
    showAdaptationNotification: false,
    getAdaptationProgress: jest.fn(() => ({ level: 'beginner' }))
  }))
}));

jest.mock('../useTranscriptManager', () => ({
  useTranscriptManager: jest.fn(() => ({
    transcripts: [],
    currentSpeaker: null,
    conversationStartTime: null,
    addTranscript: jest.fn(),
    clearTranscripts: jest.fn(),
    setCurrentSpeaker: jest.fn()
  }))
}));

jest.mock('@/lib/language-learning-db', () => ({
  LanguageLearningDB: {
    createWithSupabase: jest.fn(() => ({
      profiles: {
        get: jest.fn(),
        update: jest.fn()
      },
      saveConversation: jest.fn(),
      progress: {
        update: jest.fn()
      }
    })),
    createWithLocalStorage: jest.fn(() => ({
      profiles: {
        get: jest.fn(),
        update: jest.fn()
      },
      saveConversation: jest.fn(),
      progress: {
        update: jest.fn()
      }
    }))
  }
}));

describe('usePracticeSession', () => {
  const mockPush = jest.fn();
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  
  const defaultOptions = {
    scenario: 'restaurant',
    npcName: 'María',
    npcDescription: 'A friendly waiter at a Mexican restaurant'
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
    
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });
    (useOpenAIRealtime as jest.Mock).mockReturnValue(mockOpenAIRealtimeReturn);
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

  describe('Database Integration', () => {
    it('should create Supabase DB for authenticated users', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      renderHook(() => usePracticeSession(defaultOptions));

      expect(LanguageLearningDB.createWithSupabase).toHaveBeenCalledWith({
        url: 'https://test.supabase.co',
        apiKey: 'test-key'
      });
    });

    it('should create localStorage DB for guest users', () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });

      renderHook(() => 
        usePracticeSession({
          ...defaultOptions,
          enableAuth: false
        })
      );

      expect(LanguageLearningDB.createWithLocalStorage).toHaveBeenCalled();
    });

    it('should load user adaptations on mount', async () => {
      const mockProfile = {
        level: 'intermediate',
        strugglingAreas: ['subjuntivo'],
        masteredConcepts: ['presente'],
        preferences: {
          culturalContext: true,
          supportLevel: 'moderate'
        }
      };

      const mockDB = {
        profiles: {
          get: jest.fn().mockResolvedValue(mockProfile),
          update: jest.fn()
        }
      };

      (LanguageLearningDB.createWithSupabase as jest.Mock).mockReturnValue(mockDB);

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      await waitFor(() => {
        expect(mockDB.profiles.get).toHaveBeenCalledWith('test-user-id', 'es');
      });

      await waitFor(() => {
        expect(result.current.learnerProfile).toEqual({
          level: 'intermediate',
          comfortWithSlang: true,
          needsMoreEnglish: false,
          strugglingWords: ['subjuntivo'],
          masteredPhrases: ['presente']
        });
      });
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
      const mockDB = {
        saveConversation: jest.fn().mockResolvedValue(undefined),
        progress: {
          update: jest.fn().mockResolvedValue(undefined)
        }
      };

      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        disconnect: mockDisconnect
      });

      (LanguageLearningDB.createWithSupabase as jest.Mock).mockReturnValue(mockDB);

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

      jest.requireMock('../useTranscriptManager').useTranscriptManager.mockReturnValue(mockTranscriptManager);

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      await act(async () => {
        await result.current.handleEndConversation();
      });

      expect(mockDisconnect).toHaveBeenCalled();
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.showSummary).toBe(true);

      expect(mockDB.saveConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('María'),
          persona: 'María',
          transcript: mockTranscriptManager.transcripts,
          duration: expect.any(Number),
          language: 'es',
          scenario: 'restaurant'
        }),
        { id: 'test-user-id', email: 'test-user-id' }
      );

      expect(mockDB.progress.update).toHaveBeenCalledWith(
        'test-user-id',
        'es',
        expect.objectContaining({
          totalMinutesPracticed: 1,
          conversationsCompleted: 1
        })
      );
    });

    it('should handle restart', () => {
      const mockClearTranscripts = jest.fn();
      const mockResetSession = jest.fn();
      const mockResetAdaptation = jest.fn();
      const mockStartFreshSession = jest.fn();

      jest.requireMock('../useTranscriptManager').useTranscriptManager.mockReturnValue({
        transcripts: [],
        currentSpeaker: null,
        conversationStartTime: null,
        addTranscript: jest.fn(),
        clearTranscripts: mockClearTranscripts,
        setCurrentSpeaker: jest.fn()
      });

      jest.requireMock('../useConversationEngine').useConversationEngine.mockReturnValue({
        processTranscript: jest.fn(),
        resetSession: mockResetSession,
        sessionStats: {},
        lastComprehensionFeedback: null,
        getFullSpanishAnalysis: jest.fn()
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

      expect(mockClearTranscripts).toHaveBeenCalled();
      expect(mockResetSession).toHaveBeenCalled();
      expect(mockResetAdaptation).toHaveBeenCalled();
      expect(mockStartFreshSession).toHaveBeenCalled();
    });

    it('should handle close summary', async () => {
      const mockDisconnect = jest.fn();
      const mockDB = {
        saveConversation: jest.fn().mockResolvedValue({ id: 'test-id' }),
        progress: {
          update: jest.fn().mockResolvedValue(undefined)
        }
      };

      (useOpenAIRealtime as jest.Mock).mockReturnValue({
        ...mockOpenAIRealtimeReturn,
        disconnect: mockDisconnect
      });

      (LanguageLearningDB.createWithSupabase as jest.Mock).mockReturnValue(mockDB);

      const mockTranscriptManager = {
        transcripts: [{ role: 'user', text: 'Test' }],
        currentSpeaker: null,
        conversationStartTime: new Date(),
        addTranscript: jest.fn(),
        clearTranscripts: jest.fn(),
        setCurrentSpeaker: jest.fn()
      };

      jest.requireMock('../useTranscriptManager').useTranscriptManager.mockReturnValue(mockTranscriptManager);

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
      const mockDB = {
        saveConversation: jest.fn().mockRejectedValue(new Error('Save failed')),
        progress: {
          update: jest.fn()
        }
      };

      (LanguageLearningDB.createWithSupabase as jest.Mock).mockReturnValue(mockDB);

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

      jest.requireMock('../useTranscriptManager').useTranscriptManager.mockReturnValue(mockTranscriptManager);

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      await act(async () => {
        await result.current.handleEndConversation();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[usePracticeSession] Failed to save conversation:',
        expect.any(Error)
      );

      expect(alertSpy).toHaveBeenCalledWith(
        'Session completed but analysis failed. Please try again.'
      );

      expect(result.current.isAnalyzing).toBe(false);

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle profile load failure', async () => {
      const mockDB = {
        profiles: {
          get: jest.fn().mockRejectedValue(new Error('Load failed')),
          update: jest.fn()
        }
      };

      (LanguageLearningDB.createWithSupabase as jest.Mock).mockReturnValue(mockDB);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => usePracticeSession(defaultOptions));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[usePracticeSession] Failed to load adaptations:',
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
      const mockDB = {
        profiles: {
          get: jest.fn(),
          update: jest.fn().mockResolvedValue(undefined)
        }
      };

      (LanguageLearningDB.createWithSupabase as jest.Mock).mockReturnValue(mockDB);

      const { result } = renderHook(() => usePracticeSession(defaultOptions));

      const newProfile = {
        level: 'intermediate' as const,
        comfortWithSlang: true,
        needsMoreEnglish: false,
        strugglingWords: ['subjuntivo'],
        masteredPhrases: ['saludos', 'despedidas']
      };

      // Simulate profile update through conversation engine
      const mockConversationEngine = jest.requireMock('../useConversationEngine').useConversationEngine;
      const onProfileUpdate = mockConversationEngine.mock.calls[0][0].onProfileUpdate;
      const onSaveProfile = mockConversationEngine.mock.calls[0][0].onSaveProfile;

      act(() => {
        onProfileUpdate(newProfile);
      });

      await act(async () => {
        await onSaveProfile(newProfile);
      });

      expect(mockDB.profiles.update).toHaveBeenCalledWith(
        'test-user-id',
        'es',
        {
          level: 'intermediate',
          strugglingAreas: ['subjuntivo'],
          masteredConcepts: ['saludos', 'despedidas'],
          preferences: {
            learningStyle: 'mixed',
            pace: 'normal',
            supportLevel: 'moderate',
            culturalContext: true
          }
        }
      );
    });
  });
});