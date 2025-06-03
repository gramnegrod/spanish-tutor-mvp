/**
 * usePracticeAdaptation Hook
 * 
 * Handles the smart adaptation system with consecutive confirmation tracking.
 * Manages mode switching between "Bilingual Helper" and "Spanish Focus" based
 * on user performance patterns.
 */

import { useState, useCallback } from 'react'
import { LearnerProfile } from '@/lib/pedagogical-system'

export interface AdaptationNotification {
  type: 'switched_to_helper' | 'switched_to_immersion' | 'building_confidence' | 'need_practice';
  message: string;
}

export interface AdaptationOptions {
  learnerProfile: LearnerProfile;
  onProfileUpdate: (profile: LearnerProfile) => void;
  onInstructionsUpdate?: (instructions: string) => void;
  onSaveProfile?: (profile: LearnerProfile) => Promise<void>;
  generateInstructions?: (profile: LearnerProfile) => string;
}

export function usePracticeAdaptation(options: AdaptationOptions) {
  const { 
    learnerProfile, 
    onProfileUpdate, 
    onInstructionsUpdate, 
    onSaveProfile,
    generateInstructions 
  } = options;
  
  // Consecutive tracking state
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const REQUIRED_CONFIRMATIONS = 2; // Need 2 consecutive confirmations to switch modes
  
  // Adaptation notification state
  const [showAdaptationNotification, setShowAdaptationNotification] = useState<AdaptationNotification | null>(null);
  
  // Process user performance and potentially trigger adaptations
  const processPerformance = useCallback(async (understood: boolean, confidence: number) => {
    console.log('[PracticeAdaptation] Processing performance:', { understood, confidence, 
      currentMode: learnerProfile.needsMoreEnglish ? 'Bilingual Helper' : 'Spanish Focus' });
    
    if (!understood && confidence < 0.3) {
      // User struggling - increment failure count, reset success count
      const newFailures = consecutiveFailures + 1;
      setConsecutiveFailures(newFailures);
      setConsecutiveSuccesses(0);
      
      // Show building towards helper mode notification
      if (newFailures === 1 && !learnerProfile.needsMoreEnglish) {
        const notification: AdaptationNotification = {
          type: 'need_practice',
          message: 'I noticed you might need some help. Let me know if you need more English!'
        };
        setShowAdaptationNotification(notification);
        setTimeout(() => setShowAdaptationNotification(null), 4000);
      }
      
      // Switch to helper mode after consecutive failures
      if (newFailures >= REQUIRED_CONFIRMATIONS && !learnerProfile.needsMoreEnglish) {
        console.log('🚨 USER STRUGGLING - Switching to Bilingual Helper mode', {
          consecutiveFailures: newFailures,
          confidence
        });
        
        const newProfile = { 
          ...learnerProfile, 
          needsMoreEnglish: true
        };
        
        onProfileUpdate(newProfile);
        
        // Update AI instructions if handler provided
        if (onInstructionsUpdate && generateInstructions) {
          const newInstructions = generateInstructions(newProfile);
          onInstructionsUpdate(newInstructions);
        }
        
        // Save profile if handler provided
        if (onSaveProfile) {
          await onSaveProfile(newProfile);
        }
        
        // Show mode switch notification
        const notification: AdaptationNotification = {
          type: 'switched_to_helper',
          message: '🤝 Switching to Helper Mode! I\'ll use more English to help you learn.'
        };
        setShowAdaptationNotification(notification);
        setTimeout(() => setShowAdaptationNotification(null), 5000);
        
        // Reset counters after mode switch
        setConsecutiveFailures(0);
      } else if (learnerProfile.needsMoreEnglish) {
        console.log('⚠️ STILL STRUGGLING - Staying in Bilingual Helper mode', {
          consecutiveFailures: newFailures,
          confidence
        });
      } else {
        console.log('⚠️ STRUGGLING BUT NEED MORE CONFIRMATION', {
          consecutiveFailures: newFailures,
          requiredConfirmations: REQUIRED_CONFIRMATIONS,
          confidence
        });
      }
    } else if (understood && confidence > 0.7) {
      // User succeeding - increment success count, reset failure count
      const newSuccesses = consecutiveSuccesses + 1;
      setConsecutiveSuccesses(newSuccesses);
      setConsecutiveFailures(0);
      
      // Show building towards immersion mode notification
      if (newSuccesses === 1 && learnerProfile.needsMoreEnglish) {
        const notification: AdaptationNotification = {
          type: 'building_confidence',
          message: '¡Muy bien! You\'re doing great! Keep it up for full Spanish immersion!'
        };
        setShowAdaptationNotification(notification);
        setTimeout(() => setShowAdaptationNotification(null), 4000);
      }
      
      // Switch to Spanish focus after consecutive successes
      if (newSuccesses >= REQUIRED_CONFIRMATIONS && learnerProfile.needsMoreEnglish) {
        console.log('🎉 USER SUCCEEDING - Switching to Spanish Focus mode', {
          consecutiveSuccesses: newSuccesses,
          confidence
        });
        
        const newProfile = { 
          ...learnerProfile, 
          needsMoreEnglish: false
        };
        
        onProfileUpdate(newProfile);
        
        // Update AI instructions if handler provided
        if (onInstructionsUpdate && generateInstructions) {
          const newInstructions = generateInstructions(newProfile);
          onInstructionsUpdate(newInstructions);
        }
        
        // Save profile if handler provided
        if (onSaveProfile) {
          await onSaveProfile(newProfile);
        }
        
        // Show mode switch notification
        const notification: AdaptationNotification = {
          type: 'switched_to_immersion',
          message: '🚀 Switching to Immersion Mode! Ready for more Spanish challenge!'
        };
        setShowAdaptationNotification(notification);
        setTimeout(() => setShowAdaptationNotification(null), 5000);
        
        // Reset counters after mode switch
        setConsecutiveSuccesses(0);
      } else if (!learnerProfile.needsMoreEnglish) {
        console.log('✅ STILL SUCCEEDING - Staying in Spanish Focus mode', {
          consecutiveSuccesses: newSuccesses,
          confidence
        });
      } else {
        console.log('✅ SUCCEEDING BUT NEED MORE CONFIRMATION', {
          consecutiveSuccesses: newSuccesses,
          requiredConfirmations: REQUIRED_CONFIRMATIONS,
          confidence
        });
      }
    } else {
      // Neutral performance - don't change counters, just log
      console.log('➖ NEUTRAL PERFORMANCE - No adaptation triggered', {
        understood,
        confidence,
        consecutiveSuccesses,
        consecutiveFailures,
        currentMode: learnerProfile.needsMoreEnglish ? 'Bilingual Helper' : 'Spanish Focus'
      });
    }
  }, [
    learnerProfile, 
    consecutiveSuccesses, 
    consecutiveFailures, 
    onProfileUpdate, 
    onInstructionsUpdate, 
    onSaveProfile, 
    generateInstructions
  ]);
  
  // Reset adaptation counters
  const resetAdaptation = useCallback(() => {
    setConsecutiveSuccesses(0);
    setConsecutiveFailures(0);
    setShowAdaptationNotification(null);
  }, []);
  
  // Get current adaptation progress info
  const getAdaptationProgress = useCallback(() => {
    if (learnerProfile.needsMoreEnglish) {
      return {
        mode: 'helper',
        progress: consecutiveSuccesses,
        target: REQUIRED_CONFIRMATIONS,
        description: consecutiveSuccesses > 0 ? `${consecutiveSuccesses}/2 successes` : 'Ready to help'
      };
    } else {
      return {
        mode: 'immersion',
        progress: consecutiveFailures,
        target: REQUIRED_CONFIRMATIONS,
        description: consecutiveFailures > 0 ? `${consecutiveFailures}/2 struggles` : 'Doing great'
      };
    }
  }, [learnerProfile.needsMoreEnglish, consecutiveSuccesses, consecutiveFailures]);
  
  return {
    // State
    consecutiveSuccesses,
    consecutiveFailures,
    showAdaptationNotification,
    
    // Methods
    processPerformance,
    resetAdaptation,
    getAdaptationProgress,
    
    // Constants
    REQUIRED_CONFIRMATIONS
  };
}