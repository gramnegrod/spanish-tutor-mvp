/**
 * Mock Verification Tests
 * 
 * These tests verify that our HTMLMediaElement mock is working correctly
 * and that the test infrastructure prevents memory leaks.
 */

describe('Mock Verification', () => {
  it('should use our HTMLMediaElement mock', () => {
    // Create a new audio element
    const audio = new Audio();
    
    // Verify it's our mock
    expect(audio.remove).toBeDefined();
    expect(audio.captureStream).toBeDefined();
    expect(typeof audio.addEventListener).toBe('function');
    expect(typeof audio.removeEventListener).toBe('function');
    
    // Test that our mock methods work
    expect(() => audio.play()).not.toThrow();
    expect(() => audio.pause()).not.toThrow();
    expect(() => audio.load()).not.toThrow();
  });

  it('should clean up audio elements properly', () => {
    // Create audio element
    const audio = new Audio();
    
    // Add event listener
    const mockHandler = jest.fn();
    audio.addEventListener('play', mockHandler);
    
    // Verify listener was added
    expect((audio as any)._eventListeners.has('play')).toBe(true);
    
    // Remove listener
    audio.removeEventListener('play', mockHandler);
    
    // Verify listener was removed
    expect((audio as any)._eventListeners.has('play')).toBe(false);
  });

  it('should handle audio element removal without memory leaks', () => {
    // Create audio element
    const audio = new Audio();
    
    // Add some event listeners
    const playHandler = jest.fn();
    const errorHandler = jest.fn();
    
    audio.addEventListener('play', playHandler);
    audio.addEventListener('error', errorHandler);
    
    // Set some properties
    audio.src = 'test-audio.mp3';
    audio.volume = 0.5;
    
    // Call remove (our memory leak prevention method)
    audio.remove();
    
    // Verify cleanup occurred
    expect((audio as any)._eventListeners.size).toBe(0);
    expect(audio.srcObject).toBeNull();
    expect(audio.src).toBe('');
  });

  it('should provide working AudioContext mock', () => {
    // Create audio context
    const audioContext = new AudioContext();
    
    // Verify basic properties exist
    expect(audioContext.state).toBeDefined();
    expect(audioContext.sampleRate).toBeDefined();
    expect(audioContext.createAnalyser).toBeDefined();
    expect(audioContext.createGain).toBeDefined();
    expect(audioContext.close).toBeDefined();
    
    // Test that methods return appropriate mocks
    const analyser = audioContext.createAnalyser();
    expect(analyser.connect).toBeDefined();
    expect(analyser.disconnect).toBeDefined();
    
    const gainNode = audioContext.createGain();
    expect(gainNode.gain).toBeDefined();
    expect(gainNode.connect).toBeDefined();
  });

  it('should provide working MediaStream mock', () => {
    // MediaStream should be available
    expect(MediaStream).toBeDefined();
    
    // Create a media stream
    const stream = new MediaStream();
    
    // Verify basic properties
    expect(stream.id).toBeDefined();
    expect(stream.active).toBe(true);
    expect(stream.getTracks).toBeDefined();
    expect(stream.getAudioTracks).toBeDefined();
    expect(stream.addTrack).toBeDefined();
    expect(stream.removeTrack).toBeDefined();
    
    // Test track management
    const initialTrackCount = stream.getTracks().length;
    
    // Create and add a mock track
    const mockTrack = {
      kind: 'audio',
      id: 'test-track',
      enabled: true,
      stop: jest.fn()
    };
    
    stream.addTrack(mockTrack as any);
    expect(stream.getTracks().length).toBe(initialTrackCount + 1);
    
    // Remove track
    stream.removeTrack(mockTrack as any);
    expect(stream.getTracks().length).toBe(initialTrackCount);
  });

  it('should provide working getUserMedia mock', async () => {
    // getUserMedia should be available
    expect(navigator.mediaDevices.getUserMedia).toBeDefined();
    
    // Call getUserMedia
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Verify we get a MediaStream
    expect(stream).toBeDefined();
    expect(stream.id).toBeDefined();
    expect(stream.active).toBe(true);
    
    // Should have at least one audio track
    const audioTracks = stream.getAudioTracks();
    expect(audioTracks.length).toBeGreaterThan(0);
    expect(audioTracks[0].kind).toBe('audio');
  });

  it('should handle memory cleanup correctly', () => {
    // Create multiple audio elements
    const audioElements = [];
    for (let i = 0; i < 5; i++) {
      const audio = new Audio();
      audio.addEventListener('play', jest.fn());
      audio.addEventListener('error', jest.fn());
      audioElements.push(audio);
    }
    
    // Clean up all elements
    audioElements.forEach(audio => audio.remove());
    
    // Verify all are cleaned up
    audioElements.forEach(audio => {
      expect((audio as any)._eventListeners.size).toBe(0);
      expect(audio.srcObject).toBeNull();
    });
  });
});