/**
 * useConversationEngine Hook
 * 
 * Enhanced conversation processing with Spanish analysis module integration.
 * Handles:
 * - Advanced Spanish vocabulary analysis
 * - Cultural marker detection
 * - Grammar pattern recognition
 * - Hidden analysis extraction
 * - Profile updates with rich Spanish insights
 * - Session statistics
 */

import { useState, useCallback, useMemo } from 'react'
import { detectComprehension, extractHiddenAnalysis, updateProfileFromAnalysis, LearnerProfile } from '@/lib/pedagogical-system'
import { ConversationTranscript } from '@/types'
import { 
  createAnalyzerFromProfile, 
  analyzeSpanishText, 
  checkEssentialVocabulary,
  type ConversationTurn,
  type AnalysisContext,
  type SpanishConversationAnalysis 
} from '@/lib/spanish-analysis'

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

export interface ConversationEngineOptions {
  learnerProfile: LearnerProfile;
  onProfileUpdate: (profile: LearnerProfile) => void;
  onSaveProfile?: (profile: LearnerProfile) => Promise<void>;
  scenario?: string; // New: scenario context for analysis
}

export function useConversationEngine(options: ConversationEngineOptions) {
  const { learnerProfile, onProfileUpdate, onSaveProfile, scenario = 'taco_vendor' } = options;

  // Create Spanish analyzer based on learner profile
  const spanishAnalyzer = useMemo(() => 
    createAnalyzerFromProfile(learnerProfile, scenario), 
    [learnerProfile, scenario]
  );

  // Conversation history for Spanish analysis
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [currentSpanishAnalysis, setCurrentSpanishAnalysis] = useState<SpanishConversationAnalysis | null>(null);
  
  // Session statistics state
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalResponses: 0,
    goodResponses: 0,
    strugglingResponses: 0,
    averageConfidence: 0,
    improvementTrend: 'neutral',
    streakCount: 0,
    lastFewConfidences: [],
    // Enhanced Spanish stats
    spanishWordsUsed: 0,
    mexicanExpressionsUsed: 0,
    essentialVocabCoverage: 0,
    grammarAccuracy: 0
  });
  
  // Real-time feedback state
  const [lastComprehensionFeedback, setLastComprehensionFeedback] = useState<ComprehensionFeedback | null>(null);
  
  // Process transcript and update all related state
  const processTranscript = useCallback(async (role: 'user' | 'assistant', text: string) => {
    console.log('[ConversationEngine] Processing transcript:', { role, text: text.substring(0, 50) + '...' });
    
    let displayText = text;
    let updatedProfile = { ...learnerProfile };
    
    // Process assistant responses for hidden analysis and vocabulary tracking
    if (role === 'assistant') {
      const { cleanText, analysis } = extractHiddenAnalysis(text);
      displayText = cleanText;
      
      // Add to conversation history for Spanish analysis
      const newTurn: ConversationTurn = {
        role: 'assistant',
        text: cleanText, // Use clean text without analysis comments
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [...conversationHistory, newTurn];
      setConversationHistory(updatedHistory);
      
      // Track Spanish vocabulary heard from AI
      const aiSpanishAnalysis = analyzeSpanishText(cleanText, scenario, learnerProfile.level as any);
      console.log('[ConversationEngine] AI Spanish vocabulary:', {
        spanishWords: aiSpanishAnalysis.spanishWords,
        mexicanExpressions: aiSpanishAnalysis.mexicanExpressions
      });
      
      if (analysis) {
        console.log('[ConversationEngine] Hidden analysis extracted:', analysis);
        updatedProfile = updateProfileFromAnalysis(learnerProfile, analysis);
        onProfileUpdate(updatedProfile);
        
        // Save updated profile if handler provided
        if (onSaveProfile) {
          await onSaveProfile(updatedProfile);
        }
        
        console.log('[ConversationEngine] Profile updated from analysis:', {
          pronunciation: updatedProfile.pronunciation,
          fluency: updatedProfile.fluency,
          confidence: updatedProfile.averageConfidence,
          level: updatedProfile.level
        });
      }
    }
    
    // Enhanced Spanish analysis for user speech
    if (role === 'user') {
      // Validate transcript
      if (!text || text.trim().length === 0) {
        console.log('[ConversationEngine] Empty user transcript, skipping analysis');
        return { displayText, updatedProfile };
      }
      
      // Add to conversation history
      const newTurn: ConversationTurn = {
        role: 'user',
        text,
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [...conversationHistory, newTurn];
      setConversationHistory(updatedHistory);
      
      // Perform legacy comprehension analysis (for compatibility)
      const { understood, confidence, indicators } = detectComprehension(text);
      console.log('[ConversationEngine] Basic comprehension analysis:', { understood, confidence, indicators, text });
      
      // Enhanced Spanish analysis
      const quickAnalysis = analyzeSpanishText(text, scenario, learnerProfile.level as any);
      const essentialCheck = checkEssentialVocabulary(text, scenario);
      
      console.log('[ConversationEngine] Enhanced Spanish analysis:', {
        spanishWords: quickAnalysis.spanishWords,
        mexicanExpressions: quickAnalysis.mexicanExpressions,
        essentialCoverage: essentialCheck.coverage,
        essentialUsed: essentialCheck.used
      });
      
      // Update profile with enhanced vocabulary analysis
      const newMasteredPhrases = [...new Set([
        ...updatedProfile.masteredPhrases,
        ...quickAnalysis.spanishWords.filter(word => confidence > 0.6), // Only add if confident
        ...essentialCheck.used // Add essential vocabulary used
      ])];
      
      const newStrugglingWords = [...new Set([
        ...updatedProfile.strugglingWords,
        ...(!understood && indicators.length > 0 ? indicators : []),
        ...essentialCheck.missing.slice(0, 3) // Track some missing essential words as struggles
      ])];
      
      // Update profile with vocabulary changes
      updatedProfile = {
        ...updatedProfile,
        strugglingWords: newStrugglingWords,
        masteredPhrases: newMasteredPhrases
      };
      onProfileUpdate(updatedProfile);
      
      // Update enhanced session statistics
      const newStats = { ...sessionStats };
      newStats.totalResponses += 1;
      
      // Enhanced Spanish metrics
      newStats.spanishWordsUsed += quickAnalysis.spanishWords.length;
      newStats.mexicanExpressionsUsed += quickAnalysis.mexicanExpressions.length;
      newStats.essentialVocabCoverage = essentialCheck.coverage;
      newStats.grammarAccuracy = confidence; // Use comprehension confidence as grammar proxy for now
      
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
      
      // Generate enhanced real-time feedback with Spanish insights
      const feedbackLevel = confidence > 0.8 ? 'excellent' : 
                            confidence > 0.6 ? 'good' : 
                            confidence > 0.3 ? 'struggling' : 'confused';
      
      // Enhanced feedback messages with Spanish context
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
      
      // Add cultural notes for Mexican expressions
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
      
      // Auto-hide feedback after 3 seconds
      setTimeout(() => setLastComprehensionFeedback(null), 3000);
      
      // Save profile changes if handler provided
      if (onSaveProfile) {
        await onSaveProfile(updatedProfile);
      }
    }
    
    return { displayText, updatedProfile };
  }, [learnerProfile, sessionStats, onProfileUpdate, onSaveProfile, scenario, conversationHistory, spanishAnalyzer]);
  
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
  
  // Reset session statistics
  const resetSession = useCallback(() => {
    setSessionStats({
      totalResponses: 0,
      goodResponses: 0,
      strugglingResponses: 0,
      averageConfidence: 0,
      improvementTrend: 'neutral',
      streakCount: 0,
      lastFewConfidences: [],
      // Enhanced Spanish stats
      spanishWordsUsed: 0,
      mexicanExpressionsUsed: 0,
      essentialVocabCoverage: 0,
      grammarAccuracy: 0
    });
    setLastComprehensionFeedback(null);
    setConversationHistory([]);
    setCurrentSpanishAnalysis(null);
  }, []);
  
  return {
    // State
    sessionStats,
    lastComprehensionFeedback,
    conversationHistory,
    currentSpanishAnalysis,
    
    // Methods
    processTranscript,
    resetSession,
    getFullSpanishAnalysis,
    getDatabaseAnalysis,
    
    // Spanish analyzer instance for advanced usage
    spanishAnalyzer
  };
}