/**
 * Comprehensive test suite for the Audio Pipeline module
 * Tests all major functionality for OpenAI Realtime API integration
 */

import { AudioPipeline, isAudioRecordingSupported, checkMicrophonePermissions, getAudioInputDevices, formatAudioSize, calculateAudioDuration } from '../audio-pipeline';

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  sampleRate: 24000,
  createMediaStreamSource: jest.fn(),
  createGain: jest.fn(),
  createAnalyser: jest.fn(),
  createBuffer: jest.fn(),
  createBufferSource: jest.fn(),
  destination: {},
  close: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined)
};

const mockGainNode = {
  gain: { value: 1.0 },
  connect: jest.fn(),
  disconnect: jest.fn()
};

const mockAnalyserNode = {
  fftSize: 256,
  frequencyBinCount: 128,
  connect: jest.fn(),
  disconnect: jest.fn(),
  getByteFrequencyData: jest.fn()
};

const mockSourceNode = {
  connect: jest.fn(),
  disconnect: jest.fn()
};

const mockBufferSource = {
  buffer: null,
  connect: jest.fn(),
  start: jest.fn(),
  onended: null
};

const mockAudioBuffer = {
  length: 24000,
  numberOfChannels: 1,
  sampleRate: 24000,
  getChannelData: jest.fn().mockReturnValue(new Float32Array(24000))
};

const mockMediaStream = {
  id: 'test-stream',
  active: true,
  getTracks: jest.fn().mockReturnValue([
    { kind: 'audio', stop: jest.fn() }
  ])
};

// Mock navigator APIs
const mockGetUserMedia = jest.fn();
const mockEnumerateDevices = jest.fn();
const mockPermissionsQuery = jest.fn();

// Setup global mocks
beforeAll(() => {
  // Mock AudioContext
  (global as any).AudioContext = jest.fn(() => mockAudioContext);
  (global as any).webkitAudioContext = jest.fn(() => mockAudioContext);
  
  // Setup mock return values
  mockAudioContext.createMediaStreamSource.mockReturnValue(mockSourceNode);
  mockAudioContext.createGain.mockReturnValue(mockGainNode);
  mockAudioContext.createAnalyser.mockReturnValue(mockAnalyserNode);
  mockAudioContext.createBuffer.mockReturnValue(mockAudioBuffer);
  mockAudioContext.createBufferSource.mockReturnValue(mockBufferSource);
  
  // Mock navigator
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
      enumerateDevices: mockEnumerateDevices
    },
    writable: true
  });
  
  Object.defineProperty(global.navigator, 'permissions', {
    value: {
      query: mockPermissionsQuery
    },
    writable: true
  });
  
  // Mock DOM methods
  global.document = {
    createElement: jest.fn().mockReturnValue({
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      remove: jest.fn(),
      pause: jest.fn(),
      load: jest.fn()
    }),
    body: {
      appendChild: jest.fn()
    },
    querySelectorAll: jest.fn().mockReturnValue([])
  } as any;
});

describe('AudioPipeline', () => {
  let audioPipeline: AudioPipeline;

  beforeEach(() => {
    jest.clearAllMocks();
    audioPipeline = new AudioPipeline();
    
    // Setup default mock behaviors
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
    mockEnumerateDevices.mockResolvedValue([
      { kind: 'audioinput', deviceId: 'device1', label: 'Microphone 1' }
    ]);
    mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
  });

  describe('Constructor and Configuration', () => {
    test('should create AudioPipeline with default configuration', () => {
      const pipeline = new AudioPipeline();
      expect(pipeline).toBeInstanceOf(AudioPipeline);
      expect(pipeline.isReady()).toBe(false);
    });

    test('should create AudioPipeline with custom configuration', () => {
      const config = {
        sampleRate: 48000,
        volume: 0.8,
        echoCancellation: false
      };
      const pipeline = new AudioPipeline(config);
      expect(pipeline).toBeInstanceOf(AudioPipeline);
    });
  });

  describe('Microphone Initialization', () => {
    test('should successfully start microphone with proper configuration', async () => {
      const result = await audioPipeline.startMicrophone();
      
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1,
          latency: 0.01
        }
      });
      
      expect(result).toEqual({
        stream: mockMediaStream,
        audioContext: mockAudioContext,
        sourceNode: mockSourceNode,
        gainNode: mockGainNode,
        analyserNode: mockAnalyserNode
      });
      
      expect(audioPipeline.isReady()).toBe(true);
    });

    test('should handle microphone permission denied error', async () => {
      const permissionError = new DOMException('Permission denied', 'NotAllowedError');
      mockGetUserMedia.mockRejectedValue(permissionError);
      
      await expect(audioPipeline.startMicrophone()).rejects.toThrow(
        'Microphone access denied. Please allow microphone permissions and try again.'
      );
    });

    test('should handle no microphone found error', async () => {
      const notFoundError = new DOMException('No device found', 'NotFoundError');
      mockGetUserMedia.mockRejectedValue(notFoundError);
      
      await expect(audioPipeline.startMicrophone()).rejects.toThrow(
        'No microphone found. Please connect a microphone and try again.'
      );
    });

    test('should handle microphone in use error', async () => {
      const readableError = new DOMException('Device in use', 'NotReadableError');
      mockGetUserMedia.mockRejectedValue(readableError);
      
      await expect(audioPipeline.startMicrophone()).rejects.toThrow(
        'Microphone is being used by another application. Please close other applications and try again.'
      );
    });
  });

  describe('PCM16 Audio Conversion', () => {
    test('should convert Float32Array to PCM16 correctly', () => {
      const float32Input = new Float32Array([-1, -0.5, 0, 0.5, 1]);
      const pcm16Output = audioPipeline.convertFloat32ToPCM16(float32Input);
      
      expect(pcm16Output).toBeInstanceOf(Int16Array);
      expect(pcm16Output.length).toBe(float32Input.length);
      
      // Test specific conversion values
      expect(pcm16Output[0]).toBe(-32768); // -1 * 0x8000
      expect(pcm16Output[1]).toBe(-16384); // -0.5 * 0x8000
      expect(pcm16Output[2]).toBe(0);      // 0
      expect(pcm16Output[3]).toBe(16383);  // 0.5 * 0x7FFF
      expect(pcm16Output[4]).toBe(32767);  // 1 * 0x7FFF
    });

    test('should handle out-of-range values in Float32Array', () => {
      const float32Input = new Float32Array([-2, -1.5, 1.5, 2]);
      const pcm16Output = audioPipeline.convertFloat32ToPCM16(float32Input);
      
      // Values should be clamped to [-1, 1] range
      expect(pcm16Output[0]).toBe(-32768); // Clamped to -1
      expect(pcm16Output[1]).toBe(-32768); // Clamped to -1
      expect(pcm16Output[2]).toBe(32767);  // Clamped to 1
      expect(pcm16Output[3]).toBe(32767);  // Clamped to 1
    });

    test('should convert PCM16 back to Float32Array correctly', () => {
      const pcm16Input = new Int16Array([-32768, -16384, 0, 16383, 32767]);
      const float32Output = audioPipeline.convertPCM16ToFloat32(pcm16Input);
      
      expect(float32Output).toBeInstanceOf(Float32Array);
      expect(float32Output.length).toBe(pcm16Input.length);
      
      // Test conversion back (with floating point precision)
      expect(float32Output[0]).toBeCloseTo(-1, 5);
      expect(float32Output[1]).toBeCloseTo(-0.5, 5);
      expect(float32Output[2]).toBeCloseTo(0, 5);
      expect(float32Output[3]).toBeCloseTo(0.5, 5);
      expect(float32Output[4]).toBeCloseTo(1, 5);
    });

    test('should maintain data integrity in round-trip conversion', () => {
      const originalData = new Float32Array(1000);
      for (let i = 0; i < originalData.length; i++) {
        originalData[i] = (Math.random() - 0.5) * 2; // Random values between -1 and 1
      }
      
      const pcm16Data = audioPipeline.convertFloat32ToPCM16(originalData);
      const convertedBack = audioPipeline.convertPCM16ToFloat32(pcm16Data);
      
      // Check that the conversion maintains reasonable precision
      for (let i = 0; i < originalData.length; i++) {
        expect(convertedBack[i]).toBeCloseTo(originalData[i], 3);
      }
    });
  });

  describe('Audio Playback', () => {
    beforeEach(async () => {
      await audioPipeline.startMicrophone();
    });

    test('should play PCM16 audio data successfully', async () => {
      const pcm16Data = new Int16Array(24000); // 1 second of audio at 24kHz
      pcm16Data.fill(16383); // Fill with test data
      
      const playbackPromise = audioPipeline.playPCM16Audio(pcm16Data);
      
      // Simulate audio buffer source ending
      setTimeout(() => {
        if (mockBufferSource.onended) {
          mockBufferSource.onended();
        }
      }, 10);
      
      await expect(playbackPromise).resolves.toBeUndefined();
      
      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 24000, 24000);
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    test('should throw error when playing audio without initialization', async () => {
      const uninitializedPipeline = new AudioPipeline();
      const pcm16Data = new Int16Array(1000);
      
      await expect(uninitializedPipeline.playPCM16Audio(pcm16Data))
        .rejects.toThrow('Audio pipeline not initialized. Call startMicrophone() first.');
    });
  });

  describe('Volume Control', () => {
    beforeEach(async () => {
      await audioPipeline.startMicrophone();
    });

    test('should set volume correctly', () => {
      audioPipeline.setVolume(0.7);
      expect(mockGainNode.gain.value).toBe(0.7);
    });

    test('should clamp volume to valid range', () => {
      audioPipeline.setVolume(-0.5);
      expect(mockGainNode.gain.value).toBe(0);
      
      audioPipeline.setVolume(1.5);
      expect(mockGainNode.gain.value).toBe(1);
    });
  });

  describe('Audio Level Monitoring', () => {
    beforeEach(async () => {
      await audioPipeline.startMicrophone();
    });

    test('should return audio level when analyser is available', () => {
      const mockFrequencyData = new Uint8Array(128);
      mockFrequencyData.fill(100); // Fill with test data
      mockAnalyserNode.getByteFrequencyData.mockImplementation((array) => {
        array.set(mockFrequencyData);
      });
      
      const level = audioPipeline.getAudioLevel();
      expect(typeof level).toBe('number');
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    });

    test('should return 0 when analyser is not available', () => {
      const uninitializedPipeline = new AudioPipeline();
      const level = uninitializedPipeline.getAudioLevel();
      expect(level).toBe(0);
    });
  });

  describe('Audio Context Management', () => {
    beforeEach(async () => {
      await audioPipeline.startMicrophone();
    });

    test('should resume suspended audio context', async () => {
      mockAudioContext.state = 'suspended';
      await audioPipeline.resumeAudioContext();
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    test('should not resume already running audio context', async () => {
      mockAudioContext.state = 'running';
      await audioPipeline.resumeAudioContext();
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });
  });

  describe('Audio Player Creation', () => {
    test('should create and configure audio element properly', () => {
      const mockAudioElement = {
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        autoplay: false,
        controls: false,
        volume: 0,
        preload: '',
        crossOrigin: ''
      };
      
      (document.createElement as jest.Mock).mockReturnValue(mockAudioElement);
      
      const audioElement = audioPipeline.createAudioPlayer();
      
      expect(document.createElement).toHaveBeenCalledWith('audio');
      expect(mockAudioElement.autoplay).toBe(true);
      expect(mockAudioElement.controls).toBe(false);
      expect(mockAudioElement.preload).toBe('auto');
      expect(mockAudioElement.setAttribute).toHaveBeenCalledWith('data-audio-pipeline', 'true');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAudioElement);
    });
  });

  describe('Cleanup Operations', () => {
    beforeEach(async () => {
      await audioPipeline.startMicrophone();
    });

    test('should properly cleanup all resources', () => {
      const mockTrack = { stop: jest.fn() };
      mockMediaStream.getTracks.mockReturnValue([mockTrack]);
      
      audioPipeline.stopAudio();
      
      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mockSourceNode.disconnect).toHaveBeenCalled();
      expect(mockGainNode.disconnect).toHaveBeenCalled();
      expect(mockAnalyserNode.disconnect).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(audioPipeline.isReady()).toBe(false);
    });

    test('should handle cleanup when resources are already null', () => {
      const cleanPipeline = new AudioPipeline();
      expect(() => cleanPipeline.stopAudio()).not.toThrow();
    });
  });
});

describe('Utility Functions', () => {
  describe('isAudioRecordingSupported', () => {
    test('should return true when all required APIs are available', () => {
      expect(isAudioRecordingSupported()).toBe(true);
    });

    test('should return false when getUserMedia is not available', () => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      delete (navigator.mediaDevices as any).getUserMedia;
      
      expect(isAudioRecordingSupported()).toBe(false);
      
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    });
  });

  describe('checkMicrophonePermissions', () => {
    test('should return permission state when available', async () => {
      mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
      const state = await checkMicrophonePermissions();
      expect(state).toBe('granted');
    });

    test('should return prompt when permission query fails', async () => {
      mockPermissionsQuery.mockRejectedValue(new Error('Not supported'));
      const state = await checkMicrophonePermissions();
      expect(state).toBe('prompt');
    });
  });

  describe('getAudioInputDevices', () => {
    test('should return only audio input devices', async () => {
      const mockDevices = [
        { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone 1' },
        { kind: 'audiooutput', deviceId: 'speaker1', label: 'Speaker 1' },
        { kind: 'audioinput', deviceId: 'mic2', label: 'Microphone 2' }
      ];
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      const audioInputs = await getAudioInputDevices();
      expect(audioInputs).toHaveLength(2);
      expect(audioInputs.every(device => device.kind === 'audioinput')).toBe(true);
    });

    test('should return empty array when enumerate devices fails', async () => {
      mockEnumerateDevices.mockRejectedValue(new Error('Access denied'));
      const audioInputs = await getAudioInputDevices();
      expect(audioInputs).toEqual([]);
    });
  });

  describe('formatAudioSize', () => {
    test('should format bytes correctly', () => {
      expect(formatAudioSize(512)).toBe('512 bytes');
      expect(formatAudioSize(1536)).toBe('1.5 KB');
      expect(formatAudioSize(2097152)).toBe('2.0 MB');
    });
  });

  describe('calculateAudioDuration', () => {
    test('should calculate duration correctly', () => {
      expect(calculateAudioDuration(24000, 24000)).toBe(1); // 1 second
      expect(calculateAudioDuration(48000, 24000)).toBe(2); // 2 seconds
      expect(calculateAudioDuration(12000, 24000)).toBe(0.5); // 0.5 seconds
    });
  });
});

describe('Error Handling', () => {
  test('should handle various DOM exceptions appropriately', async () => {
    const testCases = [
      { name: 'NotAllowedError', expectedMessage: 'Microphone access denied' },
      { name: 'NotFoundError', expectedMessage: 'No microphone found' },
      { name: 'NotReadableError', expectedMessage: 'Microphone is being used by another application' }
    ];

    for (const testCase of testCases) {
      const error = new DOMException('Test error', testCase.name);
      mockGetUserMedia.mockRejectedValueOnce(error);
      
      const pipeline = new AudioPipeline();
      await expect(pipeline.startMicrophone()).rejects.toThrow(testCase.expectedMessage);
    }
  });

  test('should handle generic errors', async () => {
    const genericError = new Error('Generic error');
    mockGetUserMedia.mockRejectedValue(genericError);
    
    const pipeline = new AudioPipeline();
    await expect(pipeline.startMicrophone()).rejects.toThrow('Generic error');
  });
});

describe('Integration Tests', () => {
  test('should handle complete workflow: start -> convert -> play -> stop', async () => {
    const pipeline = new AudioPipeline();
    
    // Start microphone
    const result = await pipeline.startMicrophone();
    expect(pipeline.isReady()).toBe(true);
    
    // Test audio conversion
    const testAudio = new Float32Array(1000);
    testAudio.fill(0.5);
    const pcm16Data = pipeline.convertFloat32ToPCM16(testAudio);
    expect(pcm16Data).toBeInstanceOf(Int16Array);
    
    // Test playback
    const playbackPromise = pipeline.playPCM16Audio(pcm16Data);
    setTimeout(() => {
      if (mockBufferSource.onended) mockBufferSource.onended();
    }, 10);
    await playbackPromise;
    
    // Stop and cleanup
    pipeline.stopAudio();
    expect(pipeline.isReady()).toBe(false);
  });
});