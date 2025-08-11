# Audio Pipeline Module

## Overview

The Audio Pipeline module provides a complete audio capture and processing system specifically designed for the OpenAI Realtime API. It handles microphone access, audio format conversion (PCM16), smooth playback, and proper resource cleanup.

## Features

- **PCM16 Audio Format**: Converts audio to/from PCM16 format at 24kHz sample rate as required by OpenAI Realtime API
- **Real-time Audio Capture**: High-quality microphone access with noise suppression and echo cancellation
- **Smooth Audio Playback**: Optimized audio playback without choppiness using Web Audio API
- **Volume Control**: Built-in gain control for audio input/output
- **Audio Level Monitoring**: Real-time audio level visualization
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Resource Management**: Proper cleanup of audio resources and memory management
- **Browser Compatibility**: Cross-browser support with fallbacks

## Installation

The module is part of the Spanish Tutor project and can be imported directly:

```typescript
import { AudioPipeline, isAudioRecordingSupported } from '../services/audio-pipeline';
```

## Quick Start

### Basic Usage

```typescript
import { AudioPipeline } from '../services/audio-pipeline';

// Create audio pipeline instance
const audioPipeline = new AudioPipeline();

// Start microphone capture
try {
  const audioResult = await audioPipeline.startMicrophone();
  console.log('Microphone started successfully');
  
  // Pipeline is now ready for audio processing
  if (audioPipeline.isReady()) {
    console.log('Audio pipeline ready');
  }
} catch (error) {
  console.error('Failed to start microphone:', error.message);
}

// Stop audio and cleanup
audioPipeline.stopAudio();
```

### Audio Format Conversion

```typescript
// Convert audio from Web Audio API to PCM16 for OpenAI
const float32AudioData = new Float32Array([0.5, -0.3, 0.8, -1.0]);
const pcm16Data = audioPipeline.convertFloat32ToPCM16(float32AudioData);

// Convert PCM16 back to Float32 for playback
const float32Data = audioPipeline.convertPCM16ToFloat32(pcm16Data);
```

### Audio Playback

```typescript
// Play PCM16 audio data through Web Audio API
const pcm16AudioData = new Int16Array(24000); // 1 second at 24kHz
await audioPipeline.playPCM16Audio(pcm16AudioData);
```

## API Reference

### AudioPipeline Class

#### Constructor

```typescript
constructor(config?: AudioPipelineConfig)
```

Creates a new AudioPipeline instance with optional configuration.

**Parameters:**
- `config` (optional): Configuration object

**Configuration Options:**
```typescript
interface AudioPipelineConfig {
  sampleRate?: number;        // Default: 24000 (Hz)
  bufferSize?: number;        // Default: 256
  echoCancellation?: boolean; // Default: true
  noiseSuppression?: boolean; // Default: true
  autoGainControl?: boolean;  // Default: true
  volume?: number;           // Default: 1.0 (0.0 - 1.0)
  enableVolumeControl?: boolean; // Default: true
}
```

#### Methods

##### startMicrophone()

```typescript
async startMicrophone(): Promise<AudioStreamResult>
```

Initializes the audio pipeline and requests microphone access.

**Returns:** Promise resolving to audio stream and processing nodes
**Throws:** Error if microphone access fails or browser not supported

##### convertFloat32ToPCM16()

```typescript
convertFloat32ToPCM16(float32Array: Float32Array): Int16Array
```

Converts Float32Array audio data to PCM16 format for OpenAI Realtime API.

**Parameters:**
- `float32Array`: Input audio data from Web Audio API

**Returns:** PCM16 formatted audio data as Int16Array

##### convertPCM16ToFloat32()

```typescript
convertPCM16ToFloat32(pcm16Array: Int16Array): Float32Array
```

Converts PCM16 audio data back to Float32Array for Web Audio API.

**Parameters:**
- `pcm16Array`: PCM16 audio data

**Returns:** Float32Array for Web Audio API

##### createAudioPlayer()

```typescript
createAudioPlayer(): HTMLAudioElement
```

Creates and configures an optimized audio element for smooth playback.

**Returns:** Configured HTMLAudioElement

##### playPCM16Audio()

```typescript
async playPCM16Audio(pcm16Data: Int16Array): Promise<void>
```

Plays PCM16 audio data through the Web Audio API.

**Parameters:**
- `pcm16Data`: PCM16 audio data to play

**Returns:** Promise that resolves when playback starts

##### setVolume()

```typescript
setVolume(volume: number): void
```

Sets the volume level for audio processing.

**Parameters:**
- `volume`: Volume level (0.0 to 1.0)

##### getAudioLevel()

```typescript
getAudioLevel(): number
```

Gets current audio level for visualization.

**Returns:** Audio level (0.0 to 1.0)

##### isReady()

```typescript
isReady(): boolean
```

Checks if the audio pipeline is properly initialized.

**Returns:** True if ready for audio processing

##### resumeAudioContext()

```typescript
async resumeAudioContext(): Promise<void>
```

Resumes audio context if suspended (required by browser policies).

##### stopAudio()

```typescript
stopAudio(audioElement?: HTMLAudioElement): void
```

Stops audio capture and cleans up all resources.

**Parameters:**
- `audioElement` (optional): External audio element to clean up

### Utility Functions

#### isAudioRecordingSupported()

```typescript
function isAudioRecordingSupported(): boolean
```

Checks if audio recording is supported in the current browser.

#### checkMicrophonePermissions()

```typescript
async function checkMicrophonePermissions(): Promise<PermissionState>
```

Checks microphone permissions without requesting access.

#### getAudioInputDevices()

```typescript
async function getAudioInputDevices(): Promise<MediaDeviceInfo[]>
```

Gets available audio input devices.

#### formatAudioSize()

```typescript
function formatAudioSize(bytes: number): string
```

Formats audio data size for display.

#### calculateAudioDuration()

```typescript
function calculateAudioDuration(sampleCount: number, sampleRate: number): number
```

Calculates audio duration from sample count.

## Error Handling

The module provides comprehensive error handling with user-friendly messages:

### Permission Errors

```typescript
try {
  await audioPipeline.startMicrophone();
} catch (error) {
  if (error.message.includes('access denied')) {
    // Handle permission denied
    console.log('Please allow microphone access');
  } else if (error.message.includes('No microphone found')) {
    // Handle no microphone
    console.log('Please connect a microphone');
  } else if (error.message.includes('being used by another application')) {
    // Handle device busy
    console.log('Close other applications using microphone');
  }
}
```

### Browser Support

```typescript
if (!isAudioRecordingSupported()) {
  console.error('Audio recording not supported in this browser');
  // Show fallback UI or redirect to supported browser
}
```

## Integration Examples

### React Component Integration

```typescript
import React, { useEffect, useState } from 'react';
import { AudioPipeline } from '../services/audio-pipeline';

const AudioComponent: React.FC = () => {
  const [audioPipeline] = useState(() => new AudioPipeline());
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setAudioLevel(audioPipeline.getAudioLevel());
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, audioPipeline]);

  const startRecording = async () => {
    try {
      await audioPipeline.startMicrophone();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    audioPipeline.stopAudio();
    setIsRecording(false);
    setAudioLevel(0);
  };

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <div>Audio Level: {Math.round(audioLevel * 100)}%</div>
    </div>
  );
};
```

### OpenAI Realtime API Integration

```typescript
import { AudioPipeline } from '../services/audio-pipeline';

class OpenAIRealtimeClient {
  private audioPipeline: AudioPipeline;
  
  constructor() {
    this.audioPipeline = new AudioPipeline({
      sampleRate: 24000, // OpenAI requirement
      echoCancellation: true,
      noiseSuppression: true
    });
  }
  
  async startSession() {
    // Start microphone
    await this.audioPipeline.startMicrophone();
    
    // Set up real-time audio processing
    this.processAudioStream();
  }
  
  private processAudioStream() {
    // Example: Process audio in chunks
    const processChunk = (audioData: Float32Array) => {
      // Convert to PCM16 for OpenAI
      const pcm16Data = this.audioPipeline.convertFloat32ToPCM16(audioData);
      
      // Send to OpenAI Realtime API
      this.sendToOpenAI(pcm16Data);
    };
    
    // Set up audio worklet or script processor for real-time processing
    // Implementation depends on specific requirements
  }
  
  private sendToOpenAI(pcm16Data: Int16Array) {
    // Convert to base64 for OpenAI API
    const base64Audio = this.arrayBufferToBase64(pcm16Data.buffer);
    
    // Send to OpenAI Realtime API
    // websocket.send(JSON.stringify({
    //   type: 'input_audio_buffer.append',
    //   audio: base64Audio
    // }));
  }
  
  async playOpenAIResponse(pcm16Data: Int16Array) {
    // Play response from OpenAI
    await this.audioPipeline.playPCM16Audio(pcm16Data);
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
```

## Testing

The module includes comprehensive tests covering:

- Audio format conversion accuracy
- Error handling scenarios
- Resource cleanup
- Browser compatibility
- Integration workflows

Run tests with:

```bash
npm test src/services/__tests__/audio-pipeline.test.ts
```

## Performance Considerations

### Memory Management

- Always call `stopAudio()` to clean up resources
- Use appropriate buffer sizes for your use case
- Monitor memory usage in long-running sessions

### Audio Quality

- 24kHz sample rate optimized for speech (OpenAI requirement)
- Built-in noise suppression and echo cancellation
- Automatic gain control for consistent levels

### Latency Optimization

- Low-latency audio processing for real-time applications
- Optimized buffer sizes for smooth playback
- Web Audio API for minimal processing overhead

## Browser Support

### Supported Browsers

- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

### Required Features

- `navigator.mediaDevices.getUserMedia`
- `AudioContext`
- `MediaStreamAudioSourceNode`
- `GainNode`
- `AnalyserNode`

### Fallbacks

The module gracefully handles unsupported browsers:

```typescript
if (!isAudioRecordingSupported()) {
  // Show message to user about browser compatibility
  console.warn('Please use a modern browser that supports audio recording');
}
```

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Check browser permissions
   - Ensure HTTPS in production
   - Clear browser cache/data

2. **No Audio Device Found**
   - Verify microphone is connected
   - Check system audio settings
   - Try different audio device

3. **Choppy Audio Playback**
   - Check system performance
   - Reduce buffer size
   - Close other audio applications

4. **Audio Context Suspended**
   - Call `resumeAudioContext()` after user interaction
   - Required by browser autoplay policies

### Debug Mode

Enable debug logging by setting up console monitoring:

```typescript
// Monitor audio level for debugging
setInterval(() => {
  if (audioPipeline.isReady()) {
    console.log('Audio Level:', audioPipeline.getAudioLevel());
  }
}, 1000);
```

## Contributing

When contributing to the audio pipeline module:

1. Ensure all tests pass
2. Add tests for new functionality
3. Update documentation
4. Test across different browsers
5. Consider performance implications

## License

This module is part of the Spanish Tutor project. See project license for details.