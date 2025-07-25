import { OpenAIRealtimeService } from './OpenAIRealtimeService';
import { WebRTCManager } from './WebRTCManager';

// Mock WebRTCManager
jest.mock('./WebRTCManager');

describe('OpenAIRealtimeService Audio Handling', () => {
  let service: OpenAIRealtimeService;
  let mockWebRTCManager: jest.Mocked<WebRTCManager>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create service instance
    service = new OpenAIRealtimeService({
      tokenEndpoint: '/api/token',
      voice: 'alloy',
      outputAudioFormat: 'pcm16'
    });

    // Get mocked instance
    mockWebRTCManager = (WebRTCManager as jest.MockedClass<typeof WebRTCManager>).mock.instances[0] as jest.Mocked<WebRTCManager>;
  });

  afterEach(() => {
    service.dispose();
  });

  describe('WebRTC Audio Handling', () => {
    it('should emit audioTrackReceived when WebRTC audio track is received', async () => {
      const audioTrackListener = jest.fn();
      service.on('audioTrackReceived', audioTrackListener);

      // Mock MediaStreamTrack
      const mockTrack = {
        kind: 'audio',
        id: 'audio-track-1',
        enabled: true,
        muted: false,
        readyState: 'live'
      } as MediaStreamTrack;

      // Trigger the audioTrackReceived handler
      const audioTrackHandler = mockWebRTCManager.on.mock.calls.find(
        call => call[0] === 'audioTrackReceived'
      )?.[1];
      
      expect(audioTrackHandler).toBeDefined();
      audioTrackHandler!(mockTrack);

      // Verify audioTrackReceived event was emitted
      expect(audioTrackListener).toHaveBeenCalledTimes(1);
      expect(audioTrackListener).toHaveBeenCalledWith(mockTrack);
    });

    it('should handle audio transcript events', async () => {
      const transcriptListener = jest.fn();
      const fullTranscriptListener = jest.fn();
      
      service.on('transcriptReceived', transcriptListener);
      service.on('fullTranscriptReceived', fullTranscriptListener);

      // Simulate transcript delta
      const transcriptDelta = {
        type: 'response.audio_transcript.delta',
        response_id: 'resp_123',
        item_id: 'item_123',
        output_index: 0,
        content_index: 0,
        delta: 'Hello, how '
      };

      // Simulate transcript done
      const transcriptDone = {
        type: 'response.audio_transcript.done',
        response_id: 'resp_123',
        item_id: 'item_123',
        output_index: 0,
        content_index: 0,
        transcript: 'Hello, how are you today?'
      };

      const messageHandler = mockWebRTCManager.on.mock.calls.find(
        call => call[0] === 'dataChannelMessage'
      )?.[1];

      // Send delta
      messageHandler!(JSON.stringify(transcriptDelta));
      expect(transcriptListener).toHaveBeenCalledWith('Hello, how ');

      // Send done
      messageHandler!(JSON.stringify(transcriptDone));
      expect(fullTranscriptListener).toHaveBeenCalledWith('Hello, how are you today?');
    });
  });

  describe('Audio Format Configuration', () => {
    it('should configure PCM16 as the default output format', () => {
      const config = (service as any).config;
      expect(config.outputAudioFormat).toBe('pcm16');
    });

    it('should send correct audio format in session configuration', async () => {
      // Mock WebRTC manager methods
      mockWebRTCManager.initialize.mockResolvedValue();
      mockWebRTCManager.isConnected.mockReturnValue(true);
      mockWebRTCManager.getConnectionState.mockReturnValue({
        peerConnectionState: 'connected',
        iceConnectionState: 'connected',
        signalingState: 'stable',
        dataChannelState: 'open'
      });

      // Connect to trigger configuration send
      await service.connect();

      // Find the session.update message
      const sessionUpdateCall = mockWebRTCManager.sendData.mock.calls.find(
        call => {
          const data = JSON.parse(call[0]);
          return data.type === 'session.update';
        }
      );

      expect(sessionUpdateCall).toBeDefined();
      const sessionConfig = JSON.parse(sessionUpdateCall![0]);
      
      // Verify audio format configuration
      expect(sessionConfig.session.output_audio_format).toBe('pcm16');
      expect(sessionConfig.session.input_audio_format).toBe('pcm16');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown message types gracefully', () => {
      const errorListener = jest.fn();
      service.on('error', errorListener);

      const unknownMessage = {
        type: 'unknown.message.type',
        data: 'some data'
      };

      const messageHandler = mockWebRTCManager.on.mock.calls.find(
        call => call[0] === 'dataChannelMessage'
      )?.[1];

      // Should not throw
      expect(() => {
        messageHandler!(JSON.stringify(unknownMessage));
      }).not.toThrow();

      // No error should be emitted for unknown messages
      expect(errorListener).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON messages', () => {
      const errorListener = jest.fn();
      service.on('error', errorListener);

      const messageHandler = mockWebRTCManager.on.mock.calls.find(
        call => call[0] === 'dataChannelMessage'
      )?.[1];

      // Send malformed JSON
      expect(() => {
        messageHandler!('{ invalid json');
      }).not.toThrow();
      
      // Should not crash the service
      expect(errorListener).not.toHaveBeenCalled();
    });
  });
});