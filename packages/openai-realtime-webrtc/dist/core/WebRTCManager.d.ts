import { EventEmitter } from 'eventemitter3';
export interface WebRTCConfig {
    tokenEndpoint?: string;
    model?: string;
    iceServers?: RTCIceServer[];
    audioConstraints?: MediaTrackConstraints;
    debug?: boolean;
}
export interface ConnectionState {
    connectionState: RTCPeerConnectionState;
    iceConnectionState: RTCIceConnectionState;
    dataChannelState: RTCDataChannelState | null;
    isAudioStreaming: boolean;
}
export interface WebRTCEvents {
    connected: () => void;
    disconnected: (reason?: string) => void;
    connectionFailed: (error: Error) => void;
    dataChannelMessage: (data: string | ArrayBuffer) => void;
    audioTrackReceived: (track: MediaStreamTrack) => void;
    connectionStateChanged: (state: ConnectionState) => void;
    dataChannelReady: () => void;
}
export declare class WebRTCManager extends EventEmitter<WebRTCEvents> {
    private peerConnection;
    private dataChannel;
    private localStream;
    private config;
    private ephemeralToken;
    constructor(config?: WebRTCConfig);
    initialize(): Promise<void>;
    sendData(data: string | ArrayBuffer): void;
    isConnected(): boolean;
    isDataChannelOpen(): boolean;
    getConnectionState(): ConnectionState;
    close(): Promise<void>;
    dispose(): void;
    private getEphemeralToken;
    private setupLocalMedia;
    private completeNegotiation;
    private setupPeerConnectionHandlers;
    private setupDataChannelHandlers;
    private cleanup;
    private log;
}
export default WebRTCManager;
//# sourceMappingURL=WebRTCManager.d.ts.map