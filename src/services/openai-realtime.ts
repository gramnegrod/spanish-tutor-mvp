/**
 * OpenAI Realtime API WebRTC Service
 * 
 * A modular, reusable service for implementing OpenAI's Realtime API
 * using WebRTC for browser-based speech-to-speech conversations.
 */

export interface RealtimeConfig {
  // Server endpoint that generates ephemeral tokens
  tokenEndpoint?: string;
  
  // Session configuration
  model?: string;
  voice?: 'alloy' | 'verse';
  instructions?: string;
  temperature?: number;
  
  // Audio settings
  inputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  outputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  
  // Turn detection settings
  turnDetection?: {
    type?: 'server_vad' | 'none';
    threshold?: number;
    prefixPaddingMs?: number;
    silenceDurationMs?: number;
  };
  
  // Enable input transcription (not recommended for multilingual)
  enableInputTranscription?: boolean;
}

export interface SessionInfo {
  currentSession: number; // 1, 2, or 3
  maxSessions: number; // 3
  sessionTimeMinutes: number; // 10
  totalTimeMinutes: number;
  canExtend: boolean;
}

export interface RealtimeEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onSpeechStart?: () => void;
  onSpeechStop?: () => void;
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
  onStatusUpdate?: (status: string) => void;
  onCostUpdate?: (costs: CostTracking) => void;
  onTimeWarning?: (minutesLeft: number, totalCost: number) => void;
  onSessionComplete?: (sessionInfo: SessionInfo, totalCost: number) => Promise<boolean>; // Returns true if user wants to extend
  onMaxSessionsReached?: (totalCost: number, totalMinutes: number) => void;
}

export interface CostTracking {
  audioInputSeconds: number;
  audioOutputSeconds: number;
  textInputTokens: number;
  textOutputTokens: number;
  audioInputCost: number;
  audioOutputCost: number;
  textInputCost: number;
  textOutputCost: number;
  totalCost: number;
}

// Global initialization lock to prevent race conditions
let globalInitLock = false;

export class OpenAIRealtimeService {
  private static activeInstance: OpenAIRealtimeService | null = null;
  
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mediaStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private config: RealtimeConfig;
  private events: RealtimeEvents;
  
  // Session management
  private sessionStartTime: Date | null = null;
  private currentSession: number = 1;
  private maxSessions: number = 3;
  private sessionTimeLimit: number = 10 * 60 * 1000; // 10 minutes in ms
  private warningTimer: NodeJS.Timeout | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  
  // Conversation history for smart summary
  private conversationHistory: Array<{role: 'user' | 'assistant', text: string, timestamp: Date}> = [];
  private summarizedContext: string = '';
  private speechStartTime: number | null = null;
  
  // Cost tracking
  private costTracking: CostTracking = {
    audioInputSeconds: 0,
    audioOutputSeconds: 0,
    textInputTokens: 0,
    textOutputTokens: 0,
    audioInputCost: 0,
    audioOutputCost: 0,
    textInputCost: 0,
    textOutputCost: 0,
    totalCost: 0
  };
  
  // Pricing constants - OpenAI Realtime API pricing as of Jan 2025
  private readonly PRICING = {
    // Audio pricing is per minute, not per token!
    audioInputPerMinute: 0.06,    // $0.06 per minute of audio input
    audioOutputPerMinute: 0.24,   // $0.24 per minute of audio output
    textInput: 5,                 // $5 per 1M tokens (not used in voice-only)
    textOutput: 20,               // $20 per 1M tokens (not used in voice-only)
  };

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
      
      // Prevent duplicate connections
      if (this.pc && (this.pc.connectionState === 'connected' || this.pc.connectionState === 'connecting')) {
        console.warn('[OpenAIRealtimeService] Already connected or connecting, skipping...');
        globalInitLock = false; // Release lock before returning
        return;
      }
      
      // If an audio element is provided, mark it as external
      if (audioElement) {
        audioElement.setAttribute('data-external', 'true');
      }
      
      this.audioElement = audioElement || this.createAudioElement();
      console.log('[OpenAIRealtimeService] Audio element ready');
      
      // Get ephemeral token
      this.updateStatus('Getting ephemeral key...');
      console.log('[OpenAIRealtimeService] Fetching ephemeral key from:', this.config.tokenEndpoint);
      const ephemeralKey = await this.getEphemeralKey();
      console.log('[OpenAIRealtimeService] Got ephemeral key:', ephemeralKey.substring(0, 20) + '...');
      
      // Add validation
      if (!ephemeralKey || ephemeralKey.length < 20) {
        throw new Error('Invalid ephemeral key received');
      }
      
      // Create peer connection with ICE servers
      this.updateStatus('Creating connection...');
      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      console.log('[OpenAIRealtimeService] RTCPeerConnection created with ICE servers');
      
      // Set up audio playback
      this.pc.ontrack = (e) => {
        console.log('[OpenAIRealtimeService] Received audio track:', e.track.kind);
        if (this.audioElement && e.track.kind === 'audio') {
          // Ensure we only set the stream once and it's not the same stream
          const currentStream = this.audioElement.srcObject as MediaStream;
          if (!currentStream || currentStream.id !== e.streams[0].id) {
            // Remove old stream if exists
            if (currentStream) {
              currentStream.getTracks().forEach(track => track.stop());
            }
            this.audioElement.srcObject = e.streams[0];
            console.log('[OpenAIRealtimeService] Audio stream attached to element');
          } else {
            console.warn('[OpenAIRealtimeService] Audio element already has this stream, ignoring...');
          }
        }
      };
      
      // Monitor connection state
      this.pc.onconnectionstatechange = () => {
        console.log('[OpenAIRealtimeService] Connection state changed:', this.pc?.connectionState);
        if (this.pc?.connectionState === 'disconnected' || this.pc?.connectionState === 'failed') {
          console.error('[OpenAIRealtimeService] Connection lost - state:', this.pc?.connectionState);
          // Don't immediately error on disconnect, give it a chance to reconnect
          if (this.pc?.connectionState === 'failed') {
            this.handleError(new Error('Connection failed'));
          }
        } else if (this.pc?.connectionState === 'connected') {
          console.log('[OpenAIRealtimeService] WebRTC connection established!');
        }
      };
      
      // Monitor ICE connection state
      this.pc.oniceconnectionstatechange = () => {
        console.log('[OpenAIRealtimeService] ICE connection state:', this.pc?.iceConnectionState);
        if (this.pc?.iceConnectionState === 'failed') {
          console.error('[OpenAIRealtimeService] ICE connection failed');
        }
      };
      
      // Monitor ICE gathering state
      this.pc.onicegatheringstatechange = () => {
        console.log('[OpenAIRealtimeService] ICE gathering state:', this.pc?.iceGatheringState);
      };
      
      // Add microphone
      this.updateStatus('Requesting microphone access...');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pc.addTrack(this.mediaStream.getTracks()[0]);
      
      // Create data channel
      this.dc = this.pc.createDataChannel('oai-events');
      this.setupDataChannel();
      
      // Create and send offer
      this.updateStatus('Connecting to OpenAI...');
      console.log('[OpenAIRealtimeService] Creating WebRTC offer...');
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      console.log('[OpenAIRealtimeService] Local description set');
      
      // Connect to OpenAI
      console.log('[OpenAIRealtimeService] Sending offer to OpenAI...');
      const answer = await this.sendOfferToOpenAI(offer.sdp!, ephemeralKey);
      console.log('[OpenAIRealtimeService] Got answer from OpenAI');
      await this.pc.setRemoteDescription(answer);
      console.log('[OpenAIRealtimeService] Remote description set');
      
      this.updateStatus('Connected!');
      console.log('[OpenAIRealtimeService] Successfully connected!');
      this.startSessionTimers();
      this.events.onConnect?.();
      console.log('[OpenAIRealtimeService] onConnect event fired');
      
    } catch (error) {
      console.error('[OpenAIRealtimeService] Connection error:', error);
      this.handleError(error as Error);
      throw error;
    } finally {
      // Release global lock
      globalInitLock = false;
    }
  }

  private startSessionTimers(): void {
    this.sessionStartTime = new Date();
    
    // Set warning timer (8 minutes)
    this.warningTimer = setTimeout(() => {
      this.events.onTimeWarning?.(2, this.costTracking.totalCost);
    }, 8 * 60 * 1000);
    
    // Set session limit timer (10 minutes)
    this.sessionTimer = setTimeout(async () => {
      await this.handleSessionComplete();
    }, this.sessionTimeLimit);
  }

  disconnect(): void {
    console.log('[OpenAIRealtimeService] Disconnect called');
    console.trace(); // Log stack trace to see where disconnect is being called from
    
    // Clear timers
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Close data channel
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    
    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    
    // Stop audio playback and remove element if we created it
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      // Remove from DOM if we created it
      if (this.audioElement.parentNode && !this.audioElement.hasAttribute('data-external')) {
        this.audioElement.remove();
      }
      this.audioElement = null;
    }
    
    // Clear active instance if it's this one
    if (OpenAIRealtimeService.activeInstance === this) {
      OpenAIRealtimeService.activeInstance = null;
    }
    
    this.updateStatus('Disconnected');
    this.events.onDisconnect?.();
  }


  private async handleSessionComplete(): Promise<void> {
    const sessionInfo: SessionInfo = {
      currentSession: this.currentSession,
      maxSessions: this.maxSessions,
      sessionTimeMinutes: this.sessionTimeLimit / (60 * 1000),
      totalTimeMinutes: this.currentSession * (this.sessionTimeLimit / (60 * 1000)),
      canExtend: this.currentSession < this.maxSessions
    };

    if (this.currentSession >= this.maxSessions) {
      // Max sessions reached
      this.events.onMaxSessionsReached?.(
        this.costTracking.totalCost,
        sessionInfo.totalTimeMinutes
      );
      await this.restartConversation();
    } else {
      // Ask user if they want to extend
      const shouldExtend = await this.events.onSessionComplete?.(
        sessionInfo,
        this.costTracking.totalCost
      );
      
      if (shouldExtend) {
        this.currentSession++;
        this.startSessionTimers(); // Start new 10-minute timer
      } else {
        await this.restartConversation();
      }
    }
  }

  private async restartConversation(): Promise<void> {
    // Reset session state
    this.currentSession = 1;
    this.conversationHistory = [];
    this.summarizedContext = '';
    
    // Reset costs
    this.costTracking = {
      audioInputSeconds: 0,
      audioOutputSeconds: 0,
      textInputTokens: 0,
      textOutputTokens: 0,
      audioInputCost: 0,
      audioOutputCost: 0,
      textInputCost: 0,
      textOutputCost: 0,
      totalCost: 0
    };
    
    // Reconnect with fresh context
    await this.reconnect();
  }
  
  private calculateCosts(): void {
    const costs = { ...this.costTracking };
    
    // Convert seconds to minutes for pricing calculation
    const audioInputMinutes = costs.audioInputSeconds / 60;
    const audioOutputMinutes = costs.audioOutputSeconds / 60;
    
    // Calculate audio costs based on per-minute pricing
    costs.audioInputCost = audioInputMinutes * this.PRICING.audioInputPerMinute;
    costs.audioOutputCost = audioOutputMinutes * this.PRICING.audioOutputPerMinute;
    
    // Text costs are minimal in voice conversations (only for instructions)
    costs.textInputCost = (costs.textInputTokens / 1_000_000) * this.PRICING.textInput;
    costs.textOutputCost = (costs.textOutputTokens / 1_000_000) * this.PRICING.textOutput;
    
    costs.totalCost = costs.audioInputCost + costs.audioOutputCost + 
                      costs.textInputCost + costs.textOutputCost;
    
    // Debug logging with corrected calculation
    if (costs.audioInputSeconds > 0 || costs.audioOutputSeconds > 0) {
      console.log('[OpenAIRealtimeService] Cost Update:', {
        inputSeconds: costs.audioInputSeconds.toFixed(2),
        outputSeconds: costs.audioOutputSeconds.toFixed(2),
        inputMinutes: audioInputMinutes.toFixed(2),
        outputMinutes: audioOutputMinutes.toFixed(2),
        inputCost: `$${costs.audioInputCost.toFixed(4)}`,
        outputCost: `$${costs.audioOutputCost.toFixed(4)}`,
        totalCost: `$${costs.totalCost.toFixed(4)}`
      });
    }
    
    this.costTracking = costs;
    this.events.onCostUpdate?.(costs);
  }
  
  private trackAudioDuration(type: 'input' | 'output', durationMs: number): void {
    const durationSeconds = durationMs / 1000;
    
    if (type === 'input') {
      this.costTracking.audioInputSeconds += durationSeconds;
    } else {
      this.costTracking.audioOutputSeconds += durationSeconds;
    }
    
    this.calculateCosts();
  }

  private async getEphemeralKey(): Promise<string> {
    try {
      console.log('[OpenAIRealtimeService] Fetching ephemeral key from:', this.config.tokenEndpoint);
      const response = await fetch(this.config.tokenEndpoint!);
      console.log('[OpenAIRealtimeService] Session API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenAIRealtimeService] Session API error:', errorText);
        throw new Error(`Failed to get ephemeral key: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[OpenAIRealtimeService] Session API response:', { 
        hasClientSecret: !!data.client_secret,
        hasValue: !!data.client_secret?.value 
      });
      
      if (!data.client_secret?.value) {
        console.error('[OpenAIRealtimeService] Invalid response structure:', data);
        throw new Error('No client secret received');
      }
      
      return data.client_secret.value;
    } catch (error) {
      console.error('[OpenAIRealtimeService] Error in getEphemeralKey:', error);
      throw error;
    }
  }

  private async sendOfferToOpenAI(sdp: string, ephemeralKey: string): Promise<RTCSessionDescriptionInit> {
    const baseUrl = 'https://api.openai.com/v1/realtime';
    const response = await fetch(`${baseUrl}?model=${this.config.model}`, {
      method: 'POST',
      body: sdp,
      headers: {
        'Authorization': `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI error: ${response.status} - ${error}`);
    }
    
    return {
      type: 'answer',
      sdp: await response.text()
    };
  }

  private setupDataChannel(): void {
    if (!this.dc) return;
    
    console.log('[OpenAIRealtimeService] Setting up data channel...');
    
    this.dc.onopen = () => {
      console.log('[OpenAIRealtimeService] Data channel opened!');
      this.configureSession();
    };
    
    this.dc.onmessage = (e) => {
      const event = JSON.parse(e.data);
      console.log('[OpenAIRealtimeService] Received event:', event.type);
      this.handleRealtimeEvent(event);
    };
    
    this.dc.onerror = (error) => {
      console.error('[OpenAIRealtimeService] Data channel error:', error);
      this.handleError(new Error('Data channel error'));
    };
    
    this.dc.onclose = () => {
      console.log('[OpenAIRealtimeService] Data channel closed');
    };
  }

  private configureSession(): void {
    if (!this.dc) return;
    
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
    }
    
    this.dc.send(JSON.stringify(sessionConfig));
  }

  private handleRealtimeEvent(event: any): void {
    switch (event.type) {
      case 'error':
        this.handleError(new Error(event.error.message));
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
          this.trackAudioDuration('input', speechDuration);
          this.speechStartTime = null;
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        // Track user speech when transcription is completed
        this.events.onTranscript?.('user', event.transcript);
        // Also attempt to track audio duration from transcript timing
        if (event.duration_ms) {
          this.trackAudioDuration('input', event.duration_ms);
        }
        break;
        
      case 'response.audio_transcript.done':
        console.log('[OpenAIRealtimeService] Assistant transcript:', event.transcript);
        this.addToConversationHistory('assistant', event.transcript);
        this.events.onTranscript?.('assistant', event.transcript);
        break;
        
      case 'response.audio_transcript.delta':
        console.log('[OpenAIRealtimeService] Assistant transcript delta:', event.delta);
        break;
        
      // Cost tracking events
      case 'response.audio.delta':
        // Track audio output duration
        if (event.delta && event.delta.length > 0) {
          // PCM16 audio: 2 bytes per sample, 24000 samples per second
          const bytesPerSecond = 24000 * 2;
          const durationMs = (event.delta.length / bytesPerSecond) * 1000;
          this.trackAudioDuration('output', durationMs);
        }
        break;
        
      case 'input_audio_buffer.committed':
        // Track audio input duration
        if (event.item_id && event.audio_duration_ms) {
          this.trackAudioDuration('input', event.audio_duration_ms);
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
              this.costTracking.textInputTokens += estimatedTokens;
            } else if (event.item.role === 'assistant') {
              this.costTracking.textOutputTokens += estimatedTokens;
            }
            this.calculateCosts();
          }
        }
        break;
        
      case 'response.done':
        // Update costs when response is complete
        if (event.response?.usage) {
          // Use actual token counts if available
          if (event.response.usage.input_tokens) {
            this.costTracking.textInputTokens = event.response.usage.input_tokens;
          }
          if (event.response.usage.output_tokens) {
            this.costTracking.textOutputTokens = event.response.usage.output_tokens;
          }
          this.calculateCosts();
        }
        break;
    }
  }

  private updateStatus(status: string): void {
    this.events.onStatusUpdate?.(status);
  }

  private handleError(error: Error): void {
    console.error('OpenAI Realtime Error:', error);
    this.events.onError?.(error);
  }

  private createAudioElement(): HTMLAudioElement {
    // Clean up any existing audio elements first
    const existingAudio = document.querySelectorAll('audio[data-openai-realtime="true"]');
    existingAudio.forEach(audio => {
      console.warn('[OpenAIRealtimeService] Removing orphaned audio element');
      audio.remove();
    });
    
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.setAttribute('data-openai-realtime', 'true');
    // Add to body so it persists
    document.body.appendChild(audio);
    return audio;
  }

  // Public methods for advanced usage
  
  sendMessage(message: string): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not open');
    }
    this.dc.send(message);
  }
  
  updateInstructions(instructions: string): void {
    this.config.instructions = instructions;
    if (this.dc && this.dc.readyState === 'open') {
      this.configureSession();
    }
  }
  
  // Add reconnection method
  async reconnect(): Promise<void> {
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.connect(this.audioElement || undefined);
  }
  
  private addToConversationHistory(role: 'user' | 'assistant', text: string): void {
    this.conversationHistory.push({
      role,
      text,
      timestamp: new Date()
    });
    
    // Check if we need to summarize (every 20 messages)
    if (this.conversationHistory.length > 20) {
      this.smartSummarize();
    }
  }
  
  private smartSummarize(): void {
    // Keep last 5 exchanges (10 messages) verbatim
    const keepCount = 10;
    const messagesToSummarize = this.conversationHistory.slice(0, -keepCount);
    const messagesToKeep = this.conversationHistory.slice(-keepCount);
    
    if (messagesToSummarize.length === 0) return;
    
    // Create summary of older messages
    const summary = this.createSummary(messagesToSummarize);
    
    // Update summarized context
    if (this.summarizedContext) {
      this.summarizedContext += ` ${summary}`;
    } else {
      this.summarizedContext = `Previous conversation summary: ${summary}`;
    }
    
    // Keep only recent messages
    this.conversationHistory = messagesToKeep;
    
    console.log('Smart summary applied. Context optimized.');
  }
  
  private createSummary(messages: Array<{role: 'user' | 'assistant', text: string, timestamp: Date}>): string {
    // Simple summarization logic - in production, you might use an LLM for this
    const topics = new Set<string>();
    const userQuestions = [];
    const tutorResponses = [];
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        userQuestions.push(msg.text);
        // Extract potential topics (very simple keyword extraction)
        const words = msg.text.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 4 && !['para', 'donde', 'como', 'cuando', 'porque'].includes(word)) {
            topics.add(word);
          }
        });
      } else {
        tutorResponses.push(msg.text);
      }
    }
    
    const topicList = Array.from(topics).slice(0, 5).join(', ');
    
    return `User practiced Spanish conversation covering topics: ${topicList}. ` +
           `The tutor helped with vocabulary, pronunciation, and cultural context. ` +
           `Conversation was friendly and educational.`;
  }
  
  getCurrentCosts(): CostTracking {
    return { ...this.costTracking };
  }
  
  resetCostTracking(): void {
    this.costTracking = {
      audioInputSeconds: 0,
      audioOutputSeconds: 0,
      textInputTokens: 0,
      textOutputTokens: 0,
      audioInputCost: 0,
      audioOutputCost: 0,
      textInputCost: 0,
      textOutputCost: 0,
      totalCost: 0
    };
    this.events.onCostUpdate?.(this.costTracking);
  }
}