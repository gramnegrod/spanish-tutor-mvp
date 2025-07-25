/**
 * V2 to V3 Compatibility Adapter
 * 
 * This adapter provides backwards compatibility for applications using the v2 API.
 * It translates v2 configuration and method calls to work with the v3 API.
 * 
 * @deprecated This adapter is provided for migration purposes only.
 * Please migrate to the v3 API directly. This adapter will be removed in version 4.0.0.
 */

import { OpenAIRealtimeService as V3Service } from '../src/core/OpenAIRealtimeService';
import type { 
  RealtimeConfig as V3Config,
  ConnectionState as V3ConnectionState,
  Message,
  RealtimeError
} from '../src/types';

// V2 Types (for compatibility)
export interface V2SessionConfig {
  apiKey?: string;
  model?: string;
  modalities?: Array<'text' | 'audio'>;
  instructions?: string;
  voice?: 'alloy' | 'echo' | 'shimmer';
  inputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  outputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  inputAudioTranscription?: {
    model: 'whisper-1';
  };
  turnDetection?: {
    type: 'server_vad' | 'none';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  tools?: Array<{
    type: 'function';
    name: string;
    description?: string;
    parameters?: any;
  }>;
  toolChoice?: string;
  temperature?: number;
  maxResponseOutputTokens?: number;
}

export interface V2WebRTCConfig {
  iceServers?: RTCIceServer[];
  enableDataChannel?: boolean;
  audioConstraints?: MediaTrackConstraints;
  videoConstraints?: MediaTrackConstraints | false;
  offerOptions?: RTCOfferOptions;
  debug?: boolean;
  tokenEndpoint?: string;
  model?: string;
}

export interface V2RealtimeServiceConfig {
  session: V2SessionConfig;
  webrtc?: V2WebRTCConfig;
  connection?: {
    tokenEndpoint?: string;
  };
  sessionLimits?: any;
  telemetry?: any;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  debug?: boolean;
  eventHandlers?: any;
}

// V2 Event names to V3 mapping
const EVENT_MAP: Record<string, string> = {
  'ready': 'connectionStateChange',
  'disconnected': 'connectionStateChange',
  'stateChanged': 'connectionStateChange',
  'audioInput': 'audioData',
  'audioOutput': 'audioData',
  'textReceived': 'message',
  'conversationUpdated': 'message',
  'audioTrackReceived': 'audioData'
};

/**
 * V2 Compatibility Adapter
 * 
 * Provides a v2-compatible API that internally uses the v3 service.
 * Shows deprecation warnings to encourage migration.
 */
export class OpenAIRealtimeService {
  private v3Service: V3Service;
  private v2Config: V2RealtimeServiceConfig;
  private eventHandlers: Map<string, Set<Function>>;
  private isConnected: boolean = false;
  private deprecationWarningsShown: Set<string> = new Set();

  constructor(config: V2RealtimeServiceConfig) {
    this.showDeprecationWarning('constructor', 'Please migrate to v3 API. See migration guide.');
    
    this.v2Config = config;
    this.eventHandlers = new Map();
    
    // Convert v2 config to v3
    const v3Config = this.convertConfigToV3(config);
    this.v3Service = new V3Service(v3Config);
    
    // Setup v3 event forwarding
    this.setupEventForwarding();
    
    // Register v2 event handlers if provided
    if (config.eventHandlers) {
      Object.entries(config.eventHandlers).forEach(([event, handler]) => {
        if (handler) {
          this.on(event as any, handler);
        }
      });
    }
  }

  /**
   * Convert v2 config to v3 format
   */
  private convertConfigToV3(v2Config: V2RealtimeServiceConfig): V3Config {
    this.showDeprecationWarning('config', 'Config format has changed. Use config-migrator.ts to convert.');
    
    const v3Config: V3Config = {
      // Map tokenEndpoint
      tokenEndpoint: v2Config.connection?.tokenEndpoint || 
                     v2Config.webrtc?.tokenEndpoint ||
                     (v2Config.session.apiKey ? `/api/openai-tokens?key=${v2Config.session.apiKey}` : ''),
      
      // Basic settings
      debug: v2Config.debug,
      autoReconnect: v2Config.autoReconnect,
      
      // Session settings
      voice: v2Config.session.voice as any || 'alloy',
      instructions: v2Config.session.instructions,
      audioFormat: v2Config.session.outputAudioFormat as any || 'pcm16',
      enableVAD: v2Config.session.turnDetection?.type === 'server_vad',
      
      // WebRTC settings
      iceServers: v2Config.webrtc?.iceServers,
      connectionTimeout: 10000
    };
    
    // Warn about removed features
    if (v2Config.session.model) {
      this.showDeprecationWarning('model', 'Model selection moved to token endpoint configuration');
    }
    
    if (v2Config.session.tools) {
      this.showDeprecationWarning('tools', 'Function calling configuration has changed in v3');
    }
    
    return v3Config;
  }

  /**
   * Setup event forwarding from v3 to v2 format
   */
  private setupEventForwarding(): void {
    // Connection state changes
    this.v3Service.on('connectionStateChange', (state) => {
      if (state === 'connected' && !this.isConnected) {
        this.isConnected = true;
        this.emit('ready');
      } else if (state === 'disconnected' && this.isConnected) {
        this.isConnected = false;
        this.emit('disconnected', 'Connection lost');
      }
      
      // Emit v2 stateChanged event
      this.emit('stateChanged', this.getState());
    });
    
    // Messages
    this.v3Service.on('message', (message) => {
      // Forward as textReceived for text messages
      if (message.role === 'assistant' && message.text) {
        this.emit('textReceived', message.text);
      }
      
      // Update conversation
      this.emit('conversationUpdated', [message]);
    });
    
    // Audio data
    this.v3Service.on('audioData', (data) => {
      // Determine if input or output based on context
      // In v2, audioInput was for user audio, audioOutput for AI audio
      // This is a simplified mapping - real implementation would track direction
      this.emit('audioOutput', data);
    });
    
    // Errors
    this.v3Service.on('error', (error) => {
      this.emit('error', error);
    });
    
    // Speech events
    this.v3Service.on('speechStart', () => {
      this.emit('speechStart');
    });
    
    this.v3Service.on('speechEnd', () => {
      this.emit('speechEnd');
    });
  }

  /**
   * Start the service (v2 compatibility)
   */
  async start(): Promise<void> {
    this.showDeprecationWarning('start', 'Use connect() instead');
    await this.v3Service.connect();
  }

  /**
   * Stop the service (v2 compatibility)
   */
  async stop(reason?: string): Promise<void> {
    this.showDeprecationWarning('stop', 'Use disconnect() instead');
    await this.v3Service.disconnect();
  }

  /**
   * Send text (v2 compatibility)
   */
  async sendText(text: string): Promise<void> {
    await this.v3Service.sendText(text);
  }

  /**
   * Send audio (v2 compatibility)
   */
  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    this.showDeprecationWarning('sendAudio', 'Audio is now handled automatically through WebRTC');
    // In v3, audio is handled through WebRTC automatically
    // This method is kept for compatibility but does nothing
  }

  /**
   * Update configuration (v2 compatibility)
   */
  async updateConfiguration(updates: Partial<V2SessionConfig>): Promise<void> {
    this.showDeprecationWarning('updateConfiguration', 'Use updateConfig() instead');
    
    const v3Updates: Partial<V3Config> = {};
    
    if (updates.voice) {
      v3Updates.voice = updates.voice as any;
    }
    
    if (updates.instructions) {
      v3Updates.instructions = updates.instructions;
    }
    
    if (updates.outputAudioFormat) {
      v3Updates.audioFormat = updates.outputAudioFormat as any;
    }
    
    this.v3Service.updateConfig(v3Updates);
  }

  /**
   * Get state (v2 compatibility)
   */
  getState(): any {
    this.showDeprecationWarning('getState', 'State structure has changed in v3');
    
    const v3State = this.v3Service;
    
    // Convert v3 state to v2 format
    return {
      status: this.mapConnectionState(v3State.connectionState),
      session: {
        isConnected: v3State.connectionState === 'connected',
        sessionId: `session_${Date.now()}`,
        config: this.v2Config.session
      },
      webrtc: {
        connectionState: v3State.connectionState,
        dataChannelState: 'open'
      },
      lastError: null,
      metrics: {
        totalDuration: 0,
        messagesSent: v3State.messages.length,
        messagesReceived: v3State.messages.length,
        audioBytesSent: 0,
        audioBytesReceived: 0,
        averageLatency: 0,
        reconnectionAttempts: 0,
        successRate: 100
      },
      reconnectAttempts: 0,
      startedAt: new Date()
    };
  }

  /**
   * Get metrics (v2 compatibility)
   */
  getMetrics(): any {
    this.showDeprecationWarning('getMetrics', 'Metrics are now part of the main state');
    
    return {
      totalDuration: Date.now() - this.v3Service.metrics?.duration || 0,
      messagesSent: this.v3Service.messages.length,
      messagesReceived: this.v3Service.messages.length,
      audioBytesSent: 0,
      audioBytesReceived: 0,
      averageLatency: this.v3Service.metrics?.avgResponseTime || 0,
      reconnectionAttempts: 0,
      successRate: 100
    };
  }

  /**
   * Check if connected (v2 compatibility)
   */
  isConnected(): boolean {
    return this.v3Service.connectionState === 'connected';
  }

  /**
   * Check if connecting (v2 compatibility)
   */
  isConnecting(): boolean {
    return this.v3Service.connectionState === 'connecting';
  }

  /**
   * Check if reconnecting (v2 compatibility)
   */
  isReconnecting(): boolean {
    this.showDeprecationWarning('isReconnecting', 'Reconnecting state merged with connecting in v3');
    return this.v3Service.connectionState === 'connecting';
  }

  /**
   * Add event listener (v2 compatibility)
   */
  on(event: string, listener: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(listener);
  }

  /**
   * Remove event listener (v2 compatibility)
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventHandlers.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Remove all listeners (v2 compatibility)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }

  /**
   * Dispose (v2 compatibility)
   */
  dispose(): void {
    this.showDeprecationWarning('dispose', 'Resources are now cleaned up automatically');
    this.v3Service.disconnect();
    this.eventHandlers.clear();
  }

  /**
   * Emit event to v2 listeners
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventHandlers.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  /**
   * Map v3 connection state to v2 status
   */
  private mapConnectionState(v3State: V3ConnectionState): string {
    switch (v3State) {
      case 'connected':
        return 'connected';
      case 'connecting':
        return 'connecting';
      case 'disconnected':
        return 'disconnected';
      case 'error':
        return 'error';
      default:
        return 'disconnected';
    }
  }

  /**
   * Show deprecation warning once per feature
   */
  private showDeprecationWarning(feature: string, message: string): void {
    if (!this.deprecationWarningsShown.has(feature)) {
      this.deprecationWarningsShown.add(feature);
      console.warn(`⚠️ [OpenAI Realtime WebRTC] DEPRECATION WARNING: ${feature} - ${message}`);
      console.warn(`This compatibility layer will be removed in v4.0.0 (scheduled for July 2025)`);
    }
  }
}

// Also export the service as default for v2 compatibility
export default OpenAIRealtimeService;