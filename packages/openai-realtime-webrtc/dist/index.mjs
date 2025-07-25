/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var eventemitter3 = {exports: {}};

(function (module) {

	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';

	/**
	 * Constructor to create a storage for our `EE` objects.
	 * An `Events` instance is a plain object whose properties are event names.
	 *
	 * @constructor
	 * @private
	 */
	function Events() {}

	//
	// We try to not inherit from `Object.prototype`. In some engines creating an
	// instance in this way is faster than calling `Object.create(null)` directly.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// character to make sure that the built-in object properties are not
	// overridden or used as an attack vector.
	//
	if (Object.create) {
	  Events.prototype = Object.create(null);

	  //
	  // This hack is needed because the `__proto__` property is still inherited in
	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
	  //
	  if (!new Events().__proto__) prefix = false;
	}

	/**
	 * Representation of a single event listener.
	 *
	 * @param {Function} fn The listener function.
	 * @param {*} context The context to invoke the listener with.
	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	 * @constructor
	 * @private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Add a listener for a given event.
	 *
	 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} context The context to invoke the listener with.
	 * @param {Boolean} once Specify if the listener is a one-time listener.
	 * @returns {EventEmitter}
	 * @private
	 */
	function addListener(emitter, event, fn, context, once) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('The listener must be a function');
	  }

	  var listener = new EE(fn, context || emitter, once)
	    , evt = prefix ? prefix + event : event;

	  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
	  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
	  else emitter._events[evt] = [emitter._events[evt], listener];

	  return emitter;
	}

	/**
	 * Clear event by name.
	 *
	 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	 * @param {(String|Symbol)} evt The Event name.
	 * @private
	 */
	function clearEvent(emitter, evt) {
	  if (--emitter._eventsCount === 0) emitter._events = new Events();
	  else delete emitter._events[evt];
	}

	/**
	 * Minimal `EventEmitter` interface that is molded against the Node.js
	 * `EventEmitter` interface.
	 *
	 * @constructor
	 * @public
	 */
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}

	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;

	  if (this._eventsCount === 0) return names;

	  for (name in (events = this._events)) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }

	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }

	  return names;
	};

	/**
	 * Return the listeners registered for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Array} The registered listeners.
	 * @public
	 */
	EventEmitter.prototype.listeners = function listeners(event) {
	  var evt = prefix ? prefix + event : event
	    , handlers = this._events[evt];

	  if (!handlers) return [];
	  if (handlers.fn) return [handlers.fn];

	  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
	    ee[i] = handlers[i].fn;
	  }

	  return ee;
	};

	/**
	 * Return the number of listeners listening to a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Number} The number of listeners.
	 * @public
	 */
	EventEmitter.prototype.listenerCount = function listenerCount(event) {
	  var evt = prefix ? prefix + event : event
	    , listeners = this._events[evt];

	  if (!listeners) return 0;
	  if (listeners.fn) return 1;
	  return listeners.length;
	};

	/**
	 * Calls each of the listeners registered for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Boolean} `true` if the event had listeners, else `false`.
	 * @public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return false;

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if (listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Add a listener for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  return addListener(this, event, fn, context, false);
	};

	/**
	 * Add a one-time listener for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  return addListener(this, event, fn, context, true);
	};

	/**
	 * Remove the listeners of a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn Only remove the listeners that match this function.
	 * @param {*} context Only remove the listeners that have this context.
	 * @param {Boolean} once Only remove one-time listeners.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return this;
	  if (!fn) {
	    clearEvent(this, evt);
	    return this;
	  }

	  var listeners = this._events[evt];

	  if (listeners.fn) {
	    if (
	      listeners.fn === fn &&
	      (!once || listeners.once) &&
	      (!context || listeners.context === context)
	    ) {
	      clearEvent(this, evt);
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	        listeners[i].fn !== fn ||
	        (once && !listeners[i].once) ||
	        (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }

	    //
	    // Reset the array, or remove it completely if we have no more listeners.
	    //
	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
	    else clearEvent(this, evt);
	  }

	  return this;
	};

	/**
	 * Remove all listeners, or those of the specified event.
	 *
	 * @param {(String|Symbol)} [event] The event name.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;

	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) clearEvent(this, evt);
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;

	//
	// Allow `EventEmitter` to be imported as module namespace.
	//
	EventEmitter.EventEmitter = EventEmitter;

	//
	// Expose the module.
	//
	{
	  module.exports = EventEmitter;
	} 
} (eventemitter3));

var eventemitter3Exports = eventemitter3.exports;
var EventEmitter = /*@__PURE__*/getDefaultExportFromCjs(eventemitter3Exports);

class WebRTCManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.peerConnection = null;
        this.dataChannel = null;
        this.localStream = null;
        this.ephemeralToken = null;
        this.config = Object.assign({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], model: 'gpt-4o-realtime-preview-2024-12-17', debug: false }, config);
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.peerConnection) {
                throw new Error('WebRTC already initialized');
            }
            try {
                console.log('[WebRTC] Starting initialization...');
                if (this.config.tokenEndpoint) {
                    console.log('[WebRTC] Getting ephemeral token from:', this.config.tokenEndpoint);
                    this.ephemeralToken = yield this.getEphemeralToken();
                    console.log('[WebRTC] Got ephemeral token');
                }
                else {
                    console.log('[WebRTC] No token endpoint provided');
                }
                console.log('[WebRTC] Creating peer connection...');
                this.peerConnection = new RTCPeerConnection({
                    iceServers: this.config.iceServers
                });
                this.setupPeerConnectionHandlers();
                console.log('[WebRTC] Setting up microphone...');
                this.localStream = yield this.setupLocalMedia();
                if (this.localStream) {
                    const audioTrack = this.localStream.getAudioTracks()[0];
                    if (audioTrack) {
                        this.peerConnection.addTrack(audioTrack, this.localStream);
                        console.log('[WebRTC] Added audio track');
                    }
                }
                console.log('[WebRTC] Creating data channel...');
                this.dataChannel = this.peerConnection.createDataChannel('oai-events', {
                    ordered: true
                });
                this.setupDataChannelHandlers();
                if (this.ephemeralToken) {
                    console.log('[WebRTC] Starting negotiation...');
                    yield this.completeNegotiation();
                }
                else {
                    console.log('[WebRTC] No token available, skipping negotiation');
                }
            }
            catch (error) {
                this.cleanup();
                throw new Error(`Failed to initialize WebRTC: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    sendData(data) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            throw new Error('Data channel not available');
        }
        if (typeof data === 'string') {
            this.dataChannel.send(data);
        }
        else {
            this.dataChannel.send(new Uint8Array(data));
        }
    }
    isConnected() {
        var _a;
        return ((_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.connectionState) === 'connected';
    }
    isDataChannelOpen() {
        var _a;
        return ((_a = this.dataChannel) === null || _a === void 0 ? void 0 : _a.readyState) === 'open';
    }
    getConnectionState() {
        var _a, _b, _c;
        return {
            connectionState: ((_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.connectionState) || 'new',
            iceConnectionState: ((_b = this.peerConnection) === null || _b === void 0 ? void 0 : _b.iceConnectionState) || 'new',
            dataChannelState: ((_c = this.dataChannel) === null || _c === void 0 ? void 0 : _c.readyState) || null,
            isAudioStreaming: !!this.localStream
        };
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cleanup();
            this.emit('disconnected');
        });
    }
    dispose() {
        this.cleanup();
        this.removeAllListeners();
    }
    getEphemeralToken() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.config.tokenEndpoint) {
                throw new Error('Token endpoint not configured');
            }
            const response = yield fetch(this.config.tokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                throw new Error(`Failed to get token: ${response.status}`);
            }
            const data = yield response.json();
            return ((_a = data.client_secret) === null || _a === void 0 ? void 0 : _a.value) || data.token;
        });
    }
    setupLocalMedia() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const constraints = {
                    audio: this.config.audioConstraints || {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 24000
                    },
                    video: false
                };
                return yield navigator.mediaDevices.getUserMedia(constraints);
            }
            catch (error) {
                throw new Error(`Failed to get user media: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    completeNegotiation() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.peerConnection || !this.ephemeralToken) {
                console.log('[WebRTC] Missing peer connection or token');
                return;
            }
            console.log('[WebRTC] Creating offer...');
            const offer = yield this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false
            });
            yield this.peerConnection.setLocalDescription(offer);
            const baseUrl = 'https://api.openai.com';
            const model = this.config.model || 'gpt-4o-realtime-preview-2024-12-17';
            const url = `${baseUrl}/v1/realtime?model=${model}`;
            console.log('[WebRTC] Sending offer to:', url);
            const response = yield fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sdp',
                    'Authorization': `Bearer ${this.ephemeralToken}`,
                    'OpenAI-Beta': 'realtime=v1'
                },
                body: offer.sdp
            });
            if (!response.ok) {
                const text = yield response.text();
                console.error('[WebRTC] Failed response:', response.status, text);
                throw new Error(`Failed to get answer: ${response.status} - ${text}`);
            }
            console.log('[WebRTC] Got answer from OpenAI');
            const answerSdp = yield response.text();
            const answer = {
                type: 'answer',
                sdp: answerSdp
            };
            yield this.peerConnection.setRemoteDescription(answer);
            console.log('[WebRTC] Remote description set successfully');
        });
    }
    setupPeerConnectionHandlers() {
        if (!this.peerConnection)
            return;
        this.peerConnection.onconnectionstatechange = () => {
            var _a;
            const state = (_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.connectionState;
            if (state === 'connected') {
                this.emit('connected');
            }
            else if (state === 'failed') {
                this.emit('connectionFailed', new Error('WebRTC connection failed'));
            }
            else if (state === 'disconnected' || state === 'closed') {
                this.emit('disconnected', 'Connection closed');
            }
            this.emit('connectionStateChanged', this.getConnectionState());
        };
        this.peerConnection.ontrack = (event) => {
            if (event.track) {
                this.emit('audioTrackReceived', event.track);
            }
        };
        this.peerConnection.ondatachannel = (event) => {
            this.setupDataChannelHandlers(event.channel);
        };
    }
    setupDataChannelHandlers(channel) {
        const dc = channel || this.dataChannel;
        if (!dc)
            return;
        dc.onopen = () => {
            console.log('[WebRTC] Data channel opened');
            this.emit('dataChannelReady');
            this.emit('connectionStateChanged', this.getConnectionState());
        };
        dc.onclose = () => {
            console.log('[WebRTC] Data channel closed');
            this.emit('connectionStateChanged', this.getConnectionState());
        };
        dc.onerror = (error) => {
            console.error('[WebRTC] Data channel error:', error);
            this.emit('connectionFailed', new Error(`Data channel error: ${error}`));
        };
        dc.onmessage = (event) => {
            this.emit('dataChannelMessage', event.data);
        };
    }
    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.ephemeralToken = null;
    }
    log(message, ...args) {
        if (this.config.debug) {
            console.log(`[WebRTCManager] ${message}`, ...args);
        }
    }
}

class OpenAIRealtimeService extends EventEmitter {
    constructor(config, events = {}) {
        super();
        this.audioElement = null;
        this.isDisposed = false;
        this.config = Object.assign({ tokenEndpoint: '/api/session', model: 'gpt-4o-realtime-preview-2024-12-17', voice: 'alloy', modalities: ['text', 'audio'], temperature: 0.8, maxOutputTokens: 4096, inputAudioFormat: 'pcm16', outputAudioFormat: 'pcm16', turnDetection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
            } }, config);
        this.events = events;
        this.state = {
            status: 'disconnected',
            messages: []
        };
        this.webrtcManager = new WebRTCManager(this.config);
        this.setupWebRTCHandlers();
    }
    connect(audioElement) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.isDisposed) {
                throw new Error('Service has been disposed');
            }
            if (this.state.status === 'connected' || this.state.status === 'connecting') {
                return;
            }
            try {
                this.updateStatus('connecting');
                this.audioElement = audioElement || null;
                this.log('Initializing WebRTC...');
                yield this.webrtcManager.initialize();
                this.updateStatus('connected');
                this.emit('connected');
                (_b = (_a = this.events).onConnect) === null || _b === void 0 ? void 0 : _b.call(_a);
                this.log('Connected successfully');
                setTimeout(() => {
                    if (this.webrtcManager.isDataChannelOpen()) {
                        this.sendSessionConfig().catch(err => {
                            this.log('Session config failed (non-critical):', err);
                        });
                    }
                }, 1000);
            }
            catch (error) {
                this.updateStatus('error');
                this.state.error = error instanceof Error ? error : new Error('Unknown error');
                this.emit('error', this.state.error);
                throw error;
            }
        });
    }
    updateInstructions(instructions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.config.instructions = instructions;
            if (this.state.status === 'connected') {
                yield this.sendSessionConfig();
            }
        });
    }
    sendText(text) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.status !== 'connected') {
                throw new Error('Not connected');
            }
            const message = {
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
            this.webrtcManager.sendData(JSON.stringify(message));
            this.webrtcManager.sendData(JSON.stringify({ type: 'response.create' }));
            this.state.messages.push({
                id: `msg-${Date.now()}`,
                role: 'user',
                text,
                timestamp: Date.now()
            });
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.state.status === 'disconnected') {
                return;
            }
            yield this.webrtcManager.close();
            if (this.audioElement) {
                this.audioElement.srcObject = null;
            }
            this.updateStatus('disconnected');
            this.emit('disconnected');
            (_b = (_a = this.events).onDisconnect) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
    }
    dispose() {
        if (this.isDisposed)
            return;
        this.isDisposed = true;
        this.webrtcManager.dispose();
        this.removeAllListeners();
        this.updateStatus('disconnected');
    }
    updateConfig(config) {
        Object.assign(this.config, config);
        if (this.state.status === 'connected') {
            this.sendSessionConfig().catch(error => {
                this.emit('error', error);
            });
        }
    }
    setupWebRTCHandlers() {
        this.webrtcManager.on('connected', () => {
            this.log('WebRTC connected');
        });
        this.webrtcManager.on('disconnected', (reason) => {
            var _a, _b;
            this.log('WebRTC disconnected:', reason);
            this.updateStatus('disconnected');
            this.emit('disconnected');
            (_b = (_a = this.events).onDisconnect) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
        this.webrtcManager.on('connectionFailed', (error) => {
            var _a, _b;
            this.log('WebRTC connection failed:', error);
            this.updateStatus('error');
            this.state.error = error;
            this.emit('error', error);
            (_b = (_a = this.events).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
        });
        this.webrtcManager.on('dataChannelMessage', (data) => {
            this.handleDataChannelMessage(data);
        });
        this.webrtcManager.on('audioTrackReceived', (track) => {
            this.log('Audio track received');
            if (this.audioElement && track.kind === 'audio') {
                const stream = new MediaStream([track]);
                this.audioElement.srcObject = stream;
                this.log('Audio stream connected to element');
            }
        });
    }
    handleDataChannelMessage(data) {
        var _a, _b, _c, _d, _e, _f, _g;
        if (typeof data !== 'string')
            return;
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'conversation.item.created':
                    if (((_a = message.item) === null || _a === void 0 ? void 0 : _a.role) === 'assistant' && ((_b = message.item) === null || _b === void 0 ? void 0 : _b.content)) {
                        const textContent = message.item.content.find((c) => c.type === 'text');
                        if (textContent === null || textContent === void 0 ? void 0 : textContent.text) {
                            this.emit('textReceived', textContent.text);
                            (_d = (_c = this.events).onTranscript) === null || _d === void 0 ? void 0 : _d.call(_c, 'assistant', textContent.text);
                            this.state.messages.push({
                                id: message.item.id || `msg-${Date.now()}`,
                                role: 'assistant',
                                text: textContent.text,
                                timestamp: Date.now()
                            });
                        }
                    }
                    break;
                case 'conversation.item.input_audio_transcription.completed':
                    if (message.transcript) {
                        this.emit('transcriptionReceived', message.transcript);
                        (_f = (_e = this.events).onTranscript) === null || _f === void 0 ? void 0 : _f.call(_e, 'user', message.transcript);
                    }
                    break;
                case 'response.audio.delta':
                    if (message.delta) {
                        const audioData = Uint8Array.from(atob(message.delta), c => c.charCodeAt(0));
                        this.emit('audioReceived', audioData.buffer);
                    }
                    break;
                case 'error':
                    this.emit('error', new Error(((_g = message.error) === null || _g === void 0 ? void 0 : _g.message) || 'Unknown error'));
                    break;
            }
        }
        catch (error) {
            this.log('Failed to handle message:', error);
        }
    }
    waitForDataChannel() {
        return __awaiter(this, arguments, void 0, function* (timeout = 10000) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    this.webrtcManager.off('dataChannelReady', onReady);
                    reject(new Error('Data channel failed to open'));
                }, timeout);
                const onReady = () => {
                    clearTimeout(timer);
                    resolve();
                };
                if (this.webrtcManager.isDataChannelOpen()) {
                    clearTimeout(timer);
                    resolve();
                    return;
                }
                this.webrtcManager.once('dataChannelReady', onReady);
            });
        });
    }
    sendSessionConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionUpdate = {
                type: 'session.update',
                session: {
                    model: this.config.model,
                    modalities: this.config.modalities,
                    instructions: this.config.instructions,
                    voice: this.config.voice,
                    input_audio_format: this.config.inputAudioFormat,
                    output_audio_format: this.config.outputAudioFormat,
                    input_audio_transcription: this.config.inputAudioFormat ? {
                        model: 'whisper-1'
                    } : null,
                    turn_detection: this.config.turnDetection,
                    temperature: this.config.temperature,
                    max_output_tokens: this.config.maxOutputTokens === 'inf' ? null : this.config.maxOutputTokens
                }
            };
            this.webrtcManager.sendData(JSON.stringify(sessionUpdate));
        });
    }
    updateStatus(status) {
        var _a, _b;
        if (this.state.status !== status) {
            this.state.status = status;
            this.emit('statusChanged', status);
            (_b = (_a = this.events).onStatusUpdate) === null || _b === void 0 ? void 0 : _b.call(_a, status);
        }
    }
    log(message, ...args) {
        if (this.config.debug) {
            console.log(`[OpenAIRealtime] ${message}`, ...args);
        }
    }
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o-realtime-preview-2024-12-17';
const OPENAI_DATA_CHANNEL_NAME = 'oai-events';
const DEFAULT_SAMPLE_RATE = 24000;
const DEFAULT_CHANNEL_COUNT = 1;
const ERROR_MESSAGES = {
    DISPOSED: 'Manager has been disposed',
    ALREADY_INITIALIZED: 'Connection already initialized',
    NOT_INITIALIZED: 'Connection not initialized',
    NOT_CONNECTED: 'Service not connected',
    DATA_CHANNEL_UNAVAILABLE: 'Data channel not available',
    TOKEN_ENDPOINT_MISSING: 'Token endpoint not configured',
    PERMISSION_DENIED: 'Microphone permission denied',
    DEVICE_NOT_FOUND: 'No audio input device found'
};

class RealtimeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RealtimeError';
    }
}
class WebRTCError extends RealtimeError {
    constructor(message) {
        super(message);
        this.name = 'WebRTCError';
    }
}
class AudioError extends RealtimeError {
    constructor(message) {
        super(message);
        this.name = 'AudioError';
    }
}

export { AudioError, DEFAULT_CHANNEL_COUNT, DEFAULT_OPENAI_MODEL, DEFAULT_SAMPLE_RATE, ERROR_MESSAGES, OPENAI_DATA_CHANNEL_NAME, OpenAIRealtimeService, RealtimeError, WebRTCError, WebRTCManager, OpenAIRealtimeService as default };
//# sourceMappingURL=index.mjs.map
