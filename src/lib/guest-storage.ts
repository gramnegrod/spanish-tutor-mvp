/**
 * Session Storage utilities for guest users
 * Provides temporary data persistence for non-authenticated users
 * Data is isolated per tab/session and automatically cleared when tab closes
 */

import { LearnerProfile } from '@/lib/pedagogical-system';
import { ConversationTranscript } from '@/types';

const GUEST_STORAGE_PREFIX = 'spanish-tutor-guest-';

export interface GuestConversation {
  id: string;
  title: string;
  persona: string;
  transcript: ConversationTranscript[];
  duration: number;
  createdAt: string;
}

export interface GuestProgress {
  totalMinutes: number;
  conversationsCompleted: number;
  vocabulary: string[];
  lastSession: string;
}

export class GuestStorageService {
  
  // Learner Profile Storage
  static saveLearnerProfile(profile: LearnerProfile): void {
    try {
      sessionStorage.setItem(
        `${GUEST_STORAGE_PREFIX}learner-profile`,
        JSON.stringify(profile)
      );
    } catch (error) {
      console.warn('[GuestStorage] Failed to save learner profile:', error);
    }
  }
  
  static getLearnerProfile(): LearnerProfile | null {
    try {
      const stored = sessionStorage.getItem(`${GUEST_STORAGE_PREFIX}learner-profile`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('[GuestStorage] Failed to load learner profile:', error);
      return null;
    }
  }
  
  // Conversation Storage
  static saveConversation(conversation: GuestConversation): void {
    try {
      const conversations = this.getConversations();
      conversations.push(conversation);
      
      // Keep only last 10 conversations for performance
      const recentConversations = conversations.slice(-10);
      
      sessionStorage.setItem(
        `${GUEST_STORAGE_PREFIX}conversations`,
        JSON.stringify(recentConversations)
      );
    } catch (error) {
      console.warn('[GuestStorage] Failed to save conversation:', error);
    }
  }
  
  static getConversations(): GuestConversation[] {
    try {
      const stored = sessionStorage.getItem(`${GUEST_STORAGE_PREFIX}conversations`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('[GuestStorage] Failed to load conversations:', error);
      return [];
    }
  }
  
  // Progress Storage
  static saveProgress(progress: GuestProgress): void {
    try {
      sessionStorage.setItem(
        `${GUEST_STORAGE_PREFIX}progress`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.warn('[GuestStorage] Failed to save progress:', error);
    }
  }
  
  static getProgress(): GuestProgress {
    try {
      const stored = sessionStorage.getItem(`${GUEST_STORAGE_PREFIX}progress`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[GuestStorage] Failed to load progress:', error);
    }
    
    // Return default progress
    return {
      totalMinutes: 0,
      conversationsCompleted: 0,
      vocabulary: [],
      lastSession: new Date().toISOString()
    };
  }
  
  static updateProgress(update: Partial<GuestProgress>): void {
    const current = this.getProgress();
    const updated = {
      ...current,
      ...update,
      lastSession: new Date().toISOString()
    };
    this.saveProgress(updated);
  }
  
  // Migration utilities for when guest converts to authenticated user
  static exportGuestData() {
    return {
      learnerProfile: this.getLearnerProfile(),
      conversations: this.getConversations(),
      progress: this.getProgress()
    };
  }
  
  static clearGuestData(): void {
    try {
      const keys = Object.keys(sessionStorage).filter(key => 
        key.startsWith(GUEST_STORAGE_PREFIX)
      );
      keys.forEach(key => sessionStorage.removeItem(key));
      console.log('[GuestStorage] Cleared guest data');
    } catch (error) {
      console.warn('[GuestStorage] Failed to clear guest data:', error);
    }
  }
  
  // Utility to check storage usage
  static getStorageInfo() {
    try {
      const profile = sessionStorage.getItem(`${GUEST_STORAGE_PREFIX}learner-profile`);
      const conversations = sessionStorage.getItem(`${GUEST_STORAGE_PREFIX}conversations`);
      const progress = sessionStorage.getItem(`${GUEST_STORAGE_PREFIX}progress`);
      
      const totalSize = (profile?.length || 0) + 
                       (conversations?.length || 0) + 
                       (progress?.length || 0);
      
      return {
        totalSize,
        conversationCount: this.getConversations().length,
        hasProfile: !!profile,
        lastSession: this.getProgress().lastSession
      };
    } catch (error) {
      console.warn('[GuestStorage] Failed to get storage info:', error);
      return { totalSize: 0, conversationCount: 0, hasProfile: false, lastSession: null };
    }
  }
}