/**
 * WebRTC Mock implementations for testing
 * Provides comprehensive mocks for RTCPeerConnection, RTCDataChannel, and related APIs
 */

export class MockRTCPeerConnection implements RTCPeerConnection {
  connectionState: RTCPeerConnectionState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  iceGatheringState: RTCIceGatheringState = 'new';
  signalingState: RTCSignalingState = 'stable';
  localDescription: RTCSessionDescription | null = null;
  remoteDescription: RTCSessionDescription | null = null;
  
  // Event handlers
  onconnectionstatechange: ((_this: RTCPeerConnection, _ev: Event) => any) | null = null;
  onicecandidate: ((_this: RTCPeerConnection, _ev: RTCPeerConnectionIceEvent) => any) | null = null;
  oniceconnectionstatechange: ((_this: RTCPeerConnection, _ev: Event) => any) | null = null;
  onicegatheringstatechange: ((_this: RTCPeerConnection, _ev: Event) => any) | null = null;
  ontrack: ((_this: RTCPeerConnection, _ev: RTCTrackEvent) => any) | null = null;
  ondatachannel: ((_this: RTCPeerConnection, _ev: RTCDataChannelEvent) => any) | null = null;
  onnegotiationneeded: ((_this: RTCPeerConnection, _ev: Event) => any) | null = null;
  onsignalingstatechange: ((_this: RTCPeerConnection, _ev: Event) => any) | null = null;
  onicecandidateerror: ((_this: RTCPeerConnection, _ev: Event) => any) | null = null;
  
  private dataChannels: Map<string, MockRTCDataChannel> = new Map();
  private senders: RTCRtpSender[] = [];
  private receivers: RTCRtpReceiver[] = [];
  private transceivers: RTCRtpTransceiver[] = [];

  constructor(public _configuration?: RTCConfiguration) {}

  async createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    return {
      type: 'offer',
      sdp: 'mock-offer-sdp'
    };
  }

  async createAnswer(_options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> {
    return {
      type: 'answer',
      sdp: 'mock-answer-sdp'
    };
  }

  async setLocalDescription(description?: RTCLocalSessionDescriptionInit): Promise<void> {
    this.localDescription = description as RTCSessionDescription;
    this.signalingState = 'have-local-offer';
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    this.remoteDescription = description as RTCSessionDescription;
    this.signalingState = 'stable';
  }

  createDataChannel(label: string, _options?: RTCDataChannelInit): RTCDataChannel {
    const channel = new MockRTCDataChannel(label, _options);
    this.dataChannels.set(label, channel);
    return channel as unknown as RTCDataChannel;
  }

  async addIceCandidate(_candidate?: RTCIceCandidateInit): Promise<void> {
    // Mock implementation
  }

  addTrack(track: MediaStreamTrack, ..._streams: MediaStream[]): RTCRtpSender {
    const sender = { track } as RTCRtpSender;
    this.senders.push(sender);
    return sender;
  }

  removeTrack(sender: RTCRtpSender): void {
    this.senders = this.senders.filter(s => s !== sender);
  }

  getSenders(): RTCRtpSender[] {
    return this.senders;
  }

  getReceivers(): RTCRtpReceiver[] {
    return this.receivers;
  }

  getTransceivers(): RTCRtpTransceiver[] {
    return this.transceivers;
  }

  close(): void {
    this.connectionState = 'closed';
    this.iceConnectionState = 'closed';
    this.dataChannels.forEach(channel => channel.close());
  }

  // Simulate connection state changes
  simulateConnectionStateChange(state: RTCPeerConnectionState): void {
    this.connectionState = state;
    this.onconnectionstatechange?.(new Event('connectionstatechange'));
  }

  simulateIceConnectionStateChange(state: RTCIceConnectionState): void {
    this.iceConnectionState = state;
    this.oniceconnectionstatechange?.(new Event('iceconnectionstatechange'));
  }

  simulateDataChannel(label: string): void {
    const channel = new MockRTCDataChannel(label);
    const event = {
      channel: channel as unknown as RTCDataChannel
    } as RTCDataChannelEvent;
    this.ondatachannel?.(event);
  }

  // Other required methods
  addTransceiver(_trackOrKind: MediaStreamTrack | string, _init?: RTCRtpTransceiverInit): RTCRtpTransceiver {
    const transceiver = {} as RTCRtpTransceiver;
    this.transceivers.push(transceiver);
    return transceiver;
  }

  async getStats(_selector?: MediaStreamTrack | null): Promise<RTCStatsReport> {
    return new Map() as RTCStatsReport;
  }

  restartIce(): void {}
  getConfiguration(): RTCConfiguration { return this._configuration || {}; }
  setConfiguration(configuration?: RTCConfiguration): void { this._configuration = configuration; }
  
  // EventTarget methods
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }

  // Additional properties
  canTrickleIceCandidates: boolean | null = null;
  currentLocalDescription: RTCSessionDescription | null = null;
  currentRemoteDescription: RTCSessionDescription | null = null;
  pendingLocalDescription: RTCSessionDescription | null = null;
  pendingRemoteDescription: RTCSessionDescription | null = null;
  sctp: RTCSctpTransport | null = null;
}

export class MockRTCDataChannel {
  readyState: RTCDataChannelState = 'connecting';
  label: string;
  ordered: boolean;
  maxPacketLifeTime: number | null = null;
  maxRetransmits: number | null = null;
  protocol: string = '';
  negotiated: boolean = false;
  id: number | null = null;
  binaryType: BinaryType = 'arraybuffer';
  bufferedAmount: number = 0;
  bufferedAmountLowThreshold: number = 0;
  
  onopen: ((_this: RTCDataChannel, _ev: Event) => any) | null = null;
  onclose: ((_this: RTCDataChannel, _ev: Event) => any) | null = null;
  onerror: ((_this: RTCDataChannel, _ev: Event) => any) | null = null;
  onmessage: ((_this: RTCDataChannel, _ev: MessageEvent) => any) | null = null;
  onbufferedamountlow: ((_this: RTCDataChannel, _ev: Event) => any) | null = null;
  onclosing: ((_this: RTCDataChannel, _ev: Event) => any) | null = null;

  private messageQueue: any[] = [];

  constructor(label: string, _options?: RTCDataChannelInit) {
    this.label = label;
    this.ordered = _options?.ordered ?? true;
    this.maxPacketLifeTime = _options?.maxPacketLifeTime ?? null;
    this.maxRetransmits = _options?.maxRetransmits ?? null;
    this.protocol = _options?.protocol ?? '';
    this.negotiated = _options?.negotiated ?? false;
    this.id = _options?.id ?? null;
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    if (this.readyState !== 'open') {
      throw new Error('DataChannel is not open');
    }
    this.messageQueue.push(data);
  }

  close(): void {
    this.readyState = 'closing';
    setTimeout(() => {
      this.readyState = 'closed';
      this.onclose?.(new Event('close'));
    }, 0);
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = 'open';
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: any): void {
    const event = new MessageEvent('message', { data });
    this.onmessage?.(event);
  }

  simulateError(error: string): void {
    const event = new ErrorEvent('error', { message: error });
    this.onerror?.(event);
  }

  getMessageQueue(): any[] {
    return this.messageQueue;
  }

  clearMessageQueue(): void {
    this.messageQueue = [];
  }
}

// Mock MediaStream and MediaStreamTrack
export class MockMediaStream implements MediaStream {
  active = true;
  id: string;
  private tracks: MediaStreamTrack[] = [];

  constructor(tracks: MediaStreamTrack[] = []) {
    this.id = `mock-stream-${Date.now()}`;
    this.tracks = tracks;
  }

  getTracks(): MediaStreamTrack[] {
    return this.tracks;
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks.filter(t => t.kind === 'audio');
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.tracks.filter(t => t.kind === 'video');
  }

  addTrack(track: MediaStreamTrack): void {
    this.tracks.push(track);
  }

  removeTrack(track: MediaStreamTrack): void {
    this.tracks = this.tracks.filter(t => t !== track);
  }

  getTrackById(id: string): MediaStreamTrack | null {
    return this.tracks.find(t => t.id === id) || null;
  }

  clone(): MediaStream {
    return new MockMediaStream(this.tracks.map(t => t.clone()));
  }

  // EventTarget methods
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
  onaddtrack: ((_this: MediaStream, _ev: MediaStreamTrackEvent) => any) | null = null;
  onremovetrack: ((_this: MediaStream, _ev: MediaStreamTrackEvent) => any) | null = null;
}

export class MockMediaStreamTrack implements MediaStreamTrack {
  enabled = true;
  id: string;
  kind: string;
  label: string;
  muted = false;
  readyState: MediaStreamTrackState = 'live';
  isolated = false;
  contentHint = '';

  constructor(kind: 'audio' | 'video' = 'audio') {
    this.id = `mock-track-${Date.now()}`;
    this.kind = kind;
    this.label = `Mock ${kind} Track`;
  }

  stop(): void {
    this.readyState = 'ended';
  }

  clone(): MediaStreamTrack {
    const cloned = new MockMediaStreamTrack(this.kind as 'audio' | 'video');
    cloned.enabled = this.enabled;
    cloned.muted = this.muted;
    return cloned;
  }

  getCapabilities(): MediaTrackCapabilities {
    return {};
  }

  getConstraints(): MediaTrackConstraints {
    return {};
  }

  getSettings(): MediaTrackSettings {
    return {
      deviceId: 'default',
      groupId: 'default',
      sampleRate: 48000,
      channelCount: 2
    };
  }

  applyConstraints(_constraints?: MediaTrackConstraints): Promise<void> {
    return Promise.resolve();
  }

  // EventTarget methods
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
  onended: ((_this: MediaStreamTrack, _ev: Event) => any) | null = null;
  onmute: ((_this: MediaStreamTrack, _ev: Event) => any) | null = null;
  onunmute: ((_this: MediaStreamTrack, _ev: Event) => any) | null = null;
}

// Install mocks globally
(global as any).RTCPeerConnection = MockRTCPeerConnection;
(global as any).RTCDataChannel = MockRTCDataChannel;
(global as any).MediaStream = MockMediaStream;
(global as any).MediaStreamTrack = MockMediaStreamTrack;