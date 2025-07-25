export interface RealtimeConfig {
    tokenEndpoint: string;
    debug?: boolean;
    autoReconnect?: boolean;
    voice?: RealtimeVoice;
    instructions?: string;
    audioFormat?: AudioFormat;
    enableVAD?: boolean;
    iceServers?: RTCIceServer[];
    connectionTimeout?: number;
}
export type RealtimeVoice = 'alloy' | 'echo' | 'shimmer' | 'nova' | 'fable' | 'onyx';
export type AudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
export type MessageRole = 'user' | 'assistant' | 'system';
export interface Message {
    id: string;
    role: MessageRole;
    text?: string;
    audio?: {
        data: string;
        duration?: number;
    };
    timestamp: number;
}
export interface RealtimeEvents {
    connectionStateChange: (state: ConnectionState) => void;
    message: (message: Message) => void;
    speechStart: () => void;
    speechEnd: () => void;
    transcription: (text: string, isFinal: boolean) => void;
    error: (error: RealtimeError) => void;
    debug: (info: string) => void;
}
export interface RealtimeError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface RealtimeState {
    connectionState: ConnectionState;
    isRecording: boolean;
    isSpeaking: boolean;
    messages: Message[];
    metrics?: {
        duration: number;
        messageCount: number;
        avgResponseTime?: number;
    };
}
export interface RealtimeMethods {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendText(text: string): Promise<void>;
    startRecording(): Promise<void>;
    stopRecording(): Promise<void>;
    clearConversation(): void;
    updateConfig(config: Partial<RealtimeConfig>): void;
}
export interface UseRealtimeConfig extends RealtimeConfig {
    autoConnect?: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
}
export interface UseRealtimeReturn extends RealtimeState, RealtimeMethods {
    isReady: boolean;
}
export declare const DEFAULT_CONFIG: Partial<RealtimeConfig>;
export declare const VOICE_OPTIONS: Record<RealtimeVoice, string>;
export declare function isRealtimeError(error: unknown): error is RealtimeError;
//# sourceMappingURL=index.d.ts.map