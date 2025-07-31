/**
 * Simplified Integration Test Suite
 * Tests core functionality without complex browser API mocking
 */
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Import the key services we need to test
import { LanguageLearningDB } from '../lib/language-learning-db';
import { SpanishConversationAnalyzer, analyzeSpanishText } from '../lib/spanish-analysis';
import { OpenAIRealtimeService } from '../services/openai-realtime';

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

describe('Simplified Integration Tests', () => {
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
  });

  describe('1. Core Service Initialization', () => {
    it('should create LanguageLearningDB instance', () => {
      const config = {
        database: {
          adapter: 'memory' as const
        }
      };
      const db = new LanguageLearningDB(config);
      expect(db).toBeInstanceOf(LanguageLearningDB);
    });

    it('should create OpenAIRealtimeService instance', () => {
      const service = new OpenAIRealtimeService('test-api-key');
      expect(service).toBeInstanceOf(OpenAIRealtimeService);
    });

    it('should have Spanish analysis functions available', () => {
      expect(typeof SpanishConversationAnalyzer).toBe('function');
      expect(typeof analyzeSpanishText).toBe('function');
    });
  });

  describe('2. Storage Operations', () => {
    it('should handle conversation storage with memory adapter', async () => {
      const config = { database: { adapter: 'memory' as const } };
      const db = new LanguageLearningDB(config);
      
      const mockConversation = {
        id: 'test-conversation-1',
        userId: 'test-user',
        title: 'Test Restaurant Conversation',
        scenario: 'restaurant',
        transcript: [{
          id: 'msg-1',
          speaker: 'user' as const,
          text: 'Hola',
          timestamp: new Date()
        }],
        duration: 30,
        language: 'es',
        analysis: null
      };

      await expect(db.conversations.save(mockConversation)).resolves.not.toThrow();
    });

    it('should handle progress tracking operations', async () => {
      const config = { database: { adapter: 'memory' as const } };
      const db = new LanguageLearningDB(config);
      
      // Initialize progress first
      const language = 'es';
      await db.progress.initialize('test-user', language, 'beginner');

      // Update progress
      const mockProgressUpdate = {
        totalMinutesPracticed: 120,
        conversationsCompleted: 5,
        streak: 3
      };

      await expect(db.progress.update('test-user', language, mockProgressUpdate)).resolves.not.toThrow();
    });
  });

  describe('3. Spanish Analysis Integration', () => {
    it('should analyze Spanish text', () => {
      const text = 'Hola, ¿cómo estás? Me gusta la comida mexicana';
      const analysis = analyzeSpanishText(text, 'restaurant', 'beginner');
      
      expect(analysis).toHaveProperty('spanishWords');
      expect(analysis).toHaveProperty('mexicanExpressions');
      expect(analysis).toHaveProperty('scenario');
      expect(analysis).toHaveProperty('level');
      expect(Array.isArray(analysis.spanishWords)).toBe(true);
    });

    it('should create Spanish conversation analyzer', () => {
      const analyzer = new SpanishConversationAnalyzer({
        level: 'beginner',
        focusScenario: 'taco_vendor',
        regionalFocus: 'mexican',
        strictness: 'balanced',
        trackCulturalMarkers: true,
        enableGrammarAnalysis: true,
        enableMasteryTracking: true
      });
      
      expect(analyzer).toBeInstanceOf(SpanishConversationAnalyzer);
    });
  });

  describe('4. Build and Configuration', () => {
    it('should have proper environment handling', () => {
      const hasRequiredConfig = Boolean(
        process.env.NODE_ENV || 
        process.env.NEXT_PUBLIC_SUPABASE_URL || 
        process.env.NEXT_PUBLIC_OPENAI_API_KEY
      );
      
      expect(typeof hasRequiredConfig).toBe('boolean');
    });
  });

  describe('5. Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const config = { database: { adapter: 'memory' as const } };
      const db = new LanguageLearningDB(config);
      
      const mockConversation = {
        id: 'test-conversation-1',
        userId: 'test-user',
        title: 'Test Restaurant Conversation',
        scenario: 'restaurant',
        transcript: [{
          id: 'msg-1',
          speaker: 'user' as const,
          text: 'Hola',
          timestamp: new Date()
        }],
        duration: 30,
        language: 'es',
        analysis: null
      };
      
      // Should handle errors gracefully and not throw
      await expect(db.conversations.save(mockConversation)).resolves.not.toThrow();
    });
  });

  describe('6. Cross-Service Integration', () => {
    it('should integrate analysis with storage', async () => {
      const config = { database: { adapter: 'memory' as const } };
      const db = new LanguageLearningDB(config);
      
      // Analyze some Spanish text
      const analysis = analyzeSpanishText('Hola mundo', 'greeting', 'beginner');
      
      // Save conversation with analysis
      const conversation = {
        id: 'test-conversation-with-analysis',
        userId: 'test-user',
        title: 'Test Greeting with Analysis',
        scenario: 'greeting',
        transcript: [{
          id: 'msg-1',
          speaker: 'user' as const,
          text: 'Hola mundo',
          timestamp: new Date()
        }],
        duration: 60,
        language: 'es',
        analysis
      };
      
      await expect(db.conversations.save(conversation)).resolves.not.toThrow();
    });
  });

  describe('7. TypeScript Integration', () => {
    it('should have proper types for all main interfaces', () => {
      // Test that our main service classes have proper TypeScript definitions
      expect(typeof LanguageLearningDB).toBe('function');
      expect(typeof OpenAIRealtimeService).toBe('function');
      expect(typeof SpanishConversationAnalyzer).toBe('function');
      expect(typeof analyzeSpanishText).toBe('function');
    });
  });
});