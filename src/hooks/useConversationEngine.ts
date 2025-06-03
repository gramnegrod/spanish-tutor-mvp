/**
 * useConversationEngine Hook
 * 
 * Handles the core conversation processing logic that was previously
 * embedded in massive onTranscript callbacks. Manages:
 * - Comprehension analysis
 * - Vocabulary tracking
 * - Hidden analysis extraction
 * - Profile updates
 * - Session statistics
 */

import { useState, useCallback } from 'react'
import { detectComprehension, extractHiddenAnalysis, updateProfileFromAnalysis, LearnerProfile } from '@/lib/pedagogical-system'
import { ConversationTranscript } from '@/types'

// Extract Spanish words helper function
function extractSpanishWords(text: string): string[] {
  const commonSpanishWords = [
    // Basic greetings and courtesy
    'hola', 'gracias', 'por favor', 'buenos', 'días', 'tardes', 'noches', 
    'adiós', 'hasta', 'luego', 'disculpe', 'perdón', 'con permiso',
    
    // Mexican cultural expressions
    'órale', 'ándale', 'güero', 'güera', 'joven', 'amigo', 'amiga',
    'mero', 'padrísimo', 'chido', 'sale', 'simón', 'nel', 'mande',
    
    // Food vocabulary (Mexican specific)
    'tacos', 'pastor', 'carnitas', 'suadero', 'bistec', 'quesadilla', 
    'tortilla', 'piña', 'cebolla', 'cilantro', 'salsa', 'verde', 'roja',
    'picante', 'limón', 'aguacate', 'frijoles', 'guacamole', 'chicharrón',
    
    // Ordering and transactions
    'quiero', 'me da', 'quisiera', 'deme', 'póngame', 'cuánto', 'cuesta',
    'cuántos', 'pesos', 'dinero', 'cambio', 'aquí', 'está', 'todo', 
    'nada', 'más', 'menos', 'con todo', 'sin', 'para llevar', 'para aquí',
    
    // Descriptions and reactions
    'muy', 'bien', 'rico', 'delicioso', 'sabroso', 'bueno', 'excelente',
    'perfecto', 'está', 'están', 'hay', 'tiene', 'quiere', 'puede',
    
    // Mexican diminutives
    'taquitos', 'salsita', 'limoncito', 'poquito', 'ahorita', 'cerquita'
  ];
  
  const mexicanPhrases = [
    'por favor', 'me da', 'con todo', 'para llevar', 'para aquí',
    'está bien', 'muy rico', 'qué rico', 'cuánto cuesta', 'cuánto es',
    'aquí tiene', 'con permiso', 'buenas tardes', 'hasta luego'
  ];
  
  const lowerText = text.toLowerCase();
  const detectedWords: string[] = [];
  
  // Check for phrases first
  mexicanPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      detectedWords.push(phrase);
    }
  });
  
  // Then check individual words
  const words = lowerText
    .replace(/[¿¡.,!?]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  words.forEach(word => {
    if (commonSpanishWords.includes(word) && !detectedWords.includes(word)) {
      detectedWords.push(word);
    }
  });
  
  return detectedWords;
}

export interface SessionStats {
  totalResponses: number;
  goodResponses: number;
  strugglingResponses: number;
  averageConfidence: number;
  improvementTrend: 'improving' | 'declining' | 'neutral';
  streakCount: number;
  lastFewConfidences: number[];
}

export interface ComprehensionFeedback {
  level: 'excellent' | 'good' | 'struggling' | 'confused';
  message: string;
  confidence: number;
  timestamp: Date;
}

export interface ConversationEngineOptions {
  learnerProfile: LearnerProfile;
  onProfileUpdate: (profile: LearnerProfile) => void;
  onSaveProfile?: (profile: LearnerProfile) => Promise<void>;
}

export function useConversationEngine(options: ConversationEngineOptions) {
  const { learnerProfile, onProfileUpdate, onSaveProfile } = options;
  
  // Session statistics state
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalResponses: 0,
    goodResponses: 0,
    strugglingResponses: 0,
    averageConfidence: 0,
    improvementTrend: 'neutral',
    streakCount: 0,
    lastFewConfidences: []
  });
  
  // Real-time feedback state
  const [lastComprehensionFeedback, setLastComprehensionFeedback] = useState<ComprehensionFeedback | null>(null);
  
  // Process transcript and update all related state
  const processTranscript = useCallback(async (role: 'user' | 'assistant', text: string) => {
    console.log('[ConversationEngine] Processing transcript:', { role, text: text.substring(0, 50) + '...' });
    
    let displayText = text;
    let updatedProfile = { ...learnerProfile };
    
    // Process assistant responses for hidden analysis
    if (role === 'assistant') {
      const { cleanText, analysis } = extractHiddenAnalysis(text);
      displayText = cleanText;
      
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
    
    // Analyze comprehension for user speech
    if (role === 'user') {
      // Validate transcript
      if (!text || text.trim().length === 0) {
        console.log('[ConversationEngine] Empty user transcript, skipping analysis');
        return { displayText, updatedProfile };
      }
      
      // Perform comprehension analysis
      const { understood, confidence, indicators } = detectComprehension(text);
      console.log('[ConversationEngine] Comprehension analysis:', { understood, confidence, indicators, text });
      
      // Track vocabulary usage and errors
      const spanishWords = extractSpanishWords(text);
      const newMasteredPhrases = [...updatedProfile.masteredPhrases];
      const newStrugglingWords = [...updatedProfile.strugglingWords];
      
      // Add new Spanish words as mastered if used correctly
      if (understood && spanishWords.length > 0) {
        spanishWords.forEach(word => {
          if (!newMasteredPhrases.includes(word)) {
            newMasteredPhrases.push(word);
          }
        });
      }
      
      // Track confusion indicators as struggling words
      if (!understood && indicators.length > 0) {
        indicators.forEach(indicator => {
          if (!newStrugglingWords.includes(indicator)) {
            newStrugglingWords.push(indicator);
          }
        });
      }
      
      // Update profile with vocabulary changes
      updatedProfile = {
        ...updatedProfile,
        strugglingWords: newStrugglingWords,
        masteredPhrases: newMasteredPhrases
      };
      onProfileUpdate(updatedProfile);
      
      // Update session statistics
      const newStats = { ...sessionStats };
      newStats.totalResponses += 1;
      
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
      
      // Generate real-time comprehension feedback
      const feedbackLevel = confidence > 0.8 ? 'excellent' : 
                            confidence > 0.6 ? 'good' : 
                            confidence > 0.3 ? 'struggling' : 'confused';
      
      const feedbackMessage = confidence > 0.8 ? '¡Excelente! Great Spanish usage!' :
                              confidence > 0.6 ? 'Good job! Keep practicing' :
                              confidence > 0.3 ? 'Keep trying - you\'re learning!' :
                              'Don\'t worry, let\'s work on this together';
      
      const feedback: ComprehensionFeedback = {
        level: feedbackLevel,
        message: feedbackMessage,
        confidence,
        timestamp: new Date()
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
  }, [learnerProfile, sessionStats, onProfileUpdate, onSaveProfile]);
  
  // Reset session statistics
  const resetSession = useCallback(() => {
    setSessionStats({
      totalResponses: 0,
      goodResponses: 0,
      strugglingResponses: 0,
      averageConfidence: 0,
      improvementTrend: 'neutral',
      streakCount: 0,
      lastFewConfidences: []
    });
    setLastComprehensionFeedback(null);
  }, []);
  
  return {
    // State
    sessionStats,
    lastComprehensionFeedback,
    
    // Methods
    processTranscript,
    resetSession
  };
}