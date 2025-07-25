import { EventEmitter } from 'eventemitter3';
export interface AudioManagerEvents {
    'audioLevelsChanged': (levels: {
        input: number;
        output: number;
    }) => void;
    'microphoneStateChanged': (enabled: boolean) => void;
    'muteStateChanged': (muted: boolean) => void;
    'volumeChanged': (volume: number) => void;
    'error': (error: Error) => void;
}
export interface AudioManagerConfig {
    debug?: boolean;
}
export declare class AudioManager extends EventEmitter<AudioManagerEvents> {
    private audioContext;
    private audioElement;
    private mediaStream;
    private inputAnalyser;
    private outputAnalyser;
    private inputSource;
    private outputSource;
    private gainNode;
    private animationFrameId;
    private isMicrophoneEnabled;
    private isMuted;
    private volume;
    private debug;
    private inputDataArray;
    private outputDataArray;
    private abortController;
    private audioPlayHandler;
    private audioErrorHandler;
    private isIOSDevice;
    private isSafari;
    constructor(config?: AudioManagerConfig);
    private initializeAudioContext;
    private createAudioElement;
    enableMicrophone(): Promise<void>;
    disableMicrophone(): Promise<void>;
    handleAudioTrack(track: MediaStreamTrack): Promise<void>;
    private setupInputAnalyser;
    private setupOutputAnalyser;
    private startAudioLevelMonitoring;
    private stopAudioLevelMonitoring;
    getAudioLevels(): {
        input: number;
        output: number;
    };
    setVolume(level: number): void;
    mute(): void;
    unmute(): void;
    get isMicrophoneActive(): boolean;
    get isMutedState(): boolean;
    get currentVolume(): number;
    getMediaStream(): MediaStream | null;
    dispose(): void;
    private log;
}
//# sourceMappingURL=AudioManager.d.ts.map