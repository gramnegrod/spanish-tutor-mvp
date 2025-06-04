/**
 * OpenAI Realtime API WebRTC Service
 * 
 * A modular, reusable service for implementing OpenAI's Realtime API
 * using WebRTC for browser-based speech-to-speech conversations.
 */

import { RealtimeConfig, RealtimeEvents, CostTracking, SessionInfo } from './types';
import { WebRTCManager } from './webrtc-manager';
import { AudioManager } from './audio-manager';
import { SessionManager } from './session-manager';
import { CostTracker } from './cost-tracker';
import { ConversationManager } from './conversation-manager';
import { EventHandler } from './event-handler';

// Global initialization lock to prevent race conditions
let globalInitLock = false;

export class OpenAIRealtimeService {
  private static activeInstance: OpenAIRealtimeService | null = null;
  
  private webrtcManager: WebRTCManager;
  private audioManager: AudioManager;
  private sessionManager: SessionManager;
  private costTracker: CostTracker;
  private conversationManager: ConversationManager;
  private eventHandler: EventHandler;
  
  private config: RealtimeConfig;
  private events: RealtimeEvents;

  constructor(config: RealtimeConfig = {}, events: RealtimeEvents = {}) {
    // Ensure only one active instance
    if (OpenAIRealtimeService.activeInstance) {
      console.warn('[OpenAIRealtimeService] Disconnecting previous instance...');
      OpenAIRealtimeService.activeInstance.disconnect();
      // Add delay to ensure cleanup
      const delay = new Promise(resolve => setTimeout(resolve, 100));
    }
    OpenAIRealtimeService.activeInstance = this;
    
    this.config = {
      tokenEndpoint: '/api/session',
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      instructions: 'You are a helpful assistant.',
      temperature: 0.8,
      inputAudioFormat: 'pcm16',
      outputAudioFormat: 'pcm16',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        silenceDurationMs: 200
      },
      enableInputTranscription: false,
      ...config
    };
    this.events = events;
    
    // Initialize modules
    this.webrtcManager = new WebRTCManager(this.config);
    this.audioManager = new AudioManager();
    this.sessionManager = new SessionManager(this.config, this.events);
    this.costTracker = new CostTracker(this.events.onCostUpdate);
    this.conversationManager = new ConversationManager();
    this.eventHandler = new EventHandler(
      this.events,
      this.costTracker,
      this.conversationManager
    );
    
    console.log('[OpenAIRealtimeService] Constructor - enableInputTranscription:', this.config.enableInputTranscription);
  }

  async connect(audioElement?: HTMLAudioElement): Promise<void> {
    // Check global initialization lock
    if (globalInitLock) {
      console.warn('[OpenAIRealtimeService] Another connection is initializing, skipping...');
      return;
    }
    
    console.log('[OpenAIRealtimeService] Starting connection process...');
    
    try {
      // Set global lock
      globalInitLock = true;
      
      // Setup audio
      this.updateStatus('Requesting microphone access...');
      const mediaStream = await this.audioManager.setupAudio(audioElement);
      
      // Setup WebRTC error handling
      this.webrtcManager.setErrorHandler((error) => {
        console.error('[OpenAIRealtimeService] WebRTC error:', error);
        this.handleError(error);
      });
      
      // Setup WebRTC connection (now includes microphone track AND ontrack handler)
      this.updateStatus('Creating connection...');
      const { pc, dc } = await this.webrtcManager.connect(mediaStream, (e) => {
        console.log('[OpenAIRealtimeService] Received audio track:', e.track.kind);
        if (e.track.kind === 'audio') {
          this.audioManager.setAudioStream(e.streams[0]);
        }
      });
      
      // Setup data channel events
      this.sessionManager.setDataChannel(dc);
      this.eventHandler.setupDataChannel(dc, () => {
        // Data channel opened callback
        this.sessionManager.configureSession();
        
        // Now we're truly connected
        this.updateStatus('Connected!');
        console.log('[OpenAIRealtimeService] Successfully connected!');
        this.sessionManager.startSessionTimers();
        this.events.onConnect?.();
        console.log('[OpenAIRealtimeService] onConnect event fired');
      });
      
      this.updateStatus('WebRTC connected, waiting for data channel...');
      console.log('[OpenAIRealtimeService] WebRTC connection established, waiting for data channel...');
      
    } catch (error) {
      console.error('[OpenAIRealtimeService] Connection error:', error);
      this.handleError(error as Error);
      throw error;
    } finally {
      // Release global lock
      globalInitLock = false;
    }
  }

  disconnect(): void {
    console.log('[OpenAIRealtimeService] Disconnect called');
    console.trace(); // Log stack trace to see where disconnect is being called from
    
    // Cleanup all modules
    this.sessionManager.cleanup();
    this.audioManager.cleanup();
    this.webrtcManager.disconnect();
    
    // Clear active instance if it's this one
    if (OpenAIRealtimeService.activeInstance === this) {
      OpenAIRealtimeService.activeInstance = null;
    }
    
    this.updateStatus('Disconnected');
    this.events.onDisconnect?.();
  }

  // Public methods for advanced usage
  
  sendMessage(message: string): void {
    const dc = this.webrtcManager.getDataChannel();
    if (!dc || dc.readyState !== 'open') {
      throw new Error('Data channel not open');
    }
    dc.send(message);
  }
  
  updateInstructions(instructions: string): void {
    console.log('🔄 [OpenAIRealtimeService] updateInstructions called');
    console.log('📝 [OpenAIRealtimeService] Previous instructions length:', this.config.instructions?.length || 0);
    console.log('📝 [OpenAIRealtimeService] New instructions length:', instructions.length);
    
    // Log first 200 chars of old and new instructions to compare
    console.log('🔗 [OpenAI] OLD INSTRUCTIONS:', this.config.instructions?.substring(0, 200) + '...');
    console.log('🆕 [OpenAI] NEW INSTRUCTIONS:', instructions.substring(0, 200) + '...');
    
    this.sessionManager.updateInstructions(instructions);
  }
  
  // Add reconnection method
  async reconnect(): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.connect(this.audioManager.getAudioElement() || undefined);
  }
  
  getCurrentCosts(): CostTracking {
    return this.costTracker.getCurrentCosts();
  }
  
  resetCostTracking(): void {
    this.costTracker.reset();
  }

  private updateStatus(status: string): void {
    this.events.onStatusUpdate?.(status);
  }

  private handleError(error: Error): void {
    console.error('OpenAI Realtime Error:', error);
    this.events.onError?.(error);
  }

  private async restartConversation(): Promise<void> {
    // Reset session state
    this.conversationManager.reset();
    this.costTracker.reset();
    
    // Update session manager's cost tracking
    this.sessionManager.updateTotalCost(0);
    
    // Reconnect with fresh context
    await this.reconnect();
  }
}

// Export all types and interfaces
export * from './types';
export { PRICING, SESSION_LIMITS, AUDIO_CONSTANTS } from './constants';