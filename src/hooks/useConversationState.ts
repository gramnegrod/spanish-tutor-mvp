/**
 * useConversationState Hook
 * 
 * Combined hook that merges transcript management and conversation engine functionality.
 * This reduces duplicate state and provides a unified interface for conversation handling.
 * 
 * Consolidates:
 * - useTranscriptManager (transcript array, speaker state, timing)
 * - useConversationEngine (analysis, stats, feedback, Spanish processing)
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { ConversationTranscript } from '@/types'
import { detectComprehension, extractHiddenAnalysis, updateProfileFromAnalysis, LearnerProfile } from '@/lib/pedagogical-system'
import { 
  createAnalyzerFromProfile, 
  analyzeSpanishText, 
  checkEssentialVocabulary,
  type ConversationTurn,
  type AnalysisContext,
  type SpanishConversationAnalysis,
  type VocabularyAnalysisResult,
  type StruggleAnalysisResult,
  SpanishConversationAnalyzer
} from '@/lib/spanish-analysis'

// Re-export types from the original hooks
export interface SessionStats {
  totalResponses: number;
  goodResponses: number;
  strugglingResponses: number;
  averageConfidence: number;
  improvementTrend: 'improving' | 'declining' | 'neutral';
  streakCount: number;
  lastFewConfidences: number[];
  // Enhanced Spanish stats
  spanishWordsUsed: number;
  mexicanExpressionsUsed: number;
  essentialVocabCoverage: number;
  grammarAccuracy: number;
}

export interface ComprehensionFeedback {
  level: 'excellent' | 'good' | 'struggling' | 'confused';
  message: string;
  confidence: number;
  timestamp: Date;
  // Enhanced feedback
  spanishWords?: string[];
  mexicanExpressions?: string[];
  culturalNotes?: string[];
}

export interface ConversationStateOptions {
  learnerProfile: LearnerProfile;
  onProfileUpdate: (profile: LearnerProfile) => void;
  onSaveProfile?: (profile: LearnerProfile) => Promise<void>;
  scenario?: string;
}

export interface DatabaseAnalysis {
  vocabularyAnalysis: VocabularyAnalysisResult;
  struggleAnalysis: StruggleAnalysisResult;
}

export interface UseConversationStateReturn {
  // Combined transcript and conversation state
  transcripts: ConversationTranscript[];
  currentSpeaker: string | null;
  conversationStartTime: Date | null;
  sessionStats: SessionStats;
  lastComprehensionFeedback: ComprehensionFeedback | null;
  conversationHistory: ConversationTurn[];
  currentSpanishAnalysis: SpanishConversationAnalysis | null;
  
  // Combined methods
  addTranscript: (role: 'user' | 'assistant', text: string) => Promise<void>;
  clearConversation: () => void;
  setCurrentSpeaker: (speaker: string | null) => void;
  getFullSpanishAnalysis: () => SpanishConversationAnalysis | null;
  getDatabaseAnalysis: () => DatabaseAnalysis | null;
  
  // Spanish analyzer instance
  spanishAnalyzer: SpanishConversationAnalyzer;
}

export function useConversationState(options: ConversationStateOptions): UseConversationStateReturn {
  const { learnerProfile, onProfileUpdate, onSaveProfile, scenario = 'taco_vendor' } = options;


  // === COMBINED STATE ===
  // From useTranscriptManager
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null);
  
  // From useConversationEngine  
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [currentSpanishAnalysis, setCurrentSpanishAnalysis] = useState<SpanishConversationAnalysis | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
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
  });
  const [lastComprehensionFeedback, setLastComprehensionFeedback] = useState<ComprehensionFeedback | null>(null);

  // Create Spanish analyzer based on learner profile
  const spanishAnalyzer = useMemo(() => 
    createAnalyzerFromProfile(learnerProfile, scenario), 
    [learnerProfile, scenario]
  );

  // === COMBINED METHODS ===
  
  /**
   * Combined addTranscript method that handles both transcript storage and conversation analysis
   */
  const addTranscript = useCallback(async (role: 'user' | 'assistant', text: string) => {
    console.log('[ConversationState] Processing transcript:', { role, text: text.substring(0, 50) + '...' });
    
    // Create transcript entry (from useTranscriptManager logic)
    const newTranscript: ConversationTranscript = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      speaker: role,
      text,
      timestamp: new Date()
    };

    // Update transcripts array and set conversation start time
    setTranscripts(prev => {
      if (prev.length === 0) {
        setConversationStartTime(new Date());
      }
      return [...prev, newTranscript];
    });

    // Briefly show current speaker (from useTranscriptManager logic)
    setCurrentSpeaker(role);
    setTimeout(() => setCurrentSpeaker(null), 1000);

    // Process conversation analysis (from useConversationEngine logic)
    let displayText = text;
    let updatedProfile = { ...learnerProfile };
    
    // Process assistant responses for hidden analysis and vocabulary tracking
    if (role === 'assistant') {
      const { cleanText, analysis } = extractHiddenAnalysis(text);
      displayText = cleanText;
      
      // Update the transcript with clean text
      setTranscripts(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], text: cleanText };
        return updated;
      });
      
      // Add to conversation history for Spanish analysis
      const newTurn: ConversationTurn = {
        role: 'assistant',
        text: cleanText,
        timestamp: new Date().toISOString()
      };
      setConversationHistory(prev => [...prev, newTurn]);
      
      // Track Spanish vocabulary heard from AI
      const aiSpanishAnalysis = analyzeSpanishText(cleanText, scenario, learnerProfile.level as any);
      console.log('[ConversationState] AI Spanish vocabulary:', {
        spanishWords: aiSpanishAnalysis.spanishWords,
        mexicanExpressions: aiSpanishAnalysis.mexicanExpressions
      });
      
      if (analysis) {
        console.log('[ConversationState] Hidden analysis extracted:', analysis);
        updatedProfile = updateProfileFromAnalysis(learnerProfile, analysis);
        onProfileUpdate(updatedProfile);
        
        if (onSaveProfile) {
          // Non-blocking save to prevent audio interruption
          onSaveProfile(updatedProfile).catch(error => {
            console.warn('[ConversationState] Profile save failed (non-critical):', error);
            // Continue conversation despite save failure
          });
        }
      }
    }
    
    // Enhanced Spanish analysis for user speech
    if (role === 'user') {
      if (!text || text.trim().length === 0) {
        console.log('[ConversationState] Empty user transcript, skipping analysis');
        return;
      }
      
      // Add to conversation history
      const newTurn: ConversationTurn = {
        role: 'user',
        text,
        timestamp: new Date().toISOString()
      };
      setConversationHistory(prev => [...prev, newTurn]);
      
      // Perform comprehension analysis
      const { understood, confidence, indicators } = detectComprehension(text);
      console.log('[ConversationState] Basic comprehension analysis:', { understood, confidence, indicators, text });
      
      // Enhanced Spanish analysis
      const quickAnalysis = analyzeSpanishText(text, scenario, learnerProfile.level as any);
      
      // Check essential vocabulary against ENTIRE conversation
      const allUserText = conversationHistory
        .filter(turn => turn.role === 'user')
        .map(turn => turn.text)
        .join(' ') + ' ' + text;
      
      const essentialCheck = checkEssentialVocabulary(allUserText, scenario);
      
      // Update profile with enhanced vocabulary analysis
      const newMasteredPhrases = [...new Set([
        ...updatedProfile.masteredPhrases,
        ...quickAnalysis.spanishWords.filter(word => confidence > 0.6),
        ...essentialCheck.used
      ])];
      
      const newStrugglingWords = [...new Set([
        ...updatedProfile.strugglingWords,
        ...(!understood && indicators.length > 0 ? indicators : []),
        ...essentialCheck.missing.slice(0, 3)
      ])];
      
      updatedProfile = {
        ...updatedProfile,
        strugglingWords: newStrugglingWords,
        masteredPhrases: newMasteredPhrases
      };
      onProfileUpdate(updatedProfile);
      
      // Update session statistics
      setSessionStats(prev => {
        const newStats = { ...prev };
        newStats.totalResponses += 1;
        newStats.spanishWordsUsed += quickAnalysis.spanishWords.length;
        newStats.mexicanExpressionsUsed += quickAnalysis.mexicanExpressions.length;
        newStats.essentialVocabCoverage = essentialCheck.coverage;
        newStats.grammarAccuracy = confidence;
        
        if (confidence > 0.6) {
          newStats.goodResponses += 1;
          newStats.streakCount = (newStats.streakCount || 0) + 1;
        } else {
          newStats.strugglingResponses += 1;
          newStats.streakCount = 0;
        }
        
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
        
        return newStats;
      });
      
      // Generate enhanced real-time feedback
      const feedbackLevel = confidence > 0.8 ? 'excellent' : 
                            confidence > 0.6 ? 'good' : 
                            confidence > 0.3 ? 'struggling' : 'confused';
      
      let feedbackMessage = '';
      if (quickAnalysis.mexicanExpressions.length > 0) {
        feedbackMessage = confidence > 0.8 ? '¡Órale! Excellent Mexican Spanish!' :
                         confidence > 0.6 ? '¡Muy bien! Great cultural expressions!' :
                         'Good effort with Mexican expressions!';
      } else if (quickAnalysis.spanishWords.length >= 3) {
        feedbackMessage = confidence > 0.8 ? '¡Excelente! Great Spanish vocabulary!' :
                         confidence > 0.6 ? 'Good Spanish usage! Keep it up!' :
                         'Nice Spanish words, keep practicing!';
      } else {
        feedbackMessage = confidence > 0.8 ? 'Excellent communication!' :
                         confidence > 0.6 ? 'Good job! Try more Spanish' :
                         confidence > 0.3 ? 'Keep trying - add more Spanish!' :
                         'Don\'t worry, let\'s practice together';
      }
      
      const culturalNotes = quickAnalysis.mexicanExpressions.map(expr => {
        const notes: Record<string, string> = {
          'órale': 'Great use of "órale" - very Mexican!',
          'güero': 'Nice! "Güero" shows cultural awareness',
          'chido': '"Chido" is perfect Mexican slang!',
          'sale': '"Sale" is how Mexicans say "okay"!'
        };
        return notes[expr] || `"${expr}" is authentic Mexican Spanish!`;
      });
      
      const feedback: ComprehensionFeedback = {
        level: feedbackLevel,
        message: feedbackMessage,
        confidence,
        timestamp: new Date(),
        spanishWords: quickAnalysis.spanishWords,
        mexicanExpressions: quickAnalysis.mexicanExpressions,
        culturalNotes
      };
      
      setLastComprehensionFeedback(feedback);
      setTimeout(() => setLastComprehensionFeedback(null), 3000);
      
      if (onSaveProfile) {
        // Non-blocking save to prevent audio interruption
        onSaveProfile(updatedProfile).catch(error => {
          console.warn('[ConversationState] Profile save failed after user speech (non-critical):', error);
          // Continue conversation despite save failure
        });
      }
    }
  }, [learnerProfile, conversationHistory, onProfileUpdate, onSaveProfile, scenario]);

  /**
   * Combined clear method that resets both transcript and conversation state
   */
  const clearConversation = useCallback(() => {
    // Clear transcript state
    setTranscripts([]);
    setCurrentSpeaker(null);
    setConversationStartTime(null);
    
    // Clear conversation engine state
    setSessionStats({
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
    });
    setLastComprehensionFeedback(null);
    setConversationHistory([]);
    setCurrentSpanishAnalysis(null);
  }, []);

  // Get full Spanish conversation analysis
  const getFullSpanishAnalysis = useCallback(() => {
    if (conversationHistory.length === 0) return null;
    
    const context: AnalysisContext = {
      scenario,
      learnerLevel: learnerProfile.level as any,
      conversationHistory,
      previousMastery: learnerProfile.masteredPhrases || [],
      strugglingAreas: learnerProfile.strugglingWords || []
    };
    
    return spanishAnalyzer.analyzeConversation(conversationHistory, context);
  }, [conversationHistory, scenario, learnerProfile, spanishAnalyzer]);
  
  // Get analysis for database storage
  const getDatabaseAnalysis = useCallback(() => {
    const fullAnalysis = getFullSpanishAnalysis();
    if (!fullAnalysis) return null;
    
    return {
      vocabularyAnalysis: spanishAnalyzer.generateVocabularyAnalysis(fullAnalysis),
      struggleAnalysis: spanishAnalyzer.generateStruggleAnalysis(fullAnalysis)
    };
  }, [getFullSpanishAnalysis, spanishAnalyzer]);

  return {
    // Combined state
    transcripts,
    currentSpeaker,
    conversationStartTime,
    sessionStats,
    lastComprehensionFeedback,
    conversationHistory,
    currentSpanishAnalysis,
    
    // Combined methods
    addTranscript,
    clearConversation,
    setCurrentSpeaker,
    getFullSpanishAnalysis,
    getDatabaseAnalysis,
    
    // Spanish analyzer instance
    spanishAnalyzer
  };
}