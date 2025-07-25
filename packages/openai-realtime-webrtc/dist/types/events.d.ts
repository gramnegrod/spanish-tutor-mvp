import type { RealtimeError, RealtimeVoice } from './index';
export interface ClientEvent {
    type: string;
    event_id?: string;
}
export interface SessionUpdateEvent extends ClientEvent {
    type: 'session.update';
    session: {
        voice?: RealtimeVoice;
        instructions?: string;
        temperature?: number;
    };
}
export interface AudioAppendEvent extends ClientEvent {
    type: 'input_audio_buffer.append';
    audio: string;
}
export interface AudioCommitEvent extends ClientEvent {
    type: 'input_audio_buffer.commit';
}
export interface AudioClearEvent extends ClientEvent {
    type: 'input_audio_buffer.clear';
}
export interface MessageCreateEvent extends ClientEvent {
    type: 'conversation.item.create';
    item: {
        type: 'message';
        role: 'user';
        content: [
            {
                type: 'input_text';
                text: string;
            }
        ];
    };
}
export interface ResponseCreateEvent extends ClientEvent {
    type: 'response.create';
}
export type AnyClientEvent = SessionUpdateEvent | AudioAppendEvent | AudioCommitEvent | AudioClearEvent | MessageCreateEvent | ResponseCreateEvent;
export interface ServerEvent {
    type: string;
    event_id?: string;
}
export interface SessionCreatedEvent extends ServerEvent {
    type: 'session.created';
    session: {
        id: string;
        voice: RealtimeVoice;
        instructions?: string;
    };
}
export interface SessionUpdatedEvent extends ServerEvent {
    type: 'session.updated';
    session: {
        id: string;
        voice: RealtimeVoice;
        instructions?: string;
    };
}
export interface SpeechStartedEvent extends ServerEvent {
    type: 'input_audio_buffer.speech_started';
    audio_start_ms: number;
}
export interface SpeechStoppedEvent extends ServerEvent {
    type: 'input_audio_buffer.speech_stopped';
    audio_end_ms: number;
}
export interface AudioCommittedEvent extends ServerEvent {
    type: 'input_audio_buffer.committed';
    item_id: string;
}
export interface TranscriptionCompletedEvent extends ServerEvent {
    type: 'conversation.item.input_audio_transcription.completed';
    item_id: string;
    transcript: string;
}
export interface ResponseStartedEvent extends ServerEvent {
    type: 'response.created';
    response: {
        id: string;
        status: 'in_progress';
    };
}
export interface ResponseDoneEvent extends ServerEvent {
    type: 'response.done';
    response: {
        id: string;
        status: 'completed';
    };
}
export interface TextDeltaEvent extends ServerEvent {
    type: 'response.text.delta';
    response_id: string;
    item_id: string;
    delta: string;
}
export interface TextDoneEvent extends ServerEvent {
    type: 'response.text.done';
    response_id: string;
    item_id: string;
    text: string;
}
export interface AudioDeltaEvent extends ServerEvent {
    type: 'response.audio.delta';
    response_id: string;
    item_id: string;
    delta: string;
}
export interface AudioDoneEvent extends ServerEvent {
    type: 'response.audio.done';
    response_id: string;
    item_id: string;
}
export interface AudioTranscriptDeltaEvent extends ServerEvent {
    type: 'response.audio_transcript.delta';
    response_id: string;
    item_id: string;
    delta: string;
}
export interface AudioTranscriptDoneEvent extends ServerEvent {
    type: 'response.audio_transcript.done';
    response_id: string;
    item_id: string;
    transcript: string;
}
export interface ErrorEvent extends ServerEvent {
    type: 'error';
    error: RealtimeError;
}
export type AnyServerEvent = SessionCreatedEvent | SessionUpdatedEvent | SpeechStartedEvent | SpeechStoppedEvent | AudioCommittedEvent | TranscriptionCompletedEvent | ResponseStartedEvent | ResponseDoneEvent | TextDeltaEvent | TextDoneEvent | AudioDeltaEvent | AudioDoneEvent | AudioTranscriptDeltaEvent | AudioTranscriptDoneEvent | ErrorEvent;
export type AnyEvent = AnyClientEvent | AnyServerEvent;
export type EventHandler<T = AnyEvent> = (event: T) => void | Promise<void>;
export type EventHandlers = {
    'session.created'?: EventHandler<SessionCreatedEvent>;
    'session.updated'?: EventHandler<SessionUpdatedEvent>;
    'input_audio_buffer.speech_started'?: EventHandler<SpeechStartedEvent>;
    'input_audio_buffer.speech_stopped'?: EventHandler<SpeechStoppedEvent>;
    'input_audio_buffer.committed'?: EventHandler<AudioCommittedEvent>;
    'conversation.item.input_audio_transcription.completed'?: EventHandler<TranscriptionCompletedEvent>;
    'response.created'?: EventHandler<ResponseStartedEvent>;
    'response.done'?: EventHandler<ResponseDoneEvent>;
    'response.text.delta'?: EventHandler<TextDeltaEvent>;
    'response.text.done'?: EventHandler<TextDoneEvent>;
    'response.audio.delta'?: EventHandler<AudioDeltaEvent>;
    'response.audio.done'?: EventHandler<AudioDoneEvent>;
    'response.audio_transcript.delta'?: EventHandler<AudioTranscriptDeltaEvent>;
    'response.audio_transcript.done'?: EventHandler<AudioTranscriptDoneEvent>;
    'error'?: EventHandler<ErrorEvent>;
    '*'?: EventHandler<AnyEvent>;
};
export declare function isClientEvent(event: AnyEvent): event is AnyClientEvent;
export declare function isErrorEvent(event: AnyEvent): event is ErrorEvent;
export declare function isAudioEvent(event: AnyEvent): boolean;
export declare function isResponseEvent(event: AnyEvent): boolean;
export declare function isDeltaEvent(event: AnyEvent): boolean;
export declare function createSessionUpdate(update: Partial<SessionUpdateEvent['session']>): SessionUpdateEvent;
export declare function createAudioAppend(audioData: string): AudioAppendEvent;
export declare function createTextMessage(text: string): MessageCreateEvent;
export declare function createResponseRequest(): ResponseCreateEvent;
//# sourceMappingURL=events.d.ts.map