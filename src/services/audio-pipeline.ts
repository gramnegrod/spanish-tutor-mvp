/**
 * Complete Audio Pipeline Module for OpenAI Realtime API
 * 
 * This module provides a comprehensive audio capture and processing system
 * specifically designed for the OpenAI Realtime API requirements:
 * - PCM16 format at 24kHz sample rate
 * - Real-time audio capture from microphone
 * - Smooth audio playback without choppiness
 * - Proper error handling and cleanup
 */

export interface AudioPipelineConfig {
  sampleRate?: number;
  bufferSize?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  volume?: number;
  enableVolumeControl?: boolean;
}

export interface AudioStreamResult {
  stream: MediaStream;
  audioContext: AudioContext;
  sourceNode: MediaStreamAudioSourceNode;
  gainNode?: GainNode;
  analyserNode?: AnalyserNode;
}

/**
 * Main Audio Pipeline class for handling all audio operations
 */
export class AudioPipeline {
  private config: Required<AudioPipelineConfig>;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isInitialized = false;

  constructor(config: AudioPipelineConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate || 24000, // OpenAI Realtime API requirement
      bufferSize: config.bufferSize || 256,
      echoCancellation: config.echoCancellation ?? true,
      noiseSuppression: config.noiseSuppression ?? true,
      autoGainControl: config.autoGainControl ?? true,
      volume: config.volume || 1.0,
      enableVolumeControl: config.enableVolumeControl ?? true
    };
  }

  /**
   * Initialize the audio pipeline with microphone access
   * @returns Promise<AudioStreamResult> - Audio stream and processing nodes
   */
  async startMicrophone(): Promise<AudioStreamResult> {
    try {
      console.log('[AudioPipeline] Initializing microphone...');
      
      // Check for browser support
      if (!this.isBrowserSupported()) {
        throw new Error('Audio recording not supported in this browser');
      }

      // Request microphone permissions with quality constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
          sampleRate: this.config.sampleRate,
          channelCount: 1, // Mono audio for OpenAI
          latency: 0.01 // Low latency for real-time processing
        }
      });

      // Create AudioContext with optimal settings for OpenAI Realtime API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive' // Balance between latency and glitch avoidance
      });

      // Create audio processing nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create gain node for volume control if enabled
      if (this.config.enableVolumeControl) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.config.volume;
        this.sourceNode.connect(this.gainNode);
      }

      // Create analyser node for audio visualization/monitoring
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      
      // Connect audio graph
      const lastNode = this.gainNode || this.sourceNode;
      lastNode.connect(this.analyserNode);
      
      this.isInitialized = true;
      console.log('[AudioPipeline] Microphone initialized successfully');

      return {
        stream: this.mediaStream,
        audioContext: this.audioContext,
        sourceNode: this.sourceNode,
        gainNode: this.gainNode || undefined,
        analyserNode: this.analyserNode
      };

    } catch (error) {
      console.error('[AudioPipeline] Failed to initialize microphone:', error);
      
      // Provide user-friendly error messages
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            throw new Error('Microphone access denied. Please allow microphone permissions and try again.');
          case 'NotFoundError':
            throw new Error('No microphone found. Please connect a microphone and try again.');
          case 'NotReadableError':
            throw new Error('Microphone is being used by another application. Please close other applications and try again.');
          default:
            throw new Error(`Microphone error: ${error.message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Convert Float32Array audio data to PCM16 format for OpenAI Realtime API
   * @param float32Array - Input audio data from Web Audio API
   * @returns Int16Array - PCM16 formatted audio data
   */
  convertFloat32ToPCM16(float32Array: Float32Array): Int16Array {
    const pcm16Array = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp the value to [-1, 1] range
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      
      // Convert to 16-bit PCM
      // Negative values: multiply by 32768 (0x8000)
      // Positive values: multiply by 32767 (0x7FFF)
      pcm16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    return pcm16Array;
  }

  /**
   * Convert PCM16 data back to Float32Array for playback
   * @param pcm16Array - PCM16 audio data
   * @returns Float32Array - Audio data for Web Audio API
   */
  convertPCM16ToFloat32(pcm16Array: Int16Array): Float32Array {
    const float32Array = new Float32Array(pcm16Array.length);
    
    for (let i = 0; i < pcm16Array.length; i++) {
      // Convert back to float range [-1, 1]
      const sample = pcm16Array[i];
      float32Array[i] = sample / (sample < 0 ? 0x8000 : 0x7FFF);
    }
    
    return float32Array;
  }

  /**
   * Create and configure an optimized audio player for smooth playback
   * @returns HTMLAudioElement - Configured audio element
   */
  createAudioPlayer(): HTMLAudioElement {
    console.log('[AudioPipeline] Creating optimized audio player...');
    
    // Clean up any existing audio elements from this pipeline
    this.cleanupAudioElement();
    
    const audioElement = document.createElement('audio');
    
    // Configure for optimal playback
    audioElement.autoplay = true;
    audioElement.controls = false;
    audioElement.volume = this.config.volume;
    audioElement.preload = 'auto';
    
    // Anti-choppy audio settings
    audioElement.crossOrigin = 'anonymous';
    
    // Set attributes for identification
    audioElement.setAttribute('data-audio-pipeline', 'true');
    audioElement.setAttribute('data-created-at', Date.now().toString());
    
    // Add event listeners for monitoring
    audioElement.addEventListener('loadstart', () => {
      console.log('[AudioPipeline] Audio loading started');
    });
    
    audioElement.addEventListener('canplay', () => {
      console.log('[AudioPipeline] Audio can start playing');
    });
    
    audioElement.addEventListener('error', (e) => {
      console.error('[AudioPipeline] Audio playback error:', e);
    });
    
    // Add to DOM for playback
    document.body.appendChild(audioElement);
    this.audioElement = audioElement;
    
    console.log('[AudioPipeline] Audio player created and configured');
    return audioElement;
  }

  /**
   * Play PCM16 audio data through the Web Audio API for smooth playback
   * @param pcm16Data - PCM16 audio data to play
   * @returns Promise<void> - Resolves when playback starts
   */
  async playPCM16Audio(pcm16Data: Int16Array): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio pipeline not initialized. Call startMicrophone() first.');
    }

    try {
      // Convert PCM16 to Float32 for Web Audio API
      const float32Data = this.convertPCM16ToFloat32(pcm16Data);
      
      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(
        1, // Mono
        float32Data.length,
        this.config.sampleRate
      );
      
      // Copy data to buffer
      audioBuffer.getChannelData(0).set(float32Data);
      
      // Create and configure buffer source
      const bufferSource = this.audioContext.createBufferSource();
      bufferSource.buffer = audioBuffer;
      
      // Apply gain if available
      if (this.gainNode) {
        bufferSource.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
      } else {
        bufferSource.connect(this.audioContext.destination);
      }
      
      // Start playback
      bufferSource.start();
      
      console.log('[AudioPipeline] PCM16 audio playback started');
      
      // Return promise that resolves when playback ends
      return new Promise((resolve) => {
        bufferSource.onended = () => {
          console.log('[AudioPipeline] PCM16 audio playback ended');
          resolve();
        };
      });
      
    } catch (error) {
      console.error('[AudioPipeline] Error playing PCM16 audio:', error);
      throw error;
    }
  }

  /**
   * Set the volume level for audio processing
   * @param volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.config.volume = clampedVolume;
    
    if (this.gainNode) {
      this.gainNode.gain.value = clampedVolume;
    }
    
    if (this.audioElement) {
      this.audioElement.volume = clampedVolume;
    }
    
    console.log('[AudioPipeline] Volume set to:', clampedVolume);
  }

  /**
   * Get current audio level for visualization
   * @returns number - Audio level (0.0 to 1.0)
   */
  getAudioLevel(): number {
    if (!this.analyserNode) {
      return 0;
    }
    
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for audio level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    
    const rms = Math.sqrt(sum / dataArray.length);
    return rms / 255; // Normalize to 0-1 range
  }

  /**
   * Check if the audio pipeline is properly initialized
   * @returns boolean - True if initialized
   */
  isReady(): boolean {
    return this.isInitialized && 
           this.audioContext !== null && 
           this.mediaStream !== null &&
           this.audioContext.state === 'running';
  }

  /**
   * Resume audio context if suspended (required by browser policies)
   */
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('[AudioPipeline] Audio context resumed');
    }
  }

  /**
   * Stop audio capture and clean up all resources
   * @param audioElement - Optional external audio element to clean up
   */
  stopAudio(audioElement?: HTMLAudioElement): void {
    console.log('[AudioPipeline] Stopping audio and cleaning up...');
    
    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('[AudioPipeline] Stopped media track:', track.kind);
      });
      this.mediaStream = null;
    }
    
    // Disconnect audio nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().then(() => {
        console.log('[AudioPipeline] Audio context closed');
      });
      this.audioContext = null;
    }
    
    // Clean up audio elements
    this.cleanupAudioElement();
    if (audioElement) {
      this.cleanupExternalAudioElement(audioElement);
    }
    
    this.isInitialized = false;
    console.log('[AudioPipeline] Audio pipeline stopped and cleaned up');
  }

  /**
   * Clean up internal audio element
   */
  private cleanupAudioElement(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      this.audioElement.src = '';
      
      if (this.audioElement.parentNode) {
        this.audioElement.remove();
      }
      
      this.audioElement = null;
    }
  }

  /**
   * Clean up external audio element
   */
  private cleanupExternalAudioElement(audioElement: HTMLAudioElement): void {
    try {
      audioElement.pause();
      audioElement.srcObject = null;
      audioElement.src = '';
      audioElement.load(); // Reset the element
      console.log('[AudioPipeline] External audio element cleaned up');
    } catch (error) {
      console.warn('[AudioPipeline] Error cleaning up external audio element:', error);
    }
  }

  /**
   * Check if browser supports required audio features
   */
  private isBrowserSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.AudioContext &&
      window.MediaStreamAudioSourceNode
    );
  }
}

/**
 * Utility Functions for Audio Pipeline
 */

/**
 * Check if audio recording is supported in the current browser
 * @returns boolean - True if supported
 */
export function isAudioRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    window.AudioContext &&
    window.MediaStreamAudioSourceNode
  );
}

/**
 * Check microphone permissions without requesting access
 * @returns Promise<PermissionState> - Permission state
 */
export async function checkMicrophonePermissions(): Promise<PermissionState> {
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return permission.state;
  } catch (error) {
    console.warn('[AudioPipeline] Cannot check microphone permissions:', error);
    return 'prompt'; // Assume prompt state if unable to check
  }
}

/**
 * Get available audio input devices
 * @returns Promise<MediaDeviceInfo[]> - List of audio input devices
 */
export async function getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.error('[AudioPipeline] Error getting audio input devices:', error);
    return [];
  }
}

/**
 * Format audio data size for display
 * @param bytes - Size in bytes
 * @returns string - Formatted size string
 */
export function formatAudioSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculate audio duration from sample count
 * @param sampleCount - Number of audio samples
 * @param sampleRate - Sample rate in Hz
 * @returns number - Duration in seconds
 */
export function calculateAudioDuration(sampleCount: number, sampleRate: number): number {
  return sampleCount / sampleRate;
}

// Export default instance for easy usage
export const audioPipeline = new AudioPipeline();