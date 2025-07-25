/**
 * Simple test helpers for OpenAI Realtime WebRTC tests
 */

import { MockRTCPeerConnection, MockRTCDataChannel } from '../mocks/webrtc.mock';
import { MockMediaDevices } from '../mocks/audio.mock';

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Create a mock WebRTC peer connection with helper methods
 */
export function createMockPeerConnection(): MockRTCPeerConnection & {
  simulateConnected: () => void;
  simulateDisconnected: () => void;
  simulateFailed: () => void;
} {
  const pc = new MockRTCPeerConnection();
  
  return Object.assign(pc, {
    simulateConnected: () => {
      pc.simulateConnectionStateChange('connected');
      pc.simulateIceConnectionStateChange('connected');
    },
    simulateDisconnected: () => {
      pc.simulateConnectionStateChange('disconnected');
      pc.simulateIceConnectionStateChange('disconnected');
    },
    simulateFailed: () => {
      pc.simulateConnectionStateChange('failed');
      pc.simulateIceConnectionStateChange('failed');
    }
  });
}

/**
 * Create a mock data channel with helper methods
 */
export function createMockDataChannel(label = 'test-channel'): MockRTCDataChannel & {
  simulateReady: () => void;
  simulateTextMessage: (text: string) => void;
  simulateBinaryMessage: (data: ArrayBuffer) => void;
} {
  const channel = new MockRTCDataChannel(label);
  
  return Object.assign(channel, {
    simulateReady: () => {
      channel.simulateOpen();
    },
    simulateTextMessage: (text: string) => {
      channel.simulateMessage(text);
    },
    simulateBinaryMessage: (data: ArrayBuffer) => {
      channel.simulateMessage(data);
    }
  });
}

/**
 * Setup mock fetch responses for OpenAI API
 */
export function setupMockFetch(options: {
  tokenResponse?: any;
  sdpResponse?: string;
  tokenError?: Error;
  sdpError?: Error;
} = {}): jest.Mock {
  const mockFetch = jest.fn();
  
  mockFetch.mockImplementation((url: string, init?: RequestInit) => {
    if (url.includes('/token')) {
      if (options.tokenError) {
        return Promise.reject(options.tokenError);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => options.tokenResponse || { client_secret: { value: 'mock-token' } }
      });
    }
    
    if (url.includes('/v1/realtime')) {
      if (options.sdpError) {
        return Promise.reject(options.sdpError);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => options.sdpResponse || 'mock-answer-sdp'
      });
    }
    
    return Promise.reject(new Error('Unknown URL'));
  });
  
  global.fetch = mockFetch;
  return mockFetch;
}

/**
 * Setup mock media devices with helper methods
 */
export function setupMockMediaDevices(options: {
  permissionState?: 'granted' | 'denied' | 'prompt';
  devices?: MediaDeviceInfo[];
} = {}): MockMediaDevices {
  const mockDevices = new MockMediaDevices();
  
  if (options.permissionState) {
    mockDevices.setPermissionState(options.permissionState);
  }
  
  if (options.devices) {
    mockDevices.setAvailableDevices(options.devices);
  }
  
  (navigator as any).mediaDevices = mockDevices;
  return mockDevices;
}

/**
 * Simulate OpenAI message through data channel
 */
export function simulateOpenAIMessage(
  service: any,
  message: any
): void {
  const webrtcManager = service.webrtcManager;
  const dataChannelHandler = webrtcManager.on.mock.calls
    .find(([event]: [string]) => event === 'dataChannelMessage')?.[1];
  
  if (dataChannelHandler) {
    dataChannelHandler(message);
  } else {
    throw new Error('Data channel handler not found');
  }
}