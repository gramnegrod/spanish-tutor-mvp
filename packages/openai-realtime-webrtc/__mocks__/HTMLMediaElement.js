/**
 * Mock for HTMLMediaElement
 * 
 * This mock provides a complete implementation of HTMLMediaElement
 * to prevent memory leaks and ensure proper testing of audio/video elements.
 */

class MockHTMLMediaElement {
  constructor() {
    // Audio/Video properties
    this.autoplay = false;
    this.buffered = {
      length: 0,
      start: () => 0,
      end: () => 0
    };
    this.controls = false;
    this.currentSrc = '';
    this.currentTime = 0;
    this.defaultMuted = false;
    this.defaultPlaybackRate = 1;
    this.duration = NaN;
    this.ended = false;
    this.error = null;
    this.loop = false;
    this.muted = false;
    this.networkState = 0;
    this.paused = true;
    this.playbackRate = 1;
    this.played = {
      length: 0,
      start: () => 0,
      end: () => 0
    };
    this.preload = 'auto';
    this.readyState = 0;
    this.seekable = {
      length: 0,
      start: () => 0,
      end: () => 0
    };
    this.seeking = false;
    this.src = '';
    this.srcObject = null;
    this.volume = 1;
    
    // Event listeners storage
    this._eventListeners = new Map();
    
    // Track resources for cleanup
    this._isConnected = false;
    this._audioContext = null;
    this._mediaStreamSource = null;
  }
  
  // Methods
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  
  pause() {
    this.paused = true;
  }
  
  load() {
    // Reset to initial state
    this.currentTime = 0;
    this.paused = true;
    this.ended = false;
  }
  
  canPlayType(type) {
    const supportedTypes = ['audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
    return supportedTypes.includes(type) ? 'probably' : '';
  }
  
  // Event handling
  addEventListener(type, listener, options) {
    if (!this._eventListeners.has(type)) {
      this._eventListeners.set(type, new Set());
    }
    this._eventListeners.get(type).add(listener);
  }
  
  removeEventListener(type, listener, options) {
    if (this._eventListeners.has(type)) {
      this._eventListeners.get(type).delete(listener);
      if (this._eventListeners.get(type).size === 0) {
        this._eventListeners.delete(type);
      }
    }
  }
  
  dispatchEvent(event) {
    const listeners = this._eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
    return true;
  }
  
  // WebRTC related methods
  captureStream() {
    // Mock MediaStream
    return {
      id: 'mock-stream-id',
      active: true,
      getTracks: () => [],
      getAudioTracks: () => [],
      getVideoTracks: () => [],
      addTrack: () => {},
      removeTrack: () => {},
      clone: function() { return this; }
    };
  }
  
  // Cleanup method to prevent memory leaks
  remove() {
    // Clear all event listeners
    this._eventListeners.clear();
    
    // Clear any references
    this.srcObject = null;
    this.src = '';
    
    // Disconnect audio nodes if connected
    if (this._mediaStreamSource) {
      this._mediaStreamSource.disconnect();
      this._mediaStreamSource = null;
    }
    
    this._audioContext = null;
    this._isConnected = false;
  }
  
  // Additional DOM methods
  getAttribute(name) {
    return this[name] || null;
  }
  
  setAttribute(name, value) {
    this[name] = value;
  }
  
  removeAttribute(name) {
    delete this[name];
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MockHTMLMediaElement;
} else {
  window.HTMLMediaElement = MockHTMLMediaElement;
}