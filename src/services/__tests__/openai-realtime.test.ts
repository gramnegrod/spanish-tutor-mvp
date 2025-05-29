import { OpenAIRealtimeService, RealtimeConfig } from '../openai-realtime'

// Mock the fetch function
global.fetch = jest.fn()

// Mock RTCPeerConnection
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn().mockResolvedValue({ sdp: 'mock-offer' }),
  setLocalDescription: jest.fn(),
  setRemoteDescription: jest.fn(),
  createDataChannel: jest.fn().mockReturnValue({
    addEventListener: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
  }),
  addTrack: jest.fn(),
  close: jest.fn(),
  ontrack: null,
  onconnectionstatechange: null,
}))

// Mock MediaStream
global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: jest.fn().mockReturnValue([{
      stop: jest.fn(),
    }]),
  }),
} as any

describe('OpenAIRealtimeService', () => {
  let service: OpenAIRealtimeService
  let mockEvents: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockEvents = {
      onConnect: jest.fn(),
      onDisconnect: jest.fn(),
      onError: jest.fn(),
      onTranscript: jest.fn(),
      onCostUpdate: jest.fn(),
      onTimeWarning: jest.fn(),
      onSessionComplete: jest.fn(),
      onMaxSessionsReached: jest.fn(),
    }
    
    const config: RealtimeConfig = {
      tokenEndpoint: '/api/session',
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy',
      instructions: 'Test instructions',
    }
    
    service = new OpenAIRealtimeService(config, mockEvents)
  })

  afterEach(() => {
    service.disconnect()
  })

  describe('connect', () => {
    it('should successfully connect to OpenAI', async () => {
      // Mock successful API responses
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ client_secret: { value: 'mock-token' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('v=0\r\no=- 12345 12345 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:mock\r\na=ice-pwd:mock\r\na=fingerprint:sha-256 mock\r\na=setup:active\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2'),
          json: () => Promise.resolve({ 
            sdp: { 
              type: 'answer', 
              sdp: 'mock-answer' 
            } 
          }),
        })

      await service.connect()

      expect(mockEvents.onConnect).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle connection errors', async () => {
      // Mock API error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(service.connect()).rejects.toThrow()
      expect(mockEvents.onError).toHaveBeenCalled()
    })
  })

  describe('cost tracking', () => {
    it('should calculate costs correctly', () => {
      // Access private method through any type casting
      const serviceAny = service as any
      
      // Simulate some usage
      serviceAny.costTracking.audioInputSeconds = 60 // 1 minute
      serviceAny.costTracking.audioOutputSeconds = 120 // 2 minutes
      serviceAny.costTracking.textInputTokens = 1000
      serviceAny.costTracking.textOutputTokens = 2000
      
      serviceAny.calculateCosts()
      
      // Check calculations (based on pricing in the service)
      // Note: The service stores costs in cents, not dollars
      expect(serviceAny.costTracking.audioInputCost).toBe(6) // 6 cents/min
      expect(serviceAny.costTracking.audioOutputCost).toBe(48) // 24 cents/min * 2
      expect(serviceAny.costTracking.totalCost).toBeGreaterThan(0) // Converted to dollars
    })
  })

  describe('session management', () => {
    it('should trigger time warning at correct time', () => {
      jest.useFakeTimers()
      
      // Start session timers
      const serviceAny = service as any
      serviceAny.startSessionTimers()
      
      // Fast forward 8 minutes
      jest.advanceTimersByTime(8 * 60 * 1000)
      
      expect(mockEvents.onTimeWarning).toHaveBeenCalledWith(2, 0)
      
      jest.useRealTimers()
    })
  })
})