/**
 * Session Lifecycle and Timer Management Module
 */

import { SessionInfo, RealtimeConfig, RealtimeEvents, SessionConfiguration } from './types';
import { SESSION_LIMITS } from './constants';

export class SessionManager {
  private sessionStartTime: Date | null = null;
  private currentSession: number = 1;
  private warningTimer: NodeJS.Timeout | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private dataChannel: RTCDataChannel | null = null;
  
  private config: RealtimeConfig;
  private events: RealtimeEvents;
  private totalCost: number = 0;
  
  // Track last sent instructions to avoid unnecessary updates
  private lastSentInstructions: string | null = null;
  private updateRetryCount: number = 0;
  private maxRetries: number = 20; // Increased to give data channel more time to open
  private isConfiguring: boolean = false;

  constructor(config: RealtimeConfig, events: RealtimeEvents) {
    this.config = config;
    this.events = events;
  }

  setDataChannel(dc: RTCDataChannel): void {
    this.dataChannel = dc;
  }

  updateTotalCost(cost: number): void {
    this.totalCost = cost;
  }

  async startSessionTimers(): Promise<void> {
    this.sessionStartTime = new Date();
    
    // Set warning timer (8 minutes)
    this.warningTimer = setTimeout(() => {
      this.events.onTimeWarning?.(2, this.totalCost);
    }, SESSION_LIMITS.warningTimeMinutes * 60 * 1000);
    
    // Set session limit timer (10 minutes)
    this.sessionTimer = setTimeout(async () => {
      await this.handleSessionComplete();
    }, SESSION_LIMITS.sessionTimeMinutes * 60 * 1000);
    
    console.log('[SessionManager] Session timers started');
  }

  private async handleSessionComplete(): Promise<void> {
    const sessionInfo: SessionInfo = {
      currentSession: this.currentSession,
      maxSessions: SESSION_LIMITS.maxSessions,
      sessionTimeMinutes: SESSION_LIMITS.sessionTimeMinutes,
      totalTimeMinutes: this.currentSession * SESSION_LIMITS.sessionTimeMinutes,
      canExtend: this.currentSession < SESSION_LIMITS.maxSessions
    };

    if (this.currentSession >= SESSION_LIMITS.maxSessions) {
      // Max sessions reached
      this.events.onMaxSessionsReached?.(
        this.totalCost,
        sessionInfo.totalTimeMinutes
      );
      this.resetSession();
    } else {
      // Ask user if they want to extend
      const shouldExtend = await this.events.onSessionComplete?.(
        sessionInfo,
        this.totalCost
      );
      
      if (shouldExtend) {
        this.currentSession++;
        await this.startSessionTimers(); // Start new 10-minute timer
      } else {
        this.resetSession();
      }
    }
  }

  private isDataChannelReady(): boolean {
    return this.dataChannel !== null && this.dataChannel.readyState === 'open';
  }
  
  /**
   * Check if connection is stable and ready for updates
   * This helps prevent unnecessary update attempts during connection instability
   */
  isConnectionStable(): boolean {
    return this.isDataChannelReady() && this.updateRetryCount === 0;
  }

  private async sendWithRetry(data: string, retryCount: number = 0): Promise<boolean> {
    if (!this.isDataChannelReady()) {
      if (retryCount >= this.maxRetries) {
        console.error('[SessionManager] Max retries reached, data channel still not ready');
        console.error('[SessionManager] Data channel state:', this.dataChannel?.readyState);
        return false;
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = Math.min(100 * Math.pow(2, retryCount), 2000);
      console.log(`[SessionManager] Data channel not ready (state: ${this.dataChannel?.readyState || 'null'}), retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.sendWithRetry(data, retryCount + 1);
    }
    
    try {
      this.dataChannel!.send(data);
      return true;
    } catch (error) {
      console.error('[SessionManager] Error sending data:', error);
      if (retryCount < this.maxRetries) {
        const delay = Math.min(100 * Math.pow(2, retryCount), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(data, retryCount + 1);
      }
      return false;
    }
  }

  async configureSession(): Promise<void> {
    // Prevent concurrent configuration attempts
    if (this.isConfiguring) {
      console.log('[SessionManager] Configuration already in progress, skipping');
      return;
    }
    
    this.isConfiguring = true;
    
    try {
      if (!this.isDataChannelReady()) {
        console.warn('[SessionManager] Data channel not ready, will retry with backoff');
      }
      
      console.log('🎯 [SessionManager] Configuring session with instructions:');
      console.log('🎯 [SessionManager] Instructions preview:', this.config.instructions?.substring(0, 200) + '...');
      console.log('🎯 [SessionManager] Full character check:', {
        hasInstructions: !!this.config.instructions,
        includesDonRoberto: this.config.instructions?.includes('Don Roberto'),
        includesCorrectCharacter: true
      });
      
      const sessionConfig: SessionConfiguration = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: this.config.instructions,
          voice: this.config.voice,
          input_audio_format: this.config.inputAudioFormat,
          output_audio_format: this.config.outputAudioFormat,
          turn_detection: {
            type: this.config.turnDetection?.type,
            threshold: this.config.turnDetection?.threshold,
            prefix_padding_ms: this.config.turnDetection?.prefixPaddingMs,
            silence_duration_ms: this.config.turnDetection?.silenceDurationMs
          },
          temperature: this.config.temperature
        }
      };
      
      // Only add input transcription if explicitly enabled
      if (this.config.enableInputTranscription) {
        sessionConfig.session.input_audio_transcription = {
          model: this.config.inputAudioTranscription?.model || 'whisper-1',
          ...(this.config.inputAudioTranscription?.language && {
            language: this.config.inputAudioTranscription.language
          })
        };
        console.log('[SessionManager] Input transcription ENABLED with config:', sessionConfig.session.input_audio_transcription);
      } else {
        console.log('[SessionManager] Input transcription DISABLED');
      }
      
      console.log('[SessionManager] Sending session configuration...');
      const success = await this.sendWithRetry(JSON.stringify(sessionConfig));
      
      if (success) {
        console.log('[SessionManager] Session configuration sent successfully');
        // Update the last sent instructions after successful send
        this.lastSentInstructions = this.config.instructions || null;
        this.updateRetryCount = 0; // Reset retry count on success
      } else {
        console.error('[SessionManager] Failed to send session configuration after retries');
      }
    } finally {
      this.isConfiguring = false;
    }
  }

  async updateInstructions(instructions: string): Promise<void> {
    console.log('[SessionManager] Update instructions requested');
    
    // Guard: Check if instructions actually changed
    if (this.lastSentInstructions === instructions) {
      console.log('[SessionManager] Instructions unchanged, skipping update to avoid unnecessary API call');
      console.log('[SessionManager] Current instructions hash:', instructions ? instructions.substring(0, 50) + '...' : 'null');
      return;
    }
    
    // Log the change
    console.log('[SessionManager] Instructions changed:', {
      previousLength: this.lastSentInstructions?.length || 0,
      newLength: instructions.length,
      hasActualChange: true
    });
    
    // Update config
    this.config.instructions = instructions;
    
    // Check connection readiness
    if (!this.isDataChannelReady()) {
      console.warn('[SessionManager] Data channel not ready for instruction update, will attempt with retry');
    }
    
    // Send the update with retry logic
    try {
      await this.configureSession();
      console.log('[SessionManager] Instructions updated successfully');
    } catch (error) {
      console.error('[SessionManager] Failed to update instructions:', error);
      // Keep the new instructions in config even if send failed
      // They will be sent on next successful connection
    }
  }

  cleanup(): void {
    // Clear timers
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    // Reset tracking variables
    this.dataChannel = null;
    this.lastSentInstructions = null;
    this.updateRetryCount = 0;
    this.isConfiguring = false;
    
    console.log('[SessionManager] Cleanup complete');
  }

  private resetSession(): void {
    this.currentSession = 1;
    this.sessionStartTime = null;
    // Note: Actual reconnection handled by main service
  }

  getCurrentSession(): number {
    return this.currentSession;
  }

  getSessionStartTime(): Date | null {
    return this.sessionStartTime;
  }
}