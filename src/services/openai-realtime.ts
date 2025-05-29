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

export class OpenAIRealtimeService {
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
  
  // Pricing constants (per 1M tokens)
  private readonly PRICING = {
    audioInput: 100,      // $100 per 1M tokens (~$0.06/min)
    audioOutput: 200,     // $200 per 1M tokens (~$0.24/min)
    textInput: 5,         // $5 per 1M tokens
    textOutput: 20,       // $20 per 1M tokens
    audioTokensPerSecond: 1000  // Approximate tokens per second for audio
  };

  constructor(config: RealtimeConfig = {}, events: RealtimeEvents = {}) {
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
    try {
      this.audioElement = audioElement || this.createAudioElement();
      
      // Get ephemeral token
      this.updateStatus('Getting ephemeral key...');
      const ephemeralKey = await this.getEphemeralKey();
      
      // Create peer connection
      this.updateStatus('Creating connection...');
      this.pc = new RTCPeerConnection();
      
      // Set up audio playback
      this.pc.ontrack = (e) => {
        if (this.audioElement) {
          this.audioElement.srcObject = e.streams[0];
        }
      };
      
      // Monitor connection state
      this.pc.onconnectionstatechange = () => {
        console.log('Connection state:', this.pc?.connectionState);
        if (this.pc?.connectionState === 'disconnected' || this.pc?.connectionState === 'failed') {
          this.handleError(new Error('Connection lost'));
        }
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
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      // Connect to OpenAI
      const answer = await this.sendOfferToOpenAI(offer.sdp!, ephemeralKey);
      await this.pc.setRemoteDescription(answer);
      
      this.updateStatus('Connected!');
      this.startSessionTimers();
      this.events.onConnect?.();
      
    } catch (error) {
      this.handleError(error as Error);
      throw error;
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
    
    // Stop audio playback
    if (this.audioElement) {
      this.audioElement.srcObject = null;
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
    
    // Calculate audio costs
    const audioInputTokens = costs.audioInputSeconds * this.PRICING.audioTokensPerSecond;
    const audioOutputTokens = costs.audioOutputSeconds * this.PRICING.audioTokensPerSecond;
    
    costs.audioInputCost = (audioInputTokens / 1_000_000) * this.PRICING.audioInput;
    costs.audioOutputCost = (audioOutputTokens / 1_000_000) * this.PRICING.audioOutput;
    costs.textInputCost = (costs.textInputTokens / 1_000_000) * this.PRICING.textInput;
    costs.textOutputCost = (costs.textOutputTokens / 1_000_000) * this.PRICING.textOutput;
    
    costs.totalCost = costs.audioInputCost + costs.audioOutputCost + 
                      costs.textInputCost + costs.textOutputCost;
    
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
    const response = await fetch(this.config.tokenEndpoint!);
    if (!response.ok) {
      throw new Error(`Failed to get ephemeral key: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.client_secret?.value) {
      throw new Error('No client secret received');
    }
    
    return data.client_secret.value;
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
    
    this.dc.onopen = () => {
      this.configureSession();
    };
    
    this.dc.onmessage = (e) => {
      const event = JSON.parse(e.data);
      this.handleRealtimeEvent(event);
    };
    
    this.dc.onerror = (error) => {
      this.handleError(new Error('Data channel error'));
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
        break;
        
      case 'input_audio_buffer.speech_stopped':
        this.events.onSpeechStop?.();
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (this.config.enableInputTranscription) {
          this.events.onTranscript?.('user', event.transcript);
        }
        break;
        
      case 'response.audio_transcript.done':
        this.addToConversationHistory('assistant', event.transcript);
        this.events.onTranscript?.('assistant', event.transcript);
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
    const audio = document.createElement('audio');
    audio.autoplay = true;
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