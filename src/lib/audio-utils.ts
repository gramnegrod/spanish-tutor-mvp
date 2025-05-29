export class AudioProcessor {
  private audioContext: AudioContext
  private sampleRate = 24000 // OpenAI Realtime API expects 24kHz

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  async blobToPCM16(blob: Blob): Promise<ArrayBuffer> {
    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    
    // Resample to 24kHz if needed
    const resampledBuffer = await this.resample(audioBuffer, this.sampleRate)
    
    // Convert to PCM16
    return this.convertToPCM16(resampledBuffer)
  }

  private async resample(audioBuffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    if (audioBuffer.sampleRate === targetSampleRate) {
      return audioBuffer
    }

    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.duration * targetSampleRate,
      targetSampleRate
    )

    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(offlineContext.destination)
    source.start(0)

    return await offlineContext.startRendering()
  }

  private convertToPCM16(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length
    const arrayBuffer = new ArrayBuffer(length * 2) // 2 bytes per sample for PCM16
    const view = new DataView(arrayBuffer)
    const channelData = audioBuffer.getChannelData(0) // Mono audio

    let offset = 0
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true) // Little endian
      offset += 2
    }

    return arrayBuffer
  }

  base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  pcm16ToFloat32(pcm16: ArrayBuffer): Float32Array {
    const view = new DataView(pcm16)
    const float32 = new Float32Array(pcm16.byteLength / 2)
    
    for (let i = 0; i < float32.length; i++) {
      const sample = view.getInt16(i * 2, true) // Little endian
      float32[i] = sample / (sample < 0 ? 0x8000 : 0x7FFF)
    }
    
    return float32
  }

  async playPCM16(pcm16Data: ArrayBuffer): Promise<void> {
    const float32Data = this.pcm16ToFloat32(pcm16Data)
    const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, this.sampleRate)
    audioBuffer.getChannelData(0).set(float32Data)

    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.audioContext.destination)
    source.start()

    return new Promise((resolve) => {
      source.onended = () => resolve()
    })
  }
}