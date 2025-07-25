/**
 * Jest setup file for OpenAI Realtime WebRTC tests
 * Configures global mocks and test environment
 */

// Add custom matchers if needed
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock requestAnimationFrame for audio level monitoring tests
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock performance.now for timing tests
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
};

// Setup fetch mock
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockReset();
  
  // Re-setup getUserMedia mock after clearing mocks
  if (navigator?.mediaDevices) {
    navigator.mediaDevices.getUserMedia = jest.fn().mockImplementation((constraints) => {
      // Create a mock audio track
      const audioTrack = new MockMediaStreamTrack('audio');
      const stream = new MockMediaStream([audioTrack]);
      return Promise.resolve(stream);
    });
  }
});

// Cleanup after each test
afterEach(() => {
  jest.useRealTimers();
});

// Import our comprehensive HTMLMediaElement mock
const MockHTMLMediaElement = require('../../../__mocks__/HTMLMediaElement');

// Replace the global HTMLMediaElement with our mock
(global as any).HTMLMediaElement = MockHTMLMediaElement;
(window as any).HTMLMediaElement = MockHTMLMediaElement;

// Ensure Audio constructor uses our mock
(global as any).Audio = MockHTMLMediaElement;
(window as any).Audio = MockHTMLMediaElement;

// Mock MediaStream
class MockMediaStream {
  active = true;
  id: string;
  private tracks: MediaStreamTrack[] = [];

  constructor(tracks: MediaStreamTrack[] = []) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.tracks = tracks;
  }

  getTracks(): MediaStreamTrack[] {
    return this.tracks;
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks.filter(track => track.kind === 'audio');
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.tracks.filter(track => track.kind === 'video');
  }

  addTrack(track: MediaStreamTrack): void {
    this.tracks.push(track);
  }

  removeTrack(track: MediaStreamTrack): void {
    const index = this.tracks.indexOf(track);
    if (index > -1) {
      this.tracks.splice(index, 1);
    }
  }
}

(global as any).MediaStream = MockMediaStream;

// Mock MediaStreamTrack
class MockMediaStreamTrack {
  kind: string;
  id: string;
  enabled = true;
  muted = false;
  readyState: 'live' | 'ended' = 'live';
  
  constructor(kind: 'audio' | 'video' = 'audio') {
    this.kind = kind;
    this.id = Math.random().toString(36).substr(2, 9);
  }
  
  stop(): void {
    this.readyState = 'ended';
  }
}

(global as any).MediaStreamTrack = MockMediaStreamTrack;

// Mock getUserMedia
if (!navigator.mediaDevices) {
  (navigator as any).mediaDevices = {};
}

navigator.mediaDevices.getUserMedia = jest.fn().mockImplementation((constraints) => {
  // Create a mock audio track
  const audioTrack = new MockMediaStreamTrack('audio');
  const stream = new MockMediaStream([audioTrack]);
  return Promise.resolve(stream);
});

// Mock AudioContext with proper constructor function
class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  baseLatency = 0.01;
  destination = {};

  createAnalyser = jest.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    smoothingTimeConstant: 0.8,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
    getFloatFrequencyData: jest.fn(),
    getFloatTimeDomainData: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  }));

  createGain = jest.fn(() => ({
    gain: { value: 1, setValueAtTime: jest.fn() },
    connect: jest.fn(),
    disconnect: jest.fn()
  }));

  createMediaStreamSource = jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  }));

  createMediaElementSource = jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  }));

  close = jest.fn().mockResolvedValue(undefined);
  resume = jest.fn().mockResolvedValue(undefined);
  suspend = jest.fn().mockResolvedValue(undefined);
}

(global as any).AudioContext = MockAudioContext;

// Also provide webkitAudioContext for Safari compatibility
(global as any).webkitAudioContext = MockAudioContext;