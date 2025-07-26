export const SPANISH_VOICE_PRESET = {
  voice: 'alloy' as const,
  turnDetection: {
    type: 'server_vad' as const,
    threshold: 0.7,
    prefixPaddingMs: 500,
    silenceDurationMs: 800
  },
  enableInputTranscription: true,
  inputAudioTranscription: {
    model: 'whisper-1' as const,
    language: 'es'
  }
}

export const ENGLISH_VOICE_PRESET = {
  voice: 'alloy' as const,
  turnDetection: {
    type: 'server_vad' as const,
    threshold: 0.7,
    prefixPaddingMs: 500,
    silenceDurationMs: 800
  },
  enableInputTranscription: true,
  inputAudioTranscription: {
    model: 'whisper-1' as const,
    language: 'en'
  }
}

export const MULTILINGUAL_VOICE_PRESET = {
  voice: 'alloy' as const,
  turnDetection: {
    type: 'server_vad' as const,
    threshold: 0.7,
    prefixPaddingMs: 500,
    silenceDurationMs: 800
  },
  enableInputTranscription: true,
  inputAudioTranscription: {
    model: 'whisper-1' as const
    // No language specified - auto-detect
  }
}