/**
 * Tests for useMultiDestinationSession hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMultiDestinationSession, useAdventureSession } from '../useMultiDestinationSession';
import { usePracticeSession } from '../usePracticeSession';
import * as NPCSystem from '@/lib/npc-system';
import { NPC, NPCLoadResult } from '@/lib/npc-system/types';

// Mock dependencies
jest.mock('../usePracticeSession');
jest.mock('@/lib/npc-system', () => ({
  getNPC: jest.fn(),
  buildPrompt: jest.fn(),
  addScenarioContext: jest.fn(),
  getAllNPCs: jest.fn()
}));

describe('useMultiDestinationSession', () => {
  const mockNPC: NPC = {
    id: 'maria-taco-vendor',
    name: 'María',
    role: 'Taco Vendor',
    persona_prompt: 'You are María, a taco vendor.',
    backstory: 'Selling tacos for 20 years.',
    scenario_type: 'taco_vendor'
  };

  const mockNPCLoadResult: NPCLoadResult = {
    destination: {
      id: 'mexico-city',
      city: 'Mexico City',
      description: 'Capital of Mexico',
      npcs: [mockNPC]
    },
    npc: mockNPC
  };

  const mockPracticeSessionReturn = {
    isConnected: false,
    isConnecting: false,
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    transcripts: [],
    currentSpeaker: null,
    conversationStartTime: null,
    isAnalyzing: false,
    showSummary: false,
    handleEndConversation: jest.fn(),
    handleRestart: jest.fn(),
    handleCloseSummary: jest.fn(),
    sessionStats: {},
    lastComprehensionFeedback: null,
    getFullSpanishAnalysis: jest.fn(),
    costs: null,
    learnerProfile: {
      level: 'beginner' as const,
      comfortWithSlang: false,
      needsMoreEnglish: true,
      strugglingWords: [],
      masteredPhrases: []
    },
    showAdaptationNotification: false,
    adaptationProgress: null,
    audioRef: { current: null },
    showTimeWarning: false,
    timeWarningMinutes: 0,
    showSessionComplete: false,
    showMaxSessions: false,
    sessionInfo: null,
    extendSession: jest.fn(),
    dismissWarning: jest.fn(),
    handleSessionContinue: jest.fn(),
    startFreshSession: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePracticeSession as jest.Mock).mockReturnValue(mockPracticeSessionReturn);
    (NPCSystem.getNPC as jest.Mock).mockResolvedValue(mockNPCLoadResult);
    (NPCSystem.buildPrompt as jest.Mock).mockReturnValue('Built prompt');
    (NPCSystem.addScenarioContext as jest.Mock).mockReturnValue('Prompt with scenario');
  });

  describe('NPC Loading', () => {
    it('should load NPC on mount', async () => {
      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor'
        })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.npc).toBe(null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(NPCSystem.getNPC).toHaveBeenCalledWith('mexico-city', 'maria-taco-vendor');
      expect(result.current.npc).toEqual(mockNPC);
      expect(result.current.error).toBe(null);
    });

    it('should handle NPC not found', async () => {
      (NPCSystem.getNPC as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'non-existent'
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.npc).toBe(null);
      expect(result.current.error).toBe('NPC non-existent not found in mexico-city');
    });

    it('should handle loading error', async () => {
      (NPCSystem.getNPC as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor'
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load NPC: Error: Network error');
    });
  });

  describe('Prompt Building', () => {
    it('should build prompt with NPC data', async () => {
      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor'
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(NPCSystem.buildPrompt).toHaveBeenCalledWith({
        npc: mockNPC,
        learnerProfile: undefined,
        supportLevel: 'MODERATE_SUPPORT'
      });

      expect(NPCSystem.addScenarioContext).toHaveBeenCalledWith('Built prompt', 'taco_vendor');
    });

    it('should use initial profile for prompt building', async () => {
      const initialProfile = {
        level: 'intermediate' as const,
        comfortWithSlang: true
      };

      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor',
          initialProfile
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(NPCSystem.buildPrompt).toHaveBeenCalledWith({
        npc: mockNPC,
        learnerProfile: initialProfile,
        supportLevel: 'MODERATE_SUPPORT'
      });
    });

    it('should handle NPC without scenario type', async () => {
      const npcWithoutScenario = { ...mockNPC, scenario_type: undefined };
      (NPCSystem.getNPC as jest.Mock).mockResolvedValue({
        ...mockNPCLoadResult,
        npc: npcWithoutScenario
      });

      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor'
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(NPCSystem.addScenarioContext).not.toHaveBeenCalled();
    });
  });

  describe('Practice Session Integration', () => {
    it('should pass correct parameters to usePracticeSession', async () => {
      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor',
          enableAuth: false,
          enableAdaptation: false,
          enableAnalysis: false,
          autoConnect: true
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(usePracticeSession).toHaveBeenCalledWith({
        scenario: 'taco_vendor',
        npcName: 'María',
        npcDescription: 'Selling tacos for 20 years.',
        enableAuth: false,
        enableAdaptation: false,
        enableAnalysis: false,
        autoConnect: true,
        initialProfile: undefined,
        customInstructions: expect.any(Function)
      });
    });

    it('should provide custom instructions function', async () => {
      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor'
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Get the custom instructions function from the most recent call
      const calls = (usePracticeSession as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      const customInstructions = lastCall.customInstructions;

      // Ensure it's a function
      expect(typeof customInstructions).toBe('function');

      // Test with different profiles
      const beginnerProfile = {
        level: 'beginner' as const,
        comfortWithSlang: false,
        needsMoreEnglish: true,
        strugglingWords: [],
        masteredPhrases: []
      };

      const advancedProfile = {
        level: 'advanced' as const,
        comfortWithSlang: true,
        needsMoreEnglish: false,
        strugglingWords: [],
        masteredPhrases: []
      };

      // Clear previous calls
      (NPCSystem.buildPrompt as jest.Mock).mockClear();

      // Test beginner profile
      customInstructions(beginnerProfile);
      expect(NPCSystem.buildPrompt).toHaveBeenCalledWith({
        npc: mockNPC,
        learnerProfile: beginnerProfile,
        supportLevel: 'HEAVY_SUPPORT'
      });

      // Test advanced profile
      customInstructions(advancedProfile);
      expect(NPCSystem.buildPrompt).toHaveBeenCalledWith({
        npc: mockNPC,
        learnerProfile: advancedProfile,
        supportLevel: 'MODERATE_SUPPORT'
      });
    });

    it('should return all practice session methods', async () => {
      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor'
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that all practice session methods are available
      expect(result.current.connect).toBe(mockPracticeSessionReturn.connect);
      expect(result.current.disconnect).toBe(mockPracticeSessionReturn.disconnect);
      expect(result.current.handleEndConversation).toBe(mockPracticeSessionReturn.handleEndConversation);
      expect(result.current.transcripts).toBe(mockPracticeSessionReturn.transcripts);
      expect(result.current.learnerProfile).toBe(mockPracticeSessionReturn.learnerProfile);
    });
  });

  describe('Loading States', () => {
    it('should handle loading state correctly', async () => {
      let resolveGetNPC: (value: any) => void;
      const getNPCPromise = new Promise((resolve) => {
        resolveGetNPC = resolve;
      });

      (NPCSystem.getNPC as jest.Mock).mockReturnValue(getNPCPromise);

      const { result } = renderHook(() => 
        useMultiDestinationSession({
          destinationId: 'mexico-city',
          npcId: 'maria-taco-vendor'
        })
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.npc).toBe(null);
      expect(result.current.error).toBe(null);

      // Resolve the promise
      act(() => {
        resolveGetNPC!(mockNPCLoadResult);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.npc).toEqual(mockNPC);
    });
  });
});

describe('useAdventureSession', () => {
  const mockNPCs: NPC[] = [
    {
      id: 'npc1',
      name: 'NPC 1',
      role: 'Role 1',
      persona_prompt: 'Prompt 1',
      backstory: 'Story 1',
      order: 1
    },
    {
      id: 'npc2',
      name: 'NPC 2',
      role: 'Role 2',
      persona_prompt: 'Prompt 2',
      backstory: 'Story 2',
      order: 2
    },
    {
      id: 'npc3',
      name: 'NPC 3',
      role: 'Role 3',
      persona_prompt: 'Prompt 3',
      backstory: 'Story 3',
      order: 3
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (NPCSystem.getAllNPCs as jest.Mock).mockResolvedValue(mockNPCs);
    (NPCSystem.getNPC as jest.Mock).mockImplementation(async (destId, npcId) => {
      const npc = mockNPCs.find(n => n.id === npcId);
      return npc ? {
        destination: { id: destId, city: 'Test', description: 'Test', npcs: mockNPCs },
        npc
      } : null;
    });
  });

  describe('Adventure Mode', () => {
    it('should load all NPCs for destination', async () => {
      const { result } = renderHook(() => 
        useAdventureSession('mexico-city')
      );

      await waitFor(() => {
        expect(result.current.adventureNpcs).toHaveLength(3);
      });

      expect(NPCSystem.getAllNPCs).toHaveBeenCalledWith('mexico-city');
      expect(result.current.adventureNpcs).toEqual(mockNPCs);
    });

    it('should start with first NPC', async () => {
      const { result } = renderHook(() => 
        useAdventureSession('mexico-city')
      );

      await waitFor(() => {
        expect(result.current.npc).not.toBeNull();
      });

      expect(result.current.currentNpcIndex).toBe(0);
      expect(result.current.npc?.id).toBe('npc1');
      expect(result.current.isFirstNpc).toBe(true);
      expect(result.current.isLastNpc).toBe(false);
    });

    it('should navigate to next NPC', async () => {
      const { result } = renderHook(() => 
        useAdventureSession('mexico-city')
      );

      await waitFor(() => {
        expect(result.current.npc).not.toBeNull();
      });

      // Store initial NPC for verification
      const firstNpcId = result.current.npc?.id;
      expect(firstNpcId).toBe('npc1');

      act(() => {
        result.current.goToNextNpc();
      });

      // Wait for all state updates to complete
      await waitFor(() => {
        expect(result.current.currentNpcIndex).toBe(1);
        expect(result.current.npc?.id).toBe('npc2');
      });

      expect(result.current.completedNpcs).toContain('npc1');
      expect(result.current.isFirstNpc).toBe(false);
      expect(result.current.isLastNpc).toBe(false);
    });

    it('should navigate to previous NPC', async () => {
      const { result } = renderHook(() => 
        useAdventureSession('mexico-city')
      );

      await waitFor(() => {
        expect(result.current.npc).not.toBeNull();
      });

      // Go to second NPC first
      act(() => {
        result.current.goToNextNpc();
      });

      await waitFor(() => {
        expect(result.current.currentNpcIndex).toBe(1);
        expect(result.current.npc?.id).toBe('npc2');
      });

      // Go back
      act(() => {
        result.current.goToPreviousNpc();
      });

      await waitFor(() => {
        expect(result.current.currentNpcIndex).toBe(0);
        expect(result.current.npc?.id).toBe('npc1');
      });
    });

    it('should navigate to specific NPC', async () => {
      const { result } = renderHook(() => 
        useAdventureSession('mexico-city')
      );

      await waitFor(() => {
        expect(result.current.npc).not.toBeNull();
      });

      act(() => {
        result.current.goToNpc(2);
      });

      await waitFor(() => {
        expect(result.current.currentNpcIndex).toBe(2);
        expect(result.current.npc?.id).toBe('npc3');
      });

      expect(result.current.isLastNpc).toBe(true);
    });

    it('should calculate progress correctly', async () => {
      const { result } = renderHook(() => 
        useAdventureSession('mexico-city')
      );

      await waitFor(() => {
        expect(result.current.npc).not.toBeNull();
      });

      expect(result.current.progress).toBeCloseTo(1/3);

      act(() => {
        result.current.goToNextNpc();
      });

      await waitFor(() => {
        expect(result.current.progress).toBeCloseTo(2/3);
      });

      act(() => {
        result.current.goToNextNpc();
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(1);
      });
    });

    it('should not navigate beyond bounds', async () => {
      const { result } = renderHook(() => 
        useAdventureSession('mexico-city')
      );

      await waitFor(() => {
        expect(result.current.npc).not.toBeNull();
      });

      // Try to go before first
      act(() => {
        result.current.goToPreviousNpc();
      });

      expect(result.current.currentNpcIndex).toBe(0);

      // Go to last
      act(() => {
        result.current.goToNpc(2);
      });

      await waitFor(() => {
        expect(result.current.currentNpcIndex).toBe(2);
      });

      // Try to go beyond last
      act(() => {
        result.current.goToNextNpc();
      });

      expect(result.current.currentNpcIndex).toBe(2);
    });

    it('should handle empty NPC list', async () => {
      (NPCSystem.getAllNPCs as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => 
        useAdventureSession('mexico-city')
      );

      await waitFor(() => {
        expect(result.current.adventureNpcs).toEqual([]);
      });

      expect(result.current.progress).toBe(0);
      expect(result.current.npc).toBeNull();
    });

    it('should pass options to useMultiDestinationSession', async () => {
      const options = {
        enableAuth: false,
        enableAdaptation: false,
        autoConnect: true
      };

      renderHook(() => 
        useAdventureSession('mexico-city', options)
      );

      await waitFor(() => {
        expect(usePracticeSession).toHaveBeenCalled();
      });

      expect(usePracticeSession).toHaveBeenCalledWith(
        expect.objectContaining({
          enableAuth: false,
          enableAdaptation: false,
          autoConnect: true
        })
      );
    });
  });
});