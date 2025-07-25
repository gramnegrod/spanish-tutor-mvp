import type { RealtimeConfig, RealtimeVoice, AudioFormat, Message, MessageRole } from './index';
export declare function validateConfig(config: RealtimeConfig): Required<RealtimeConfig>;
export declare function isValidVoice(voice: string): voice is RealtimeVoice;
export declare function isValidAudioFormat(format: string): format is AudioFormat;
export declare function createTextMessage(text: string, role?: MessageRole): Message;
export declare function createAudioMessage(audioData: string, role?: MessageRole, duration?: number): Message;
export declare function generateMessageId(): string;
export declare function calculateAudioDuration(audioData: ArrayBuffer, format: AudioFormat, sampleRate?: number): number;
export declare function arrayBufferToBase64(buffer: ArrayBuffer): string;
export declare function base64ToArrayBuffer(base64: string): ArrayBuffer;
export declare function formatError(error: unknown): string;
export declare function isConnectionError(error: unknown): boolean;
export declare function calculateAverage(values: number[]): number;
export declare function formatDuration(ms: number): string;
export declare function createDebugLogger(enabled: boolean): {
    log: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
};
//# sourceMappingURL=utils.d.ts.map