/**
 * Session Lifecycle and Timer Management Module
 */

import { SessionInfo, RealtimeConfig, RealtimeEvents } from './types';
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

  startSessionTimers(): void {
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
        this.startSessionTimers(); // Start new 10-minute timer
      } else {
        this.resetSession();
      }
    }
  }

  configureSession(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('[SessionManager] Data channel not open');
      return;
    }
    
    const sessionConfig: any = {
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
        model: 'whisper-1'
      };
      console.log('[SessionManager] Input transcription ENABLED');
    } else {
      console.log('[SessionManager] Input transcription DISABLED');
    }
    
    console.log('[SessionManager] Sending session configuration...');
    this.dataChannel.send(JSON.stringify(sessionConfig));
    console.log('[SessionManager] Session configuration sent');
  }

  updateInstructions(instructions: string): void {
    console.log('[SessionManager] Updating instructions...');
    this.config.instructions = instructions;
    
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.configureSession();
      console.log('[SessionManager] Instructions updated successfully');
    } else {
      console.warn('[SessionManager] Cannot update instructions - data channel not open');
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
    
    this.dataChannel = null;
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