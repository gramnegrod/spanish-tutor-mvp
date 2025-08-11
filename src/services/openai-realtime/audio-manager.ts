/**
 * Audio Stream and Element Management Module
 */

export class AudioManager {
  private mediaStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private audioBufferState: 'idle' | 'playing' | 'stopped' | 'cleared' = 'idle';

  async setupAudio(audioElement?: HTMLAudioElement): Promise<MediaStream> {
    console.log('[AudioManager] Setting up audio...');
    
    // If an audio element is provided, mark it as external
    if (audioElement) {
      audioElement.setAttribute('data-external', 'true');
    }
    
    this.audioElement = audioElement || this.createAudioElement();
    console.log('[AudioManager] Audio element ready');
    
    // Get microphone access with quality constraints
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000  // Match OpenAI's expected sample rate
      }
    });
    console.log('[AudioManager] Microphone access granted');
    
    return this.mediaStream;
  }

  setAudioStream(stream: MediaStream): void {
    if (!this.audioElement) {
      console.error('[AudioManager] No audio element available');
      return;
    }

    // Ensure we only set the stream once and it's not the same stream
    const currentStream = this.audioElement.srcObject as MediaStream;
    if (!currentStream || currentStream.id !== stream.id) {
      // Remove old stream if exists
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      
      // Set buffering properties to handle choppy audio
      this.audioElement.preload = 'auto';
      
      // Create AudioContext for better audio processing if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000, // Match OpenAI's sample rate
          latencyHint: 'playback' // Optimize for smooth playback over low latency
        });
        
        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0;
        this.gainNode.connect(this.audioContext.destination);
      }
      
      // Ensure audio element has proper settings for smooth playback
      this.audioElement.srcObject = stream;
      this.audioElement.volume = 1.0;
      
      // Apply playback rate adjustment for smoother audio
      // Slightly slower playback can help with choppy audio
      this.audioElement.playbackRate = 0.98;
      
      console.log('[AudioManager] Audio stream attached with AudioContext buffering');
    } else {
      console.warn('[AudioManager] Audio element already has this stream, ignoring...');
    }
  }

  private createAudioElement(): HTMLAudioElement {
    // Clean up any existing audio elements first
    const existingAudio = document.querySelectorAll('audio[data-openai-realtime="true"]');
    existingAudio.forEach(audio => {
      console.warn('[AudioManager] Removing orphaned audio element');
      audio.remove();
    });
    
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.setAttribute('data-openai-realtime', 'true');
    // Add to body so it persists
    document.body.appendChild(audio);
    return audio;
  }

  cleanup(): void {
    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Clean up AudioContext
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.gainNode = null;
    }
    
    // Stop audio playback and remove element if we created it
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement.playbackRate = 1.0; // Reset playback rate
      // Remove from DOM if we created it
      if (this.audioElement.parentNode && !this.audioElement.hasAttribute('data-external')) {
        this.audioElement.remove();
      }
      this.audioElement = null;
    }
    
    console.log('[AudioManager] Cleanup complete');
  }

  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }
  
  setBufferState(state: 'idle' | 'playing' | 'stopped' | 'cleared'): void {
    console.log('[AudioManager] Buffer state changed:', this.audioBufferState, '->', state);
    this.audioBufferState = state;
  }
  
  getBufferState(): string {
    return this.audioBufferState;
  }
}