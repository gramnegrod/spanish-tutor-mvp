export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  async startRecording(): Promise<void> {
    try {
      // Get user's microphone stream
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder with the stream
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };
      
      // Fallback for browsers that don't support webm
      const mimeType = MediaRecorder.isTypeSupported(options.mimeType) 
        ? options.mimeType 
        : 'audio/mp4';
      
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.audioChunks = [];
      
      // Collect audio data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw new Error('Failed to start audio recording. Please check microphone permissions.');
    }
  }
  
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        // Create a blob from all the chunks
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder!.mimeType 
        });
        
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
  
  async pauseRecording(): Promise<void> {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }
  
  async resumeRecording(): Promise<void> {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }
  
  // Convert Blob to File for OpenAI API
  static blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, { 
      type: blob.type,
      lastModified: Date.now() 
    });
  }
  
  // Get audio duration (approximate)
  static async getAudioDuration(blob: Blob): Promise<number> {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(audioUrl);
        resolve(audio.duration);
      });
    });
  }
}

// Utility to check if browser supports audio recording
export function isAudioRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    window.MediaRecorder
  );
}

// Helper to format audio blob size
export function formatAudioSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}