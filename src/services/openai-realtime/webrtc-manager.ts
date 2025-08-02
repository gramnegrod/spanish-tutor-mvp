/**
 * WebRTC Connection Management Module
 */

import { RealtimeConfig } from './types';

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private config: RealtimeConfig;
  private onConnectionError?: (error: Error) => void;
  private onConnectionRecovered?: () => void;
  private disconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  setErrorHandler(handler: (error: Error) => void): void {
    this.onConnectionError = handler;
  }

  setRecoveryHandler(handler: () => void): void {
    this.onConnectionRecovered = handler;
  }

  async connect(mediaStream?: MediaStream, onTrackHandler?: (e: RTCTrackEvent) => void): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
    console.log('[WebRTCManager] Starting connection process...');
    
    // Get ephemeral token
    console.log('[WebRTCManager] Fetching ephemeral key from:', this.config.tokenEndpoint);
    const ephemeralKey = await this.getEphemeralKey();
    console.log('[WebRTCManager] Got ephemeral key:', ephemeralKey.substring(0, 20) + '...');
    
    // Add validation
    if (!ephemeralKey || ephemeralKey.length < 20) {
      throw new Error('Invalid ephemeral key received');
    }
    
    // Create peer connection with ICE servers
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    console.log('[WebRTCManager] RTCPeerConnection created with ICE servers');
    
    // Monitor connection state
    this.pc.onconnectionstatechange = () => {
      console.log('[WebRTCManager] Connection state changed:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'failed') {
        const error = new Error('WebRTC connection failed');
        console.error('[WebRTCManager] Connection failed:', error);
        if (this.onConnectionError) {
          this.onConnectionError(error);
        }
      } else if (this.pc?.connectionState === 'disconnected') {
        console.log('[WebRTCManager] Connection disconnected');
      } else if (this.pc?.connectionState === 'connected') {
        console.log('[WebRTCManager] Connection established successfully');
      }
    };
    
    // Monitor ICE connection state
    this.pc.oniceconnectionstatechange = () => {
      console.log('[WebRTCManager] ICE connection state:', this.pc?.iceConnectionState);
      
      // Handle different ICE connection states
      if (this.pc?.iceConnectionState === 'checking') {
        console.log('[WebRTCManager] ICE checking in progress...');
      } else if (this.pc?.iceConnectionState === 'failed') {
        const error = new Error('ICE connection failed. Check network connectivity.');
        console.error('[WebRTCManager] ICE connection failed:', error);
        if (this.onConnectionError) {
          this.onConnectionError(error);
        }
      } else if (this.pc?.iceConnectionState === 'disconnected') {
        console.warn('[WebRTCManager] ICE connection disconnected - may be temporary, waiting for recovery...');
        
        // Clear any existing timer
        if (this.disconnectTimer) {
          clearTimeout(this.disconnectTimer);
        }
        
        // Set a timeout to check if it recovers
        this.disconnectTimer = setTimeout(() => {
          if (this.pc?.iceConnectionState === 'disconnected') {
            console.error('[WebRTCManager] ICE connection still disconnected after 5s');
            const error = new Error('ICE connection disconnected. Check network connectivity.');
            if (this.onConnectionError) {
              this.onConnectionError(error);
            }
          }
          this.disconnectTimer = null;
        }, 5000);
      } else if (this.pc?.iceConnectionState === 'connected' || this.pc?.iceConnectionState === 'completed') {
        console.log('[WebRTCManager] ICE connection established successfully');
        
        // Clear disconnect timer if connection recovered
        if (this.disconnectTimer) {
          clearTimeout(this.disconnectTimer);
          this.disconnectTimer = null;
          console.log('[WebRTCManager] Connection recovered, cancelled disconnect timer');
          
          // Notify about recovery
          if (this.onConnectionRecovered) {
            this.onConnectionRecovered();
          }
        }
      }
    };
    
    // Monitor ICE gathering state
    this.pc.onicegatheringstatechange = () => {
      console.log('[WebRTCManager] ICE gathering state:', this.pc?.iceGatheringState);
    };
    
    // Set up track handler if provided
    if (onTrackHandler) {
      console.log('[WebRTCManager] Setting up ontrack handler');
      this.pc.ontrack = onTrackHandler;
    }
    
    // Add microphone track BEFORE creating offer
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('[WebRTCManager] Adding microphone track to peer connection');
        this.pc.addTrack(audioTrack, mediaStream);
      } else {
        console.warn('[WebRTCManager] No audio track found in media stream');
      }
    } else {
      console.warn('[WebRTCManager] No media stream provided');
    }
    
    // Create data channel with error handling
    this.dc = this.pc.createDataChannel('oai-events');
    console.log('[WebRTCManager] Data channel created, initial state:', this.dc.readyState);
    
    // Add data channel state monitoring
    this.dc.onerror = (error) => {
      console.error('[WebRTCManager] Data channel error:', error);
    };
    
    this.dc.onclose = () => {
      console.log('[WebRTCManager] Data channel closed');
    };
    
    // Create and send offer (now with audio track)
    console.log('[WebRTCManager] Creating WebRTC offer...');
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    console.log('[WebRTCManager] Local description set');
    
    // Connect to OpenAI
    console.log('[WebRTCManager] Sending offer to OpenAI...');
    const answer = await this.sendOfferToOpenAI(offer.sdp!, ephemeralKey);
    console.log('[WebRTCManager] Got answer from OpenAI');
    await this.pc.setRemoteDescription(answer);
    console.log('[WebRTCManager] Remote description set');
    
    return { pc: this.pc, dc: this.dc };
  }

  private async getEphemeralKey(): Promise<string> {
    try {
      console.log('[WebRTCManager] Fetching ephemeral key from:', this.config.tokenEndpoint);
      const response = await fetch(this.config.tokenEndpoint!);
      console.log('[WebRTCManager] Session API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WebRTCManager] Session API error:', errorText);
        throw new Error(`Failed to get ephemeral key: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[WebRTCManager] Session API response:', { 
        hasClientSecret: !!data.client_secret,
        hasValue: !!data.client_secret?.value 
      });
      
      if (!data.client_secret?.value) {
        console.error('[WebRTCManager] Invalid response structure:', data);
        throw new Error('No client secret received');
      }
      
      return data.client_secret.value;
    } catch (error) {
      console.error('[WebRTCManager] Error in getEphemeralKey:', error);
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

  addTrack(track: MediaStreamTrack, stream?: MediaStream): void {
    if (!this.pc) {
      throw new Error('Peer connection not initialized');
    }
    if (stream) {
      this.pc.addTrack(track, stream);
    } else {
      // Legacy fallback
      this.pc.addTrack(track);
    }
  }

  setOnTrack(handler: (e: RTCTrackEvent) => void): void {
    if (!this.pc) {
      throw new Error('Peer connection not initialized');
    }
    this.pc.ontrack = handler;
  }

  disconnect(): void {
    // Clear any pending disconnect timer
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
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
    
    console.log('[WebRTCManager] Disconnected');
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  getDataChannel(): RTCDataChannel | null {
    return this.dc;
  }
}