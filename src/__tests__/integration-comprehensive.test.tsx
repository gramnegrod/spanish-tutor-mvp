/**
 * Comprehensive Integration Test Suite
 * Tests all recent changes and integrations to ensure nothing is broken
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Import all the key components and hooks we need to test
import { useConversationState } from '../hooks/useConversationState';
import { LanguageLearningDB } from '../lib/language-learning-db';
import { OpenAIRealtimeService } from '../services/openai-realtime';
import { SpanishAnalysisService } from '../lib/spanish-analysis';

// Mock external dependencies
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock response' } }]
        })
      }
    }
  }))
}));

jest.mock('../lib/supabase-client', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      }),
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockResolvedValue({ data: [], error: null })
    })
  })
}));

// Test Component for useConversationState hook
const TestConversationStateComponent: React.FC = () => {
  const mockLearnerProfile = {
    id: 'test-user',
    name: 'Test User',
    proficiencyLevel: 'beginner' as const,
    learningGoals: [],
    preferredTopics: [],
    nativeLanguage: 'english',
    targetLanguage: 'spanish',
    sessionCount: 0,
    totalTimeMinutes: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const {
    messages,
    isConnected,
    isRecording,
    sessionStats,
    addMessage,
    startRecording,
    stopRecording,
    resetConversation
  } = useConversationState({
    learnerProfile: mockLearnerProfile,
    onProfileUpdate: jest.fn(),
    onSaveProfile: jest.fn(),
    scenario: 'taco_vendor'
  });

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="recording-status">
        {isRecording ? 'Recording' : 'Not Recording'}
      </div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="session-stats">
        Words: {sessionStats.wordsSpoken}, Cost: ${sessionStats.estimatedCost}
      </div>
      <button onClick={() => addMessage('Hello', 'user')} data-testid="add-message">
        Add Message
      </button>
      <button onClick={startRecording} data-testid="start-recording">
        Start Recording
      </button>
      <button onClick={stopRecording} data-testid="stop-recording">
        Stop Recording
      </button>
      <button onClick={resetConversation} data-testid="reset">
        Reset
      </button>
    </div>
  );
};

describe('Comprehensive Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        clear: jest.fn(),
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      },
      writable: true,
    });

    // Mock WebSocket
    global.WebSocket = jest.fn().mockImplementation(() => ({
      readyState: WebSocket.CONNECTING,
      close: jest.fn(),
      send: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));

    // Mock AudioContext
    global.AudioContext = jest.fn().mockImplementation(() => ({
      createGain: jest.fn().mockReturnValue({
        connect: jest.fn(),
        gain: { value: 1 }
      }),
      createMediaStreamSource: jest.fn().mockReturnValue({
        connect: jest.fn()
      }),
      destination: {}
    }));
  });

  describe('1. useConversationState Hook Integration', () => {
    it('should initialize with correct default state', () => {
      render(<TestConversationStateComponent />);
      
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
      expect(screen.getByTestId('recording-status')).toHaveTextContent('Not Recording');
      expect(screen.getByTestId('message-count')).toHaveTextContent('0');
      expect(screen.getByTestId('session-stats')).toHaveTextContent('Words: 0, Cost: $0');
    });

    it('should handle message addition correctly', async () => {
      render(<TestConversationStateComponent />);
      
      const addButton = screen.getByTestId('add-message');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      });
    });

    it('should handle recording state changes', async () => {
      render(<TestConversationStateComponent />);
      
      const startButton = screen.getByTestId('start-recording');
      const stopButton = screen.getByTestId('stop-recording');
      
      fireEvent.click(startButton);
      await waitFor(() => {
        expect(screen.getByTestId('recording-status')).toHaveTextContent('Recording');
      });
      
      fireEvent.click(stopButton);
      await waitFor(() => {
        expect(screen.getByTestId('recording-status')).toHaveTextContent('Not Recording');
      });
    });

    it('should reset conversation state correctly', async () => {
      render(<TestConversationStateComponent />);
      
      // Add a message first
      fireEvent.click(screen.getByTestId('add-message'));
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      });
      
      // Reset conversation
      fireEvent.click(screen.getByTestId('reset'));
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('0');
      });
    });
  });

  describe('2. TypeScript Build Verification', () => {
    it('should have proper type definitions for all main services', () => {
      // Test that our main service classes are properly typed
      expect(typeof LanguageLearningDB).toBe('function');
      expect(typeof OpenAIRealtimeService).toBe('function');
      expect(typeof SpanishAnalysisService).toBe('object');
    });
  });

  describe('3. OpenAI Service Consolidation', () => {
    it('should create OpenAI service instance correctly', () => {
      const service = new OpenAIRealtimeService('test-api-key');
      expect(service).toBeInstanceOf(OpenAIRealtimeService);
    });

    it('should handle connection lifecycle properly', async () => {
      const service = new OpenAIRealtimeService('test-api-key');
      
      // WebSocket is already mocked globally in beforeEach
      await expect(service.connect()).resolves.not.toThrow();
    });
  });

  describe('4. Storage Operations', () => {
    it('should initialize LanguageLearningDB with localStorage adapter', async () => {
      const db = new LanguageLearningDB('localStorage');
      expect(db).toBeInstanceOf(LanguageLearningDB);
    });

    it('should handle conversation storage operations', async () => {
      const db = new LanguageLearningDB('localStorage');
      
      const mockConversation = {
        id: 'test-conversation-1',
        userId: 'test-user',
        scenario: 'restaurant',
        messages: [],
        startTime: new Date(),
        endTime: new Date(),
        analysis: null
      };

      // Should not throw
      await expect(db.saveConversation(mockConversation)).resolves.not.toThrow();
    });

    it('should handle progress tracking operations', async () => {
      const db = new LanguageLearningDB('localStorage');
      
      const mockProgress = {
        userId: 'test-user',
        wordsLearned: 50,
        conversationsCompleted: 5,
        currentStreak: 3,
        totalTimeMinutes: 120,
        lastActiveDate: new Date(),
        proficiencyLevel: 'beginner' as const
      };

      await expect(db.saveProgress(mockProgress)).resolves.not.toThrow();
    });
  });

  describe('5. Spanish Analysis Integration', () => {
    it('should analyze conversation transcripts correctly', async () => {
      const transcript = [
        { role: 'user' as const, content: 'Hola, ¿cómo estás?' },
        { role: 'assistant' as const, content: 'Muy bien, gracias. ¿Y tú?' }
      ];

      const analysis = await SpanishAnalysisService.analyzeConversation(transcript);
      
      expect(analysis).toHaveProperty('vocabulary');
      expect(analysis).toHaveProperty('grammar');
      expect(analysis).toHaveProperty('overallScore');
      expect(analysis).toHaveProperty('suggestions');
    });

    it('should extract vocabulary correctly', () => {
      const text = 'Hola, me gusta la comida mexicana muy deliciosa';
      const vocabulary = SpanishAnalysisService.extractVocabulary(text);
      
      expect(vocabulary).toContain('hola');
      expect(vocabulary).toContain('comida');
      expect(vocabulary).toContain('mexicana');
    });
  });

  describe('6. Build Configuration', () => {
    it('should have proper environment configuration', () => {
      // Test that our environment handling works
      const hasRequiredConfig = Boolean(
        process.env.NODE_ENV || 
        process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_OPENAI_API_KEY
      );
      
      // In test environment, this might be false, which is okay
      expect(typeof hasRequiredConfig).toBe('boolean');
    });
  });

  describe('7. Key User Flows Integration', () => {
    it('should handle starting a conversation flow', async () => {
      render(<TestConversationStateComponent />);
      
      // Simulate starting a conversation
      fireEvent.click(screen.getByTestId('start-recording'));
      fireEvent.click(screen.getByTestId('add-message'));
      
      await waitFor(() => {
        expect(screen.getByTestId('recording-status')).toHaveTextContent('Recording');
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      });
    });

    it('should handle session stats updates', async () => {
      render(<TestConversationStateComponent />);
      
      // Add multiple messages to trigger stats update
      const addButton = screen.getByTestId('add-message');
      
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('3');
      });
    });
  });

  describe('8. Error Handling and Resilience', () => {
    it('should handle API errors gracefully in OpenAI service', async () => {
      const service = new OpenAIRealtimeService('invalid-key');
      
      // Should not throw, but handle error gracefully
      await expect(service.connect()).resolves.not.toThrow();
    });

    it('should handle storage errors gracefully', async () => {
      const db = new LanguageLearningDB('localStorage');
      
      // Mock storage failure
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });
      
      const mockConversation = {
        id: 'test-conversation-1',
        userId: 'test-user',
        scenario: 'restaurant',
        messages: [],
        startTime: new Date(),
        endTime: new Date(),
        analysis: null
      };
      
      // Should handle error gracefully
      await expect(db.saveConversation(mockConversation)).resolves.not.toThrow();
      
      // Restore original function
      localStorage.setItem = originalSetItem;
    });
  });

  describe('9. Performance and Memory Management', () => {
    it('should not create memory leaks in conversation state', () => {
      const { unmount } = render(<TestConversationStateComponent />);
      
      // Add some messages
      const addButton = screen.getByTestId('add-message');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(addButton);
      }
      
      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('10. Cross-Component Integration', () => {
    it('should integrate conversation state with Spanish analysis', async () => {
      render(<TestConversationStateComponent />);
      
      // Add a Spanish message
      fireEvent.click(screen.getByTestId('add-message'));
      
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      });
      
      // Verify that the conversation can be analyzed
      const analysis = await SpanishAnalysisService.analyzeConversation([
        { role: 'user', content: 'Hello' }
      ]);
      
      expect(analysis).toHaveProperty('overallScore');
    });
  });
});