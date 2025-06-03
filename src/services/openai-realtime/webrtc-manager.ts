/**
 * WebRTC Connection Management Module
 */

import { RealtimeConfig } from './types';

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private config: RealtimeConfig;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  async connect(): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
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
        throw new Error('WebRTC connection failed');
      }
    };
    
    // Monitor ICE connection state
    this.pc.oniceconnectionstatechange = () => {
      console.log('[WebRTCManager] ICE connection state:', this.pc?.iceConnectionState);
    };
    
    // Monitor ICE gathering state
    this.pc.onicegatheringstatechange = () => {
      console.log('[WebRTCManager] ICE gathering state:', this.pc?.iceGatheringState);
    };
    
    // Create data channel
    this.dc = this.pc.createDataChannel('oai-events');
    
    // Create and send offer
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

  addTrack(track: MediaStreamTrack): void {
    if (!this.pc) {
      throw new Error('Peer connection not initialized');
    }
    this.pc.addTrack(track);
  }

  setOnTrack(handler: (e: RTCTrackEvent) => void): void {
    if (!this.pc) {
      throw new Error('Peer connection not initialized');
    }
    this.pc.ontrack = handler;
  }

  disconnect(): void {
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