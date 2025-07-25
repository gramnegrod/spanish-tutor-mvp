/**
 * OpenAI Realtime API Event Types
 * 
 * Simplified event definitions for clear and predictable event handling.
 */

import type {
  RealtimeError,
  RealtimeVoice
} from './index';

// ===== CLIENT EVENTS (sent to server) =====

/** Base structure for all client events */
export interface ClientEvent {
  /** Event type */
  type: string;
  /** Optional event ID */
  event_id?: string;
}

/** Update session configuration */
export interface SessionUpdateEvent extends ClientEvent {
  type: 'session.update';
  session: {
    voice?: RealtimeVoice;
    instructions?: string;
    temperature?: number;
  };
}

/** Append audio data to buffer */
export interface AudioAppendEvent extends ClientEvent {
  type: 'input_audio_buffer.append';
  /** Base64 encoded audio data */
  audio: string;
}

/** Commit audio buffer as a message */
export interface AudioCommitEvent extends ClientEvent {
  type: 'input_audio_buffer.commit';
}

/** Clear audio buffer */
export interface AudioClearEvent extends ClientEvent {
  type: 'input_audio_buffer.clear';
}

/** Create a text message */
export interface MessageCreateEvent extends ClientEvent {
  type: 'conversation.item.create';
  item: {
    type: 'message';
    role: 'user';
    content: [{
      type: 'input_text';
      text: string;
    }];
  };
}

/** Request AI response */
export interface ResponseCreateEvent extends ClientEvent {
  type: 'response.create';
}

/** All possible client events */
export type AnyClientEvent = 
  | SessionUpdateEvent
  | AudioAppendEvent
  | AudioCommitEvent
  | AudioClearEvent
  | MessageCreateEvent
  | ResponseCreateEvent;

// ===== SERVER EVENTS (received from server) =====

/** Base structure for all server events */
export interface ServerEvent {
  /** Event type */
  type: string;
  /** Event ID */
  event_id?: string;
}

/** Session was created */
export interface SessionCreatedEvent extends ServerEvent {
  type: 'session.created';
  session: {
    id: string;
    voice: RealtimeVoice;
    instructions?: string;
  };
}

/** Session was updated */
export interface SessionUpdatedEvent extends ServerEvent {
  type: 'session.updated';
  session: {
    id: string;
    voice: RealtimeVoice;
    instructions?: string;
  };
}

/** User started speaking */
export interface SpeechStartedEvent extends ServerEvent {
  type: 'input_audio_buffer.speech_started';
  audio_start_ms: number;
}

/** User stopped speaking */
export interface SpeechStoppedEvent extends ServerEvent {
  type: 'input_audio_buffer.speech_stopped';
  audio_end_ms: number;
}

/** Audio was committed as a message */
export interface AudioCommittedEvent extends ServerEvent {
  type: 'input_audio_buffer.committed';
  item_id: string;
}

/** Transcription completed */
export interface TranscriptionCompletedEvent extends ServerEvent {
  type: 'conversation.item.input_audio_transcription.completed';
  item_id: string;
  transcript: string;
}

/** Response started */
export interface ResponseStartedEvent extends ServerEvent {
  type: 'response.created';
  response: {
    id: string;
    status: 'in_progress';
  };
}

/** Response completed */
export interface ResponseDoneEvent extends ServerEvent {
  type: 'response.done';
  response: {
    id: string;
    status: 'completed';
  };
}

/** Text delta received */
export interface TextDeltaEvent extends ServerEvent {
  type: 'response.text.delta';
  response_id: string;
  item_id: string;
  delta: string;
}

/** Text completed */
export interface TextDoneEvent extends ServerEvent {
  type: 'response.text.done';
  response_id: string;
  item_id: string;
  text: string;
}

/** Audio delta received */
export interface AudioDeltaEvent extends ServerEvent {
  type: 'response.audio.delta';
  response_id: string;
  item_id: string;
  /** Base64 encoded audio chunk */
  delta: string;
}

/** Audio completed */
export interface AudioDoneEvent extends ServerEvent {
  type: 'response.audio.done';
  response_id: string;
  item_id: string;
}

/** Audio transcript delta */
export interface AudioTranscriptDeltaEvent extends ServerEvent {
  type: 'response.audio_transcript.delta';
  response_id: string;
  item_id: string;
  delta: string;
}

/** Audio transcript completed */
export interface AudioTranscriptDoneEvent extends ServerEvent {
  type: 'response.audio_transcript.done';
  response_id: string;
  item_id: string;
  transcript: string;
}

/** Error occurred */
export interface ErrorEvent extends ServerEvent {
  type: 'error';
  error: RealtimeError;
}

/** All possible server events */
export type AnyServerEvent = 
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SpeechStartedEvent
  | SpeechStoppedEvent
  | AudioCommittedEvent
  | TranscriptionCompletedEvent
  | ResponseStartedEvent
  | ResponseDoneEvent
  | TextDeltaEvent
  | TextDoneEvent
  | AudioDeltaEvent
  | AudioDoneEvent
  | AudioTranscriptDeltaEvent
  | AudioTranscriptDoneEvent
  | ErrorEvent;

/** All possible events */
export type AnyEvent = AnyClientEvent | AnyServerEvent;

// ===== EVENT HANDLERS =====

/** Generic event handler */
export type EventHandler<T = AnyEvent> = (event: T) => void | Promise<void>;

/** Map of event types to handlers */
export type EventHandlers = {
  // Session events
  'session.created'?: EventHandler<SessionCreatedEvent>;
  'session.updated'?: EventHandler<SessionUpdatedEvent>;
  
  // Speech events
  'input_audio_buffer.speech_started'?: EventHandler<SpeechStartedEvent>;
  'input_audio_buffer.speech_stopped'?: EventHandler<SpeechStoppedEvent>;
  'input_audio_buffer.committed'?: EventHandler<AudioCommittedEvent>;
  
  // Transcription events
  'conversation.item.input_audio_transcription.completed'?: EventHandler<TranscriptionCompletedEvent>;
  
  // Response events
  'response.created'?: EventHandler<ResponseStartedEvent>;
  'response.done'?: EventHandler<ResponseDoneEvent>;
  'response.text.delta'?: EventHandler<TextDeltaEvent>;
  'response.text.done'?: EventHandler<TextDoneEvent>;
  'response.audio.delta'?: EventHandler<AudioDeltaEvent>;
  'response.audio.done'?: EventHandler<AudioDoneEvent>;
  'response.audio_transcript.delta'?: EventHandler<AudioTranscriptDeltaEvent>;
  'response.audio_transcript.done'?: EventHandler<AudioTranscriptDoneEvent>;
  
  // Error events
  'error'?: EventHandler<ErrorEvent>;
  
  // Catch-all
  '*'?: EventHandler<AnyEvent>;
};

// ===== EVENT UTILITIES =====

/** Check if event is a client event */
export function isClientEvent(event: AnyEvent): event is AnyClientEvent {
  const clientTypes = [
    'session.update',
    'input_audio_buffer.append',
    'input_audio_buffer.commit',
    'input_audio_buffer.clear',
    'conversation.item.create',
    'response.create'
  ];
  return clientTypes.includes(event.type);
}

/** Check if event is an error */
export function isErrorEvent(event: AnyEvent): event is ErrorEvent {
  return event.type === 'error';
}

/** Check if event is audio-related */
export function isAudioEvent(event: AnyEvent): boolean {
  return event.type.includes('audio') || event.type.includes('speech');
}

/** Check if event is a response event */
export function isResponseEvent(event: AnyEvent): boolean {
  return event.type.startsWith('response.');
}

/** Check if event is a delta (streaming) event */
export function isDeltaEvent(event: AnyEvent): boolean {
  return event.type.includes('.delta');
}

// ===== EVENT BUILDERS =====

/** Create a session update event */
export function createSessionUpdate(update: Partial<SessionUpdateEvent['session']>): SessionUpdateEvent {
  return {
    type: 'session.update',
    session: update
  };
}

/** Create an audio append event */
export function createAudioAppend(audioData: string): AudioAppendEvent {
  return {
    type: 'input_audio_buffer.append',
    audio: audioData
  };
}

/** Create a text message event */
export function createTextMessage(text: string): MessageCreateEvent {
  return {
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{
        type: 'input_text',
        text
      }]
    }
  };
}

/** Create a response request event */
export function createResponseRequest(): ResponseCreateEvent {
  return {
    type: 'response.create'
  };
}