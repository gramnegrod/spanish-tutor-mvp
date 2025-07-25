import { EventEmitter } from 'eventemitter3';

/**
 * Events emitted by AudioManager
 */
export interface AudioManagerEvents {
  'audioLevelsChanged': (levels: { input: number; output: number }) => void;
  'microphoneStateChanged': (enabled: boolean) => void;
  'muteStateChanged': (muted: boolean) => void;
  'volumeChanged': (volume: number) => void;
  'error': (error: Error) => void;
}

/**
 * Configuration options for AudioManager
 */
export interface AudioManagerConfig {
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * AudioManager - Handles all audio complexity internally
 * Manages microphone input, audio playback, and provides simple controls
 */
export class AudioManager extends EventEmitter<AudioManagerEvents> {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private outputSource: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private animationFrameId: number | null = null;
  
  private isMicrophoneEnabled = false;
  private isMuted = false;
  private volume = 1.0;
  private debug = false;
  
  private inputDataArray: Uint8Array | null = null;
  private outputDataArray: Uint8Array | null = null;
  
  // AbortController for managing event listeners to prevent memory leaks
  private abortController: AbortController | null = null;
  
  // Store references to event handlers for proper cleanup
  private audioPlayHandler: (() => void) | null = null;
  private audioErrorHandler: ((error: Event) => void) | null = null;
  
  // Browser detection helpers
  private isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  }
  
  private isSafari(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1;
  }

  constructor(config: AudioManagerConfig = {}) {
    super();
    this.debug = config.debug ?? false;
    this.initializeAudioContext();
    this.createAudioElement();
  }

  /**
   * Initialize the Web Audio API context
   */
  private initializeAudioContext(): void {
    try {
      // Handle vendor prefixes for older browsers with proper type checking
      const AudioContextClass = window.AudioContext || 
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported in this browser');
      }

      this.audioContext = new AudioContextClass();

      // Handle autoplay policy - resume context on user interaction if needed
      if (this.audioContext.state === 'suspended') {
        // Create AbortController for proper cleanup of event listeners
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        
        const resumeContext = async () => {
          try {
            await this.audioContext?.resume();
            // Clean up the AbortController after successful resume
            this.abortController?.abort();
            this.abortController = null;
          } catch (error) {
            if (this.debug) {
              console.warn('Failed to resume audio context:', error);
            }
          }
        };
        
        // Add event listeners with AbortSignal for automatic cleanup
        document.addEventListener('click', resumeContext, { signal });
        document.addEventListener('touchstart', resumeContext, { signal });
        document.addEventListener('touchend', resumeContext, { signal });
        
        // iOS-specific: Add extra touch event handling
        if (this.isIOSDevice()) {
          window.addEventListener('touchend', resumeContext, { signal, once: true });
        }
      }

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorToEmit = new Error(`Failed to initialize audio context: ${errorMessage}`);
      this.emit('error', errorToEmit);
    }
  }

  /**
   * Create and configure the audio element for playback
   */
  private createAudioElement(): void {
    try {
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
      if ('playsInline' in this.audioElement) {
        (this.audioElement as HTMLMediaElement & { playsInline: boolean }).playsInline = true; // Important for iOS
      }
      
      // iOS-specific attributes for better compatibility
      this.audioElement.setAttribute('playsinline', 'true');
      this.audioElement.setAttribute('webkit-playsinline', 'true');
      
      // Safari-specific: preload metadata
      if (this.isSafari()) {
        this.audioElement.preload = 'metadata';
      }
      
      // Add to DOM
      this.audioElement.style.display = 'none';
      document.body.appendChild(this.audioElement);

      // Handle autoplay failures gracefully
      this.audioPlayHandler = () => {
        this.setupOutputAnalyser();
      };
      if (this.audioPlayHandler && this.audioElement) {
        this.audioElement.addEventListener('play', this.audioPlayHandler);
      }

      this.audioErrorHandler = (error) => {
        if (this.debug) {
          console.error('Audio element error:', error);
        }
        this.emit('error', new Error('Audio playback error'));
      };
      if (this.audioErrorHandler && this.audioElement) {
        this.audioElement.addEventListener('error', this.audioErrorHandler);
      }
    } catch (error) {
      if (this.debug) {
        console.error('Failed to create or add audio element to DOM:', error);
      }
      this.emit('error', new Error('Failed to create or add audio element to DOM'));
    }
  }

  /**
   * Enable microphone access and start capturing audio
   */
  async enableMicrophone(): Promise<void> {
    if (this.isMicrophoneEnabled) {
      return;
    }

    try {
      // Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      if (!this.audioContext) {
        this.initializeAudioContext();
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Set up audio analysis
      this.setupInputAnalyser();
      
      this.isMicrophoneEnabled = true;
      this.emit('microphoneStateChanged', true);

      // Start monitoring audio levels
      this.startAudioLevelMonitoring();

    } catch (error: unknown) {
      let errorMessage = 'Failed to access microphone';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please grant permission in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application.';
        }
      }

      this.emit('error', new Error(errorMessage));
      throw new Error(errorMessage);
    }
  }

  /**
   * Disable microphone and clean up resources
   */
  async disableMicrophone(): Promise<void> {
    if (!this.isMicrophoneEnabled) {
      return;
    }

    // Stop all tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Disconnect audio nodes
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }

    this.isMicrophoneEnabled = false;
    this.emit('microphoneStateChanged', false);

    // Stop monitoring if no audio is active
    if (!this.audioElement?.srcObject) {
      this.stopAudioLevelMonitoring();
    }
  }

  /**
   * Handle incoming audio track from WebRTC
   */
  async handleAudioTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.audioElement) {
      this.createAudioElement();
    }

    try {
      // Clean up previous stream to prevent memory leak
      if (this.audioElement && this.audioElement.srcObject) {
        const oldStream = this.audioElement.srcObject as MediaStream;
        // Stop all tracks in the old stream
        oldStream.getTracks().forEach(t => t.stop());
        this.audioElement.srcObject = null;
      }
      
      // Create a new MediaStream with the track
      const stream = new MediaStream([track]);
      
      if (this.audioElement) {
        this.audioElement.srcObject = stream;
        
        // iOS-specific: Resume audio context before attempting to play
        if (this.isIOSDevice() && this.audioContext?.state === 'suspended') {
          try {
            await this.audioContext.resume();
            this.log('iOS: Audio context resumed successfully');
          } catch (e) {
            if (this.debug) {
              console.warn('iOS: Failed to resume audio context:', e);
            }
          }
        }
        
        // Safari-specific: Handle user activation requirement
        if (this.isSafari() && this.audioContext?.state === 'suspended') {
          // Create a one-time user interaction handler
          const resumeHandler = async () => {
            try {
              await this.audioContext?.resume();
              await this.audioElement?.play();
            } catch (e) {
              if (this.debug) {
                console.warn('Safari: Failed to resume audio:', e);
              }
            }
          };
          
          // Add temporary event listeners for user interaction
          const events = ['click', 'touchstart', 'touchend'];
          events.forEach(event => {
            document.addEventListener(event, resumeHandler, { once: true });
          });
        }
        
        // Ensure audio plays (handle autoplay policies)
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(async (error) => {
            console.warn('Autoplay prevented, will play on user interaction:', error);
            
            // iOS-specific handling with additional strategies
            if (this.isIOSDevice()) {
              // Strategy 1: Try silent play first
              try {
                this.audioElement!.muted = true;
                await this.audioElement!.play();
                this.audioElement!.muted = false;
              } catch (e) {
                if (this.debug) {
                  console.warn('iOS: Silent play strategy failed:', e);
                }
              }
              
              // Strategy 2: Create user interaction prompt if needed
              if (this.audioElement!.paused) {
                const playHandler = async () => {
                  try {
                    if (this.audioContext?.state === 'suspended') {
                      await this.audioContext.resume();
                    }
                    await this.audioElement?.play();
                  } catch (e) {
                    if (this.debug) {
                      console.warn('iOS: Failed to play after user interaction:', e);
                    }
                  }
                };
                
                // Add one-time event listeners
                window.addEventListener('touchend', playHandler, { once: true });
                document.addEventListener('click', playHandler, { once: true });
              }
            }
          });
        }
      }

      // Set up output analysis if not already done
      if (!this.outputAnalyser && this.audioContext) {
        this.setupOutputAnalyser();
      }

      // Start monitoring if not already started
      if (!this.animationFrameId) {
        this.startAudioLevelMonitoring();
      }

    } catch (error) {
      this.emit('error', new Error(`Failed to handle audio track: ${error}`));
    }
  }

  /**
   * Set up input audio analysis
   */
  private setupInputAnalyser(): void {
    if (!this.audioContext || !this.mediaStream) return;

    try {
      this.inputSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.inputAnalyser = this.audioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.inputDataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      
      this.inputSource.connect(this.inputAnalyser);
    } catch (error) {
      if (this.debug) {
        console.error('Failed to setup input analyser:', error);
      }
    }
  }

  /**
   * Set up output audio analysis
   */
  private setupOutputAnalyser(): void {
    if (!this.audioContext || !this.audioElement || this.outputAnalyser) return;

    try {
      this.outputSource = this.audioContext.createMediaElementSource(this.audioElement);
      this.outputAnalyser = this.audioContext.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputDataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      
      this.outputSource.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.gainNode!);
    } catch (error) {
      if (this.debug) {
        console.error('Failed to setup output analyser:', error);
      }
    }
  }

  /**
   * Start monitoring audio levels
   */
  private startAudioLevelMonitoring(): void {
    if (this.animationFrameId) return;

    const monitor = () => {
      const levels = this.getAudioLevels();
      this.emit('audioLevelsChanged', levels);
      this.animationFrameId = requestAnimationFrame(monitor);
    };

    monitor();
  }

  /**
   * Stop monitoring audio levels
   */
  private stopAudioLevelMonitoring(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get current audio levels for input and output
   */
  getAudioLevels(): { input: number; output: number } {
    let inputLevel = 0;
    let outputLevel = 0;

    // Calculate input level
    if (this.inputAnalyser && this.inputDataArray && this.isMicrophoneEnabled && !this.isMuted) {
      this.inputAnalyser.getByteFrequencyData(this.inputDataArray);
      const sum = this.inputDataArray.reduce((acc, val) => acc + val, 0);
      inputLevel = sum / this.inputDataArray.length / 255; // Normalize to 0-1
    }

    // Calculate output level
    if (this.outputAnalyser && this.outputDataArray) {
      this.outputAnalyser.getByteFrequencyData(this.outputDataArray);
      const sum = this.outputDataArray.reduce((acc, val) => acc + val, 0);
      outputLevel = (sum / this.outputDataArray.length / 255) * this.volume; // Apply volume
    }

    return {
      input: Math.min(1, inputLevel),
      output: Math.min(1, outputLevel)
    };
  }

  /**
   * Set the output volume (0-1)
   */
  setVolume(level: number): void {
    this.volume = Math.max(0, Math.min(1, level));
    
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }

    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }

    this.emit('volumeChanged', this.volume);
  }

  /**
   * Mute all audio output
   */
  mute(): void {
    this.isMuted = true;
    
    // Mute microphone
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }

    // Store current volume and set to 0
    if (this.audioElement) {
      this.audioElement.muted = true;
    }

    this.emit('muteStateChanged', true);
  }

  /**
   * Unmute all audio
   */
  unmute(): void {
    this.isMuted = false;
    
    // Unmute microphone
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }

    // Restore audio
    if (this.audioElement) {
      this.audioElement.muted = false;
    }

    this.emit('muteStateChanged', false);
  }

  /**
   * Get current states
   */
  get isMicrophoneActive(): boolean {
    return this.isMicrophoneEnabled;
  }

  get isMutedState(): boolean {
    return this.isMuted;
  }

  get currentVolume(): number {
    return this.volume;
  }

  /**
   * Get the current microphone stream (if available)
   */
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    // Stop audio level monitoring
    this.stopAudioLevelMonitoring();
    
    // Disable microphone and clean up media stream
    this.disableMicrophone();

    // Clean up abort controller to remove any pending event listeners
    // This is important if the audio context never resumed and listeners are still attached
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Clean up audio element and remove from DOM
    if (this.audioElement) {
      // Stop any playing audio
      this.audioElement.pause();
      
      // Clear the source to release resources
      this.audioElement.srcObject = null;
      
      // Remove all event listeners from audio element using stored references
      if (this.audioPlayHandler) {
        this.audioElement.removeEventListener('play', this.audioPlayHandler);
        this.audioPlayHandler = null;
      }
      if (this.audioErrorHandler) {
        this.audioElement.removeEventListener('error', this.audioErrorHandler);
        this.audioErrorHandler = null;
      }
      
      // Remove from DOM
      try {
        if (this.audioElement.remove) {
          this.audioElement.remove();
        } else if (this.audioElement.parentNode) {
          this.audioElement.parentNode.removeChild(this.audioElement);
        }
      } catch (error) {
        if (this.debug) {
          console.error('Failed to remove audio element from DOM:', error);
        }
      }
      
      this.audioElement = null;
    }

    // Disconnect and clean up Web Audio nodes
    if (this.outputSource) {
      this.outputSource.disconnect();
      this.outputSource = null;
    }

    if (this.outputAnalyser) {
      this.outputAnalyser.disconnect();
      this.outputAnalyser = null;
    }

    if (this.inputAnalyser) {
      this.inputAnalyser.disconnect();
      this.inputAnalyser = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    // Close audio context
    if (this.audioContext && typeof this.audioContext.close === 'function') {
      this.audioContext.close();
    }
    this.audioContext = null;

    // Clear data arrays
    this.inputDataArray = null;
    this.outputDataArray = null;

    // Remove all event listeners from this EventEmitter
    this.removeAllListeners();
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private log(message: string, data?: unknown): void {
    if (this.debug) {
      if (data !== undefined) {
        console.log(`[AudioManager] ${message}`, data);
      } else {
        console.log(`[AudioManager] ${message}`);
      }
    }
  }
}