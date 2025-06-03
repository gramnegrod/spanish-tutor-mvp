/**
 * Unified Storage Service
 * Handles data persistence for both authenticated and guest users
 */

import { LearnerProfile } from '@/lib/pedagogical-system';
import { ConversationTranscript } from '@/types';
import { GuestStorageService, GuestConversation, GuestProgress } from '@/lib/guest-storage';
// Note: Using API routes instead of direct database service calls for client-side compatibility

interface User {
  id: string;
  email: string;
}

export class UnifiedStorageService {
  
  // Learner Profile Methods
  static async saveLearnerProfile(profile: LearnerProfile, user?: User | null): Promise<void> {
    if (user) {
      // Authenticated user - save to Supabase via API
      try {
        await fetch('/api/adaptations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            common_errors: profile.strugglingWords,
            mastered_concepts: profile.masteredPhrases,
            struggle_areas: profile.needsMoreEnglish ? ['comprehension'] : []
          })
        });
      } catch (error) {
        console.error('[UnifiedStorage] Failed to save learner profile to Supabase:', error);
        // Fallback to localStorage
        GuestStorageService.saveLearnerProfile(profile);
      }
    } else {
      // Guest user - save to localStorage
      GuestStorageService.saveLearnerProfile(profile);
    }
  }
  
  static async getLearnerProfile(user?: User | null): Promise<LearnerProfile | null> {
    if (user) {
      // Authenticated user - load from Supabase via API
      try {
        const response = await fetch('/api/adaptations');
        if (response.ok) {
          const { adaptations } = await response.json();
          if (adaptations) {
            return {
              level: 'beginner', // TODO: Determine from data
              comfortWithSlang: false,
              needsMoreEnglish: adaptations.common_errors.length > 3,
              strugglingWords: adaptations.common_errors,
              masteredPhrases: adaptations.mastered_concepts
            };
          }
        }
      } catch (error) {
        console.error('[UnifiedStorage] Failed to load learner profile from Supabase:', error);
      }
    }
    
    // Guest user or fallback - load from localStorage
    return GuestStorageService.getLearnerProfile();
  }
  
  // Conversation Methods
  static async saveConversation(
    conversation: {
      title: string;
      persona: string;
      transcript: ConversationTranscript[];
      duration: number;
    },
    user?: User | null
  ): Promise<void> {
    if (user) {
      // Authenticated user - save to Supabase via API
      try {
        await fetch('/api/conversations/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: conversation.title,
            persona: conversation.persona,
            transcript: conversation.transcript,
            duration: conversation.duration
          })
        });
      } catch (error) {
        console.error('[UnifiedStorage] Failed to save conversation to Supabase:', error);
        // Fallback to localStorage
        this.saveConversationToGuest(conversation);
      }
    } else {
      // Guest user - save to localStorage
      this.saveConversationToGuest(conversation);
    }
  }
  
  private static saveConversationToGuest(conversation: {
    title: string;
    persona: string;
    transcript: ConversationTranscript[];
    duration: number;
  }): void {
    const guestConversation: GuestConversation = {
      id: crypto.randomUUID(),
      title: conversation.title,
      persona: conversation.persona,
      transcript: conversation.transcript,
      duration: conversation.duration,
      createdAt: new Date().toISOString()
    };
    GuestStorageService.saveConversation(guestConversation);
  }
  
  // Progress Methods
  static async updateProgress(
    update: {
      minutes_practiced?: number;
      conversations_completed?: number;
      vocabulary?: string[];
    },
    user?: User | null
  ): Promise<void> {
    if (user) {
      // Authenticated user - update Supabase via API
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vocabulary: update.vocabulary || [],
            minutesPracticed: update.minutes_practiced || 0,
            pronunciationImprovement: 1,
            grammarImprovement: 1,
            fluencyImprovement: 1,
            culturalImprovement: 1
          })
        });
      } catch (error) {
        console.error('[UnifiedStorage] Failed to update progress in Supabase:', error);
        // Fallback to localStorage
        this.updateGuestProgress(update);
      }
    } else {
      // Guest user - update localStorage
      this.updateGuestProgress(update);
    }
  }
  
  private static updateGuestProgress(update: {
    minutes_practiced?: number;
    conversations_completed?: number;
    vocabulary?: string[];
  }): void {
    const current = GuestStorageService.getProgress();
    const updatedProgress: Partial<GuestProgress> = {};
    
    if (update.minutes_practiced) {
      updatedProgress.totalMinutes = current.totalMinutes + update.minutes_practiced;
    }
    
    if (update.conversations_completed) {
      updatedProgress.conversationsCompleted = current.conversationsCompleted + update.conversations_completed;
    }
    
    if (update.vocabulary && update.vocabulary.length > 0) {
      const newVocab = [...new Set([...current.vocabulary, ...update.vocabulary])];
      updatedProgress.vocabulary = newVocab.slice(-100); // Keep last 100 words
    }
    
    GuestStorageService.updateProgress(updatedProgress);
  }
  
  // Migration Methods
  static async migrateGuestDataToUser(user: User): Promise<boolean> {
    try {
      console.log('[UnifiedStorage] Starting guest data migration for user:', user.email);
      
      const guestData = GuestStorageService.exportGuestData();
      
      // Migrate learner profile
      if (guestData.learnerProfile) {
        await this.saveLearnerProfile(guestData.learnerProfile, user);
      }
      
      // Migrate conversations
      for (const conversation of guestData.conversations) {
        await this.saveConversation({
          title: conversation.title,
          persona: conversation.persona,
          transcript: conversation.transcript,
          duration: conversation.duration
        }, user);
      }
      
      // Migrate progress
      await this.updateProgress({
        minutes_practiced: guestData.progress.totalMinutes,
        conversations_completed: guestData.progress.conversationsCompleted,
        vocabulary: guestData.progress.vocabulary
      }, user);
      
      // Clear guest data after successful migration
      GuestStorageService.clearGuestData();
      
      console.log('[UnifiedStorage] Guest data migration completed successfully');
      return true;
    } catch (error) {
      console.error('[UnifiedStorage] Failed to migrate guest data:', error);
      return false;
    }
  }
  
  // Utility Methods
  static getStorageInfo(user?: User | null) {
    if (user) {
      return {
        type: 'authenticated',
        userId: user.id,
        email: user.email
      };
    } else {
      return {
        type: 'guest',
        ...GuestStorageService.getStorageInfo()
      };
    }
  }
  
  static shouldPromptSignup(user?: User | null): boolean {
    if (user) return false; // Already signed up
    
    const guestInfo = GuestStorageService.getStorageInfo();
    
    // Prompt if guest has significant progress
    return guestInfo.conversationCount >= 3 || 
           guestInfo.totalSize > 1000; // Rough size threshold
  }
}