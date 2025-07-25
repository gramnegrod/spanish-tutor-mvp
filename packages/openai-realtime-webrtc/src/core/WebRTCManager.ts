/**
 * Simple WebRTCManager for OpenAI Realtime API
 * 
 * Handles WebRTC connections directly without unnecessary abstractions
 * Following OpenAI's simple example pattern
 */

import { EventEmitter } from 'eventemitter3';

export interface WebRTCConfig {
  tokenEndpoint?: string;
  model?: string;
  iceServers?: RTCIceServer[];
  audioConstraints?: MediaTrackConstraints;
  debug?: boolean;
}

export interface ConnectionState {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  dataChannelState: RTCDataChannelState | null;
  isAudioStreaming: boolean;
}

export interface WebRTCEvents {
  connected: () => void;
  disconnected: (reason?: string) => void;
  connectionFailed: (error: Error) => void;
  dataChannelMessage: (data: string | ArrayBuffer) => void;
  audioTrackReceived: (track: MediaStreamTrack) => void;
  connectionStateChanged: (state: ConnectionState) => void;
  dataChannelReady: () => void;
}

/**
 * Simple WebRTC Manager for OpenAI Realtime API
 */
export class WebRTCManager extends EventEmitter<WebRTCEvents> {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private ephemeralToken: string | null = null;

  constructor(config: WebRTCConfig = {}) {
    super();
    this.config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      model: 'gpt-4o-realtime-preview-2024-12-17',
      debug: false,
      ...config
    };
  }

  /**
   * Initialize WebRTC connection
   */
  async initialize(): Promise<void> {
    if (this.peerConnection) {
      throw new Error('WebRTC already initialized');
    }

    try {
      console.log('[WebRTC] Starting initialization...');
      // Get ephemeral token if endpoint provided
      if (this.config.tokenEndpoint) {
        console.log('[WebRTC] Getting ephemeral token from:', this.config.tokenEndpoint);
        this.ephemeralToken = await this.getEphemeralToken();
        console.log('[WebRTC] Got ephemeral token');
      } else {
        console.log('[WebRTC] No token endpoint provided');
      }

      // Create peer connection
      console.log('[WebRTC] Creating peer connection...');
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers
      });
      this.setupPeerConnectionHandlers();

      // Setup microphone
      console.log('[WebRTC] Setting up microphone...');
      this.localStream = await this.setupLocalMedia();
      if (this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
          this.peerConnection.addTrack(audioTrack, this.localStream);
          console.log('[WebRTC] Added audio track');
        }
      }

      // Create data channel
      console.log('[WebRTC] Creating data channel...');
      this.dataChannel = this.peerConnection.createDataChannel('oai-events', {
        ordered: true
      });
      this.setupDataChannelHandlers();

      // Complete negotiation if we have a token
      if (this.ephemeralToken) {
        console.log('[WebRTC] Starting negotiation...');
        await this.completeNegotiation();
      } else {
        console.log('[WebRTC] No token available, skipping negotiation');
      }
    } catch (error) {
      this.cleanup();
      throw new Error(`Failed to initialize WebRTC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send data through data channel
   */
  sendData(data: string | ArrayBuffer): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not available');
    }
    
    // DataChannel.send() only accepts string for text data or ArrayBufferView for binary
    if (typeof data === 'string') {
      this.dataChannel.send(data);
    } else {
      // Convert ArrayBuffer to Uint8Array (which is an ArrayBufferView)
      this.dataChannel.send(new Uint8Array(data));
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected';
  }

  /**
   * Check if data channel is open
   */
  isDataChannelOpen(): boolean {
    return this.dataChannel?.readyState === 'open';
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return {
      connectionState: this.peerConnection?.connectionState || 'new',
      iceConnectionState: this.peerConnection?.iceConnectionState || 'new',
      dataChannelState: this.dataChannel?.readyState || null,
      isAudioStreaming: !!this.localStream
    };
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    this.cleanup();
    this.emit('disconnected');
  }

  /**
   * Dispose manager
   */
  dispose(): void {
    this.cleanup();
    this.removeAllListeners();
  }

  // Private methods

  private async getEphemeralToken(): Promise<string> {
    if (!this.config.tokenEndpoint) {
      throw new Error('Token endpoint not configured');
    }

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status}`);
    }

    const data = await response.json();
    return data.client_secret?.value || data.token;
  }

  private async setupLocalMedia(): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: this.config.audioConstraints || {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        },
        video: false
      };

      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      throw new Error(`Failed to get user media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async completeNegotiation(): Promise<void> {
    if (!this.peerConnection || !this.ephemeralToken) {
      console.log('[WebRTC] Missing peer connection or token');
      return;
    }

    console.log('[WebRTC] Creating offer...');
    // Create offer
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false
    });
    await this.peerConnection.setLocalDescription(offer);

    // Send offer to OpenAI
    const baseUrl = 'https://api.openai.com';
    const model = this.config.model || 'gpt-4o-realtime-preview-2024-12-17';
    const url = `${baseUrl}/v1/realtime?model=${model}`;
    
    console.log('[WebRTC] Sending offer to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'Authorization': `Bearer ${this.ephemeralToken}`,
        'OpenAI-Beta': 'realtime=v1'
      },
      body: offer.sdp
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[WebRTC] Failed response:', response.status, text);
      throw new Error(`Failed to get answer: ${response.status} - ${text}`);
    }

    console.log('[WebRTC] Got answer from OpenAI');
    const answerSdp = await response.text();
    const answer: RTCSessionDescriptionInit = {
      type: 'answer',
      sdp: answerSdp
    };

    await this.peerConnection.setRemoteDescription(answer);
    console.log('[WebRTC] Remote description set successfully');
  }

  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      
      if (state === 'connected') {
        this.emit('connected');
      } else if (state === 'failed') {
        this.emit('connectionFailed', new Error('WebRTC connection failed'));
      } else if (state === 'disconnected' || state === 'closed') {
        this.emit('disconnected', 'Connection closed');
      }

      this.emit('connectionStateChanged', this.getConnectionState());
    };

    this.peerConnection.ontrack = (event) => {
      if (event.track) {
        this.emit('audioTrackReceived', event.track);
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannelHandlers(event.channel);
    };
  }

  private setupDataChannelHandlers(channel?: RTCDataChannel): void {
    const dc = channel || this.dataChannel;
    if (!dc) return;

    dc.onopen = () => {
      console.log('[WebRTC] Data channel opened');
      this.emit('dataChannelReady');
      this.emit('connectionStateChanged', this.getConnectionState());
    };

    dc.onclose = () => {
      console.log('[WebRTC] Data channel closed');
      this.emit('connectionStateChanged', this.getConnectionState());
    };

    dc.onerror = (error) => {
      console.error('[WebRTC] Data channel error:', error);
      this.emit('connectionFailed', new Error(`Data channel error: ${error}`));
    };

    dc.onmessage = (event) => {
      this.emit('dataChannelMessage', event.data);
    };
  }

  private cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.ephemeralToken = null;
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[WebRTCManager] ${message}`, ...args);
    }
  }
}

export default WebRTCManager;