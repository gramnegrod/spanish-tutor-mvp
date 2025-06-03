/**
 * Audio Stream and Element Management Module
 */

export class AudioManager {
  private mediaStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;

  async setupAudio(audioElement?: HTMLAudioElement): Promise<MediaStream> {
    console.log('[AudioManager] Setting up audio...');
    
    // If an audio element is provided, mark it as external
    if (audioElement) {
      audioElement.setAttribute('data-external', 'true');
    }
    
    this.audioElement = audioElement || this.createAudioElement();
    console.log('[AudioManager] Audio element ready');
    
    // Get microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      this.audioElement.srcObject = stream;
      console.log('[AudioManager] Audio stream attached to element');
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
    
    // Stop audio playback and remove element if we created it
    if (this.audioElement) {
      this.audioElement.srcObject = null;
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
}