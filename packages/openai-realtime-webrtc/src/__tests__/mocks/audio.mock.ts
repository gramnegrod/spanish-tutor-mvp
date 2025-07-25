/**
 * Audio API Mock implementations for testing
 * Provides comprehensive mocks for AudioContext, AudioNodes, and media devices
 */

export class MockAudioContext implements AudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  sampleRate = 48000;
  baseLatency = 0.01;
  outputLatency = 0.02;
  listener = {} as AudioListener;
  destination: AudioDestinationNode;
  audioWorklet = {} as AudioWorklet;
  
  private nodes: Set<any> = new Set();
  private startTime: number = Date.now();

  constructor() {
    this.destination = {
      context: this,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      maxChannelCount: 2,
      numberOfInputs: 1,
      numberOfOutputs: 0,
      connect: jest.fn(),
      disconnect: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    } as any;
  }

  createGain(): GainNode {
    const node = {
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        setTargetAtTime: jest.fn(),
        setValueCurveAtTime: jest.fn(),
        cancelScheduledValues: jest.fn(),
        cancelAndHoldAtTime: jest.fn()
      },
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      context: this,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      numberOfInputs: 1,
      numberOfOutputs: 1
    };
    this.nodes.add(node);
    return node as any;
  }

  createAnalyser(): AnalyserNode {
    const node = {
      fftSize: 2048,
      frequencyBinCount: 1024,
      minDecibels: -100,
      maxDecibels: -30,
      smoothingTimeConstant: 0.8,
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      getByteFrequencyData: jest.fn((array: Uint8Array) => {
        // Simulate some frequency data
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 128);
        }
      }),
      getFloatFrequencyData: jest.fn(),
      getByteTimeDomainData: jest.fn(),
      getFloatTimeDomainData: jest.fn(),
      context: this,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      numberOfInputs: 1,
      numberOfOutputs: 1
    };
    this.nodes.add(node);
    return node as any;
  }

  createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode {
    const node = {
      mediaStream: stream,
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      context: this,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      numberOfInputs: 0,
      numberOfOutputs: 1
    };
    this.nodes.add(node);
    return node as any;
  }

  createMediaElementSource(element: HTMLMediaElement): MediaElementAudioSourceNode {
    const node = {
      mediaElement: element,
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      context: this,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      numberOfInputs: 0,
      numberOfOutputs: 1
    };
    this.nodes.add(node);
    return node as any;
  }

  resume = jest.fn().mockImplementation(async (): Promise<void> => {
    this.state = 'running';
    return Promise.resolve();
  });

  async suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close = jest.fn().mockImplementation(async (): Promise<void> => {
    this.state = 'closed';
    this.nodes.forEach(node => {
      if (node.disconnect) {
        node.disconnect();
      }
    });
    this.nodes.clear();
    return Promise.resolve();
  });

  getOutputTimestamp(): AudioTimestamp {
    return {
      contextTime: this.currentTime,
      performanceTime: performance.now()
    };
  }

  // Other required methods (simplified)
  createBuffer(): AudioBuffer { return {} as any; }
  createBufferSource(): AudioBufferSourceNode { return {} as any; }
  createChannelMerger(): ChannelMergerNode { return {} as any; }
  createChannelSplitter(): ChannelSplitterNode { return {} as any; }
  createConstantSource(): ConstantSourceNode { return {} as any; }
  createConvolver(): ConvolverNode { return {} as any; }
  createDelay(): DelayNode { return {} as any; }
  createDynamicsCompressor(): DynamicsCompressorNode { return {} as any; }
  createIIRFilter(): IIRFilterNode { return {} as any; }
  createOscillator(): OscillatorNode { return {} as any; }
  createPanner(): PannerNode { return {} as any; }
  createPeriodicWave(): PeriodicWave { return {} as any; }
  createScriptProcessor(): ScriptProcessorNode { return {} as any; }
  createStereoPanner(): StereoPannerNode { return {} as any; }
  createWaveShaper(): WaveShaperNode { return {} as any; }
  createBiquadFilter(): BiquadFilterNode { return {} as any; }
  decodeAudioData(): Promise<AudioBuffer> { return Promise.resolve({} as any); }
  
  // EventTarget methods
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
  onstatechange: ((_this: BaseAudioContext, _ev: Event) => any) | null = null;
}

export class MockHTMLAudioElement {
  autoplay = false;
  controls = false;
  crossOrigin: string | null = null;
  currentTime = 0;
  defaultMuted = false;
  defaultPlaybackRate = 1;
  duration = 0;
  ended = false;
  error: MediaError | null = null;
  loop = false;
  muted = false;
  paused = true;
  playbackRate = 1;
  played = { length: 0 };
  preload = 'auto';
  readyState = 0;
  seekable = { length: 0 };
  seeking = false;
  src = '';
  srcObject: MediaStream | null = null;
  volume = 1;
  buffered = { length: 0 };
  
  style: any = { display: 'block' };
  playsInline = false;

  // Methods
  play = jest.fn().mockImplementation(() => {
    this.paused = false;
    return Promise.resolve();
  });

  pause = jest.fn().mockImplementation(() => {
    this.paused = true;
  });

  load = jest.fn();
  canPlayType = jest.fn().mockReturnValue('maybe');

  // EventTarget methods
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn().mockReturnValue(true);
  
  // HTMLElement methods
  setAttribute = jest.fn();
  getAttribute = jest.fn();
  removeAttribute = jest.fn();
  remove = jest.fn();

  // Simulate events
  simulatePlay(): void {
    this.paused = false;
    const event = new Event('play');
    this.addEventListener.mock.calls
      .filter(([type]) => type === 'play')
      .forEach(([, handler]) => handler(event));
  }

  simulateError(message: string): void {
    this.error = {
      code: 4,
      message,
      MEDIA_ERR_ABORTED: 1,
      MEDIA_ERR_NETWORK: 2,
      MEDIA_ERR_DECODE: 3,
      MEDIA_ERR_SRC_NOT_SUPPORTED: 4
    };
    const event = new Event('error');
    this.addEventListener.mock.calls
      .filter(([type]) => type === 'error')
      .forEach(([, handler]) => handler(event));
  }
}

// Mock MediaDevices
export class MockMediaDevices implements MediaDevices {
  private permissionState: 'granted' | 'denied' | 'prompt' = 'prompt';
  private availableDevices: MediaDeviceInfo[] = [
    {
      deviceId: 'default',
      kind: 'audioinput',
      label: 'Default Microphone',
      groupId: 'default-group',
      toJSON: () => ({})
    },
    {
      deviceId: 'speaker-default',
      kind: 'audiooutput',
      label: 'Default Speaker',
      groupId: 'default-group',
      toJSON: () => ({})
    }
  ];

  getUserMedia = jest.fn().mockImplementation(async (constraints?: MediaStreamConstraints): Promise<MediaStream> => {
    if (this.permissionState === 'denied') {
      throw new DOMException('Permission denied', 'NotAllowedError');
    }
    
    // Import the webrtc mock classes synchronously
    const webrtcMock = require('./webrtc.mock');
    const tracks: MediaStreamTrack[] = [];
    
    if (constraints?.audio) {
      tracks.push(new webrtcMock.MockMediaStreamTrack('audio'));
    }
    
    if (constraints?.video) {
      tracks.push(new webrtcMock.MockMediaStreamTrack('video'));
    }
    
    return new webrtcMock.MockMediaStream(tracks) as any;
  });

  enumerateDevices = jest.fn().mockImplementation(async (): Promise<MediaDeviceInfo[]> => {
    return this.availableDevices;
  });

  getDisplayMedia = jest.fn().mockImplementation(async (_constraints?: DisplayMediaStreamOptions): Promise<MediaStream> => {
    const webrtcMock = require('./webrtc.mock');
    return new webrtcMock.MockMediaStream([new webrtcMock.MockMediaStreamTrack('video')]) as any;
  });

  getSupportedConstraints(): MediaTrackSupportedConstraints {
    return {
      aspectRatio: true,
      autoGainControl: true,
      channelCount: true,
      deviceId: true,
      echoCancellation: true,
      facingMode: true,
      frameRate: true,
      groupId: true,
      height: true,
      noiseSuppression: true,
      sampleRate: true,
      sampleSize: true,
      width: true
    };
  }

  selectAudioOutput(): Promise<MediaDeviceInfo> {
    return Promise.resolve(this.availableDevices[1]);
  }

  // Test helpers
  setPermissionState(state: 'granted' | 'denied' | 'prompt'): void {
    this.permissionState = state;
  }

  setAvailableDevices(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
  }

  // EventTarget methods
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
  ondevicechange: ((_this: MediaDevices, _ev: Event) => any) | null = null;
}

// Install mocks globally
(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;
(global as any).HTMLAudioElement = MockHTMLAudioElement;

// Mock navigator.mediaDevices
if (!global.navigator) {
  (global as any).navigator = {};
}
(global.navigator as any).mediaDevices = new MockMediaDevices();