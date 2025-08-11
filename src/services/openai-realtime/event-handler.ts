/**
 * Realtime Event Processing Module
 */

import { RealtimeEvents, RealtimeEvent } from './types';
import { CostTracker } from './cost-tracker';
import { ConversationManager } from './conversation-manager';
import { AUDIO_CONSTANTS } from './constants';

export class EventHandler {
  private events: RealtimeEvents;
  private costTracker: CostTracker;
  private conversationManager: ConversationManager;
  private speechStartTime: number | null = null;

  constructor(
    events: RealtimeEvents,
    costTracker: CostTracker,
    conversationManager: ConversationManager
  ) {
    this.events = events;
    this.costTracker = costTracker;
    this.conversationManager = conversationManager;
  }

  handleRealtimeEvent(event: RealtimeEvent): void {
    console.log('[EventHandler] Received event:', event.type);
    
    // Log specific transcription-related events in detail
    if (event.type.includes('transcription') || event.type.includes('transcript')) {
      console.log('[EventHandler] Transcription event details:', event);
    }

    switch (event.type) {
      case 'error':
        if (event.error) {
          this.events.onError?.(new Error(event.error.message || 'Unknown error'));
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        this.events.onSpeechStart?.();
        // Track speech start time for cost calculation
        this.speechStartTime = Date.now();
        break;
        
      case 'input_audio_buffer.speech_stopped':
        this.events.onSpeechStop?.();
        // Calculate speech duration when stopped
        if (this.speechStartTime) {
          const speechDuration = Date.now() - this.speechStartTime;
          this.costTracker.trackAudioDuration('input', speechDuration);
          this.speechStartTime = null;
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        console.log('[EventHandler] User transcript completed:', event.transcript);
        // Ignore empty transcripts
        if (!event.transcript || event.transcript.trim() === '') {
          console.log('[EventHandler] Ignoring empty transcript');
          break;
        }
        // Track user speech when transcription is completed
        this.events.onTranscript?.('user', event.transcript);
        // Also attempt to track audio duration from transcript timing
        if (event.duration_ms) {
          this.costTracker.trackAudioDuration('input', event.duration_ms);
        }
        break;
        
      case 'conversation.item.input_audio_transcription.in_progress':
        console.log('[EventHandler] User transcript in progress:', event);
        break;
        
      case 'conversation.item.input_audio_transcription.failed':
        console.log('[EventHandler] User transcript failed:', event);
        break;
        
      case 'response.audio_transcript.done':
        if (event.transcript) {
          console.log('[EventHandler] Assistant transcript:', event.transcript);
          this.conversationManager.addEntry('assistant', event.transcript);
          this.events.onTranscript?.('assistant', event.transcript);
        }
        // Audio duration will be tracked in response.done event via audio_tokens
        break;
        
      case 'response.audio_transcript.delta':
        console.log('[EventHandler] Assistant transcript delta:', event.delta);
        break;
        
      // Cost tracking events
      case 'response.audio.delta':
        // Track audio output duration
        if (event.delta) {
          let deltaLength = 0;
          if (event.delta instanceof ArrayBuffer) {
            deltaLength = event.delta.byteLength;
          } else if (typeof event.delta === 'string') {
            deltaLength = event.delta.length;
          }
          
          if (deltaLength > 0) {
            // PCM16 audio: 2 bytes per sample, 24000 samples per second
            const durationMs = (deltaLength / AUDIO_CONSTANTS.pcm16BytesPerSecond) * 1000;
            this.costTracker.trackAudioDuration('output', durationMs);
          }
        }
        break;
        
      case 'input_audio_buffer.committed':
        // Track audio input duration
        if (event.item_id && event.audio_duration_ms) {
          this.costTracker.trackAudioDuration('input', event.audio_duration_ms);
        }
        break;
        
      case 'conversation.item.created':
        // Track token usage for text items
        if (event.item && event.item.type === 'message') {
          const content = event.item.content?.[0];
          if (content?.type === 'text' && content.text) {
            // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
            const estimatedTokens = Math.ceil(content.text.length / 4);
            if (event.item.role === 'user') {
              this.costTracker.trackTextTokens('input', estimatedTokens);
            } else if (event.item.role === 'assistant') {
              this.costTracker.trackTextTokens('output', estimatedTokens);
            }
          }
        }
        break;
        
      case 'response.done':
        console.log('[EventHandler] Response done event:', event);
        // Update costs when response is complete
        if (event.response?.usage) {
          this.costTracker.updateFromUsage(event.response.usage);
        }
        break;
        
      case 'output_audio_buffer.started':
        console.log('[EventHandler] Audio output buffer started');
        this.events.onAudioStart?.();
        break;
        
      case 'output_audio_buffer.stopped':
        console.log('[EventHandler] Audio output buffer stopped, response complete');
        // Notify that audio playback is complete
        this.events.onAudioComplete?.();
        break;
        
      case 'output_audio_buffer.cleared':
        console.log('[EventHandler] Audio output buffer cleared (interrupted)');
        this.events.onAudioInterrupted?.();
        break;
        
      case 'output_audio_buffer.speech_started':
        console.log('[EventHandler] Speech started in output buffer');
        break;
        
      case 'output_audio_buffer.speech_stopped':
        console.log('[EventHandler] Speech stopped in output buffer');
        break;
    }
  }

  setupDataChannel(dc: RTCDataChannel, onOpen: () => void | Promise<void>): void {
    console.log('[EventHandler] Setting up data channel...');
    
    dc.onopen = async () => {
      console.log('[EventHandler] Data channel opened!');
      await onOpen();
    };
    
    dc.onmessage = (e) => {
      const event = JSON.parse(e.data);
      this.handleRealtimeEvent(event);
    };
    
    dc.onerror = (error) => {
      console.error('[EventHandler] Data channel error:', error);
      this.events.onError?.(new Error('Data channel error'));
    };
    
    dc.onclose = () => {
      console.log('[EventHandler] Data channel closed');
    };
  }
}