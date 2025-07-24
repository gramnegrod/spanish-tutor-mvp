/**
 * OpenAI Realtime Service - Simple Version
 * 
 * A straightforward service for OpenAI Realtime API with WebRTC.
 * No over-engineering, just the essentials.
 */

import { EventEmitter } from 'eventemitter3';
import { WebRTCManager, type WebRTCConfig } from './WebRTCManager';
import type { RealtimeVoice, AudioFormat } from '../types';

// Simple types without complexity
type Modality = 'text' | 'audio';

export interface RealtimeServiceConfig extends WebRTCConfig {
  tokenEndpoint?: string;
  model?: string;
  instructions?: string;
  voice?: RealtimeVoice;
  modalities?: Modality[];
  temperature?: number;
  maxOutputTokens?: number | 'inf';
  inputAudioFormat?: AudioFormat;
  outputAudioFormat?: AudioFormat;
  turnDetection?: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
}

export interface RealtimeServiceState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: Error;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    text?: string;
    timestamp: number;
  }>;
}

export interface RealtimeServiceEvents {
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
  textReceived: (text: string) => void;
  audioReceived: (audio: ArrayBuffer) => void;
  transcriptionReceived: (text: string) => void;
  statusChanged: (status: RealtimeServiceState['status']) => void;
}

/**
 * Simple OpenAI Realtime Service
 */
export class OpenAIRealtimeService extends EventEmitter<RealtimeServiceEvents> {
  private webrtcManager: WebRTCManager;
  private config: RealtimeServiceConfig;
  public state: RealtimeServiceState;
  private events: any; // Compatible with local service events
  private audioElement: HTMLAudioElement | null = null;
  private isDisposed = false;

  constructor(config: RealtimeServiceConfig, events: any = {}) {
    super();
    
    this.config = {
      tokenEndpoint: '/api/session',
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      modalities: ['text', 'audio'],
      temperature: 0.8,
      maxOutputTokens: 4096,
      inputAudioFormat: 'pcm16',
      outputAudioFormat: 'pcm16',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      ...config
    };
    this.events = events;

    this.state = {
      status: 'disconnected',
      messages: []
    };

    this.webrtcManager = new WebRTCManager(this.config);
    this.setupWebRTCHandlers();
  }

  /**
   * Connect to OpenAI Realtime
   */
  async connect(audioElement?: HTMLAudioElement): Promise<void> {
    if (this.isDisposed) {
      throw new Error('Service has been disposed');
    }

    if (this.state.status === 'connected' || this.state.status === 'connecting') {
      return;
    }

    try {
      this.updateStatus('connecting');
      
      // Store audio element for playback
      this.audioElement = audioElement || null;
      
      this.log('Initializing WebRTC...');
      await this.webrtcManager.initialize();
      
      // OpenAI's example doesn't wait or send config - just mark as connected
      this.updateStatus('connected');
      this.emit('connected');
      this.events.onConnect?.();
      this.log('Connected successfully');
      
      // Try to send session config after a delay (optional enhancement)
      setTimeout(() => {
        if (this.webrtcManager.isDataChannelOpen()) {
          this.sendSessionConfig().catch(err => {
            this.log('Session config failed (non-critical):', err);
          });
        }
      }, 1000);
    } catch (error) {
      this.updateStatus('error');
      this.state.error = error instanceof Error ? error : new Error('Unknown error');
      this.emit('error', this.state.error);
      throw error;
    }
  }

  /**
   * Update instructions
   */
  async updateInstructions(instructions: string): Promise<void> {
    this.config.instructions = instructions;
    
    if (this.state.status === 'connected') {
      // Send updated session config
      await this.sendSessionConfig();
    }
  }

  /**
   * Send text message
   */
  async sendText(text: string): Promise<void> {
    if (this.state.status !== 'connected') {
      throw new Error('Not connected');
    }

    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text
        }]
      }
    };

    this.webrtcManager.sendData(JSON.stringify(message));
    this.webrtcManager.sendData(JSON.stringify({ type: 'response.create' }));

    // Add to messages
    this.state.messages.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now()
    });
  }

  /**
   * Disconnect from OpenAI Realtime
   */
  async disconnect(): Promise<void> {
    if (this.state.status === 'disconnected') {
      return;
    }

    await this.webrtcManager.close();
    
    // Clean up audio element
    if (this.audioElement) {
      this.audioElement.srcObject = null;
    }
    
    this.updateStatus('disconnected');
    this.emit('disconnected');
    this.events.onDisconnect?.();
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    if (this.isDisposed) return;
    
    this.isDisposed = true;
    this.webrtcManager.dispose();
    this.removeAllListeners();
    this.updateStatus('disconnected');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RealtimeServiceConfig>): void {
    Object.assign(this.config, config);
    
    if (this.state.status === 'connected') {
      this.sendSessionConfig().catch(error => {
        this.emit('error', error);
      });
    }
  }

  // Private methods

  private setupWebRTCHandlers(): void {
    this.webrtcManager.on('connected', () => {
      this.log('WebRTC connected');
    });

    this.webrtcManager.on('disconnected', (reason) => {
      this.log('WebRTC disconnected:', reason);
      this.updateStatus('disconnected');
      this.emit('disconnected');
      this.events.onDisconnect?.();
    });

    this.webrtcManager.on('connectionFailed', (error) => {
      this.log('WebRTC connection failed:', error);
      this.updateStatus('error');
      this.state.error = error;
      this.emit('error', error);
      this.events.onError?.(error);
    });

    this.webrtcManager.on('dataChannelMessage', (data) => {
      this.handleDataChannelMessage(data);
    });

    this.webrtcManager.on('audioTrackReceived', (track) => {
      this.log('Audio track received');
      if (this.audioElement && track.kind === 'audio') {
        const stream = new MediaStream([track]);
        this.audioElement.srcObject = stream;
        this.log('Audio stream connected to element');
      }
    });
  }

  private handleDataChannelMessage(data: string | ArrayBuffer): void {
    if (typeof data !== 'string') return;

    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'conversation.item.created':
          if (message.item?.role === 'assistant' && message.item?.content) {
            const textContent = message.item.content.find((c: any) => c.type === 'text');
            if (textContent?.text) {
              this.emit('textReceived', textContent.text);
              this.events.onTranscript?.('assistant', textContent.text);
              this.state.messages.push({
                id: message.item.id || `msg-${Date.now()}`,
                role: 'assistant',
                text: textContent.text,
                timestamp: Date.now()
              });
            }
          }
          break;

        case 'conversation.item.input_audio_transcription.completed':
          if (message.transcript) {
            this.emit('transcriptionReceived', message.transcript);
            this.events.onTranscript?.('user', message.transcript);
          }
          break;

        case 'response.audio.delta':
          if (message.delta) {
            const audioData = Uint8Array.from(atob(message.delta), c => c.charCodeAt(0));
            this.emit('audioReceived', audioData.buffer);
          }
          break;

        case 'error':
          this.emit('error', new Error(message.error?.message || 'Unknown error'));
          break;
      }
    } catch (error) {
      this.log('Failed to handle message:', error);
    }
  }

  private async waitForDataChannel(timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.webrtcManager.off('dataChannelReady', onReady);
        reject(new Error('Data channel failed to open'));
      }, timeout);

      const onReady = () => {
        clearTimeout(timer);
        resolve();
      };

      // Check if already open
      if (this.webrtcManager.isDataChannelOpen()) {
        clearTimeout(timer);
        resolve();
        return;
      }

      // Wait for it to open
      this.webrtcManager.once('dataChannelReady', onReady);
    });
  }

  private async sendSessionConfig(): Promise<void> {
    const sessionUpdate = {
      type: 'session.update',
      session: {
        model: this.config.model,
        modalities: this.config.modalities,
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: this.config.inputAudioFormat,
        output_audio_format: this.config.outputAudioFormat,
        input_audio_transcription: this.config.inputAudioFormat ? {
          model: 'whisper-1'
        } : null,
        turn_detection: this.config.turnDetection,
        temperature: this.config.temperature,
        max_output_tokens: this.config.maxOutputTokens === 'inf' ? null : this.config.maxOutputTokens
      }
    };

    this.webrtcManager.sendData(JSON.stringify(sessionUpdate));
  }

  private updateStatus(status: RealtimeServiceState['status']): void {
    if (this.state.status !== status) {
      this.state.status = status;
      this.emit('statusChanged', status);
      this.events.onStatusUpdate?.(status);
    }
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[OpenAIRealtime] ${message}`, ...args);
    }
  }
}

export default OpenAIRealtimeService;