import { EventEmitter } from 'eventemitter3';
import { type WebRTCConfig } from './WebRTCManager';
import type { RealtimeVoice, AudioFormat } from '../types';
type Modality = 'text' | 'audio';
export interface RealtimeServiceConfig extends WebRTCConfig {
    tokenEndpoint?: string;
    model?: string;
    instructions?: string;
    voice?: RealtimeVoice;
    modalities?: Modality[];
    temperature?: number;
    maxOutputTokens?: number | 'inf';
    inputAudioFormat?: AudioFormat;
    outputAudioFormat?: AudioFormat;
    turnDetection?: {
        type: 'server_vad';
        threshold?: number;
        prefix_padding_ms?: number;
        silence_duration_ms?: number;
    };
}
export interface RealtimeServiceState {
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    error?: Error;
    messages: Array<{
        id: string;
        role: 'user' | 'assistant';
        text?: string;
        timestamp: number;
    }>;
}
export interface RealtimeServiceEvents {
    connected: () => void;
    disconnected: () => void;
    error: (error: Error) => void;
    textReceived: (text: string) => void;
    audioReceived: (audio: ArrayBuffer) => void;
    transcriptionReceived: (text: string) => void;
    statusChanged: (status: RealtimeServiceState['status']) => void;
}
export declare class OpenAIRealtimeService extends EventEmitter<RealtimeServiceEvents> {
    private webrtcManager;
    private config;
    state: RealtimeServiceState;
    private events;
    private audioElement;
    private isDisposed;
    constructor(config: RealtimeServiceConfig, events?: any);
    connect(audioElement?: HTMLAudioElement): Promise<void>;
    updateInstructions(instructions: string): Promise<void>;
    sendText(text: string): Promise<void>;
    disconnect(): Promise<void>;
    dispose(): void;
    updateConfig(config: Partial<RealtimeServiceConfig>): void;
    private setupWebRTCHandlers;
    private handleDataChannelMessage;
    private waitForDataChannel;
    private sendSessionConfig;
    private updateStatus;
    private log;
}
export default OpenAIRealtimeService;
//# sourceMappingURL=OpenAIRealtimeService.d.ts.map