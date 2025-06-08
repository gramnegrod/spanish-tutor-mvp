// Simple WebRTC connection for OpenAI Realtime API
class SimpleRealtimeConnection {
    constructor() {
        this.pc = null;
        this.dc = null;
        this.audioElement = null;
        this.isConnected = false;
        this.onStatusUpdate = null;
        this.onTranscript = null;
        this.currentResponseId = null;
        this.currentTextContent = ''; // Track accumulated text for content parts
    }
    
    getVoiceForNPC(npc) {
        const voiceMap = {
            // Authority Figures - Deep, Commanding (using verse as deepest available)
            'G1': 'verse',   // Tower of London Yeoman Warder
            'G8': 'verse',   // Buckingham Palace Guard
            'G15': 'verse',  // Cutty Sark Ship Steward
            
            // Technical/Educational - Clear, Energetic (using coral as bright)
            'G2': 'coral',   // Tower Bridge Engineer
            'G14': 'coral',  // Greenwich Observatory Astronomer
            'G19': 'coral',  // Kew Gardens Biologist
            
            // Religious/Historical - Warm, Refined (using sage as refined)
            'G3': 'sage',  // St Paul's Cathedral Dome Warden
            'G4': 'sage',  // Shakespeare's Globe Docent
            'G6': 'sage',  // Westminster Abbey Canon
            'G9': 'sage',  // Churchill War Rooms Historian
            
            // Cultural/Artistic - Smooth, Inviting
            'G10': 'shimmer', // National Gallery Lecturer
            'G11': 'shimmer', // Covent Garden Coordinator
            'G17': 'shimmer', // Tate Modern Art Mediator
            'G20': 'shimmer', // Harry Potter Studios
            
            // Food/Market/Service - Friendly, Approachable
            'G5': 'echo',   // Borough Market Foodie
            'G13': 'echo',  // Camden Market Insider
            'G18': 'echo',  // Sky Garden Host
            
            // Academic/Museum - Clear, Professional
            'G7': 'alloy',  // Parliament Education Officer
            'G12': 'alloy', // British Museum Egyptologist
            'G16': 'alloy', // Regent's Park Ranger
            
            // Service Staff - British character (using sage for refined British feel)
            'S1': 'sage',  // Heathrow Taxi Driver
            'S2': 'sage',  // Hotel Receptionist
            'S3': 'sage',  // Bellhop
            'S4': 'sage',  // Pub Bartender
            'S5': 'sage',  // TfL Helper
            
            // Software Engineer - Masculine, authoritative
            'G21': 'echo'  // Jake Mitchell - Software Engineer
        };
        
        return voiceMap[npc.id] || 'alloy'; // Default to alloy if not mapped
    }

    async connect(instructions, onStatusUpdate, onTranscript) {
        this.onStatusUpdate = onStatusUpdate;
        this.onTranscript = onTranscript;
        
        try {
            this.updateStatus('Requesting microphone access...');
            
            // Get microphone access
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true 
            });
            
            this.updateStatus('Getting session token...');
            
            // Get ephemeral token from server
            // Get selected model from localStorage or use default
            const selectedModel = localStorage.getItem('selectedModel') || 'gpt-4o-mini-realtime-preview-2024-12-17';
            const tokenResponse = await fetch(`/api/session?model=${encodeURIComponent(selectedModel)}`);
            
            if (!tokenResponse.ok) {
                throw new Error('Failed to get session token');
            }
            
            const sessionData = await tokenResponse.json();
            console.log('Session response:', sessionData);
            const client_secret = sessionData.client_secret?.value;
            
            if (!client_secret) {
                throw new Error('No client_secret received from session API');
            }
            
            this.updateStatus('Connecting to OpenAI...');
            
            // Create peer connection
            this.pc = new RTCPeerConnection();
            
            // Add microphone track
            mediaStream.getTracks().forEach(track => {
                this.pc.addTrack(track, mediaStream);
            });
            
            // Handle incoming audio
            this.pc.ontrack = (event) => {
                if (!this.audioElement) {
                    this.audioElement = document.getElementById('audio-player');
                }
                this.audioElement.srcObject = event.streams[0];
            };
            
            // Create data channel for communication
            this.dc = this.pc.createDataChannel('oai-events');
            
            // Store instructions and NPC to send when data channel opens
            const instructionsToSend = instructions;
            const selectedNPC = window.selectedNPC;
            
            // Wait for data channel to open before sending configuration
            this.dc.addEventListener('open', () => {
                console.log('Data channel opened, sending session configuration...');
                const voiceToUse = this.getVoiceForNPC(selectedNPC);
                console.log('Selected voice for', selectedNPC.id, selectedNPC.role, ':', voiceToUse);
                
                // Customize settings based on NPC type
                let temperature = 0.9;  // Default for conversational tour guides
                let silenceDuration = 700;  // Natural pauses for tour guides
                
                // Jake Mitchell (G21) gets technical settings
                if (selectedNPC.id === 'G21') {
                    temperature = 0.6;  // More focused/accurate for code
                    silenceDuration = 500;  // Quicker responses for technical Q&A
                }
                
                // Build session config with conditional VAD
                const sessionConfig = {
                    instructions: instructionsToSend,
                    voice: voiceToUse,
                    speed: 1.1,  // 10% faster speech
                    temperature: temperature,
                    input_audio_format: 'pcm16',
                    output_audio_format: 'pcm16',
                    input_audio_transcription: {
                        model: 'whisper-1'
                    }
                };
                
                // Configure turn detection based on VAD setting
                if (vadEnabled) {
                    sessionConfig.turn_detection = {
                        type: 'server_vad',
                        threshold: 0.7,  // More conservative threshold
                        prefix_padding_ms: 500,  // More padding before detecting speech
                        silence_duration_ms: silenceDuration  // Variable based on NPC type
                    };
                } else {
                    // Explicitly disable VAD
                    sessionConfig.turn_detection = null;
                }
                
                this.sendMessage({
                    type: 'session.update',
                    session: sessionConfig
                });
                console.log('Session configuration sent:', {
                    npc: selectedNPC.id,
                    temperature: temperature,
                    silenceDuration: silenceDuration,
                    vadEnabled: vadEnabled,
                    turnDetection: sessionConfig.turn_detection
                });
            });
            
            this.dc.addEventListener('message', (event) => {
                this.handleDataChannelMessage(event.data);
            });
            
            // Handle connection state
            this.pc.onconnectionstatechange = () => {
                console.log('Connection state:', this.pc.connectionState);
                if (this.pc.connectionState === 'connected') {
                    this.isConnected = true;
                    this.updateStatus('Connected! Start speaking...');
                    // Session configuration is now sent when data channel opens
                } else if (this.pc.connectionState === 'failed') {
                    this.isConnected = false;
                    updateTextInputState(false); // Disable text input
                    
                    // Auto-restart if this was due to text processing
                    if (isProcessingTextResponse) {
                        console.log('Connection failed after text input - attempting auto-reconnect in 3 seconds...');
                        this.updateStatus('Text sent! Reconnecting voice in 3 seconds...');
                        isProcessingTextResponse = false;
                        
                        // Auto-reconnect after brief delay
                        setTimeout(() => {
                            console.log('Auto-reconnecting after text input...');
                            if (window.selectedNPC && typeof startConversation === 'function') {
                                startConversation();
                            }
                        }, 3000);
                    } else {
                        this.updateStatus('Connection failed - please restart conversation');
                    }
                } else if (this.pc.connectionState === 'disconnected') {
                    // Don't immediately mark as disconnected - might be temporary
                    console.warn('Connection disconnected - checking if failure follows...');
                    this.updateStatus('Connection interrupted...');
                    this.isConnected = false;
                    updateTextInputState(false); // Disable text input
                }
            };
            
            // Create offer and connect
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            
            const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${client_secret}`,
                    'Content-Type': 'application/sdp'
                }
            });
            
            if (!sdpResponse.ok) {
                throw new Error('Failed to connect to OpenAI');
            }
            
            const answerSDP = await sdpResponse.text();
            await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });
            
        } catch (error) {
            console.error('Connection error:', error);
            this.updateStatus(`Error: ${error.message}`);
        }
    }
    
    disconnect() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        if (this.dc) {
            this.dc.close();
            this.dc = null;
        }
        this.isConnected = false;
        this.updateStatus('Disconnected');
    }
    
    sendMessage(message) {
        if (this.dc && this.dc.readyState === 'open') {
            console.log('Sending message:', message.type, 'readyState:', this.dc.readyState);
            this.dc.send(JSON.stringify(message));
        } else {
            console.warn('Cannot send message, data channel not ready. State:', this.dc?.readyState);
        }
    }
    
    // Manual response trigger for push-to-talk mode
    triggerResponse() {
        if (this.dc && this.dc.readyState === 'open') {
            console.log('Manually triggering AI response');
            
            // First commit any pending input audio
            this.sendMessage({
                type: 'input_audio_buffer.commit'
            });
            
            // Then create a response
            this.sendMessage({
                type: 'response.create'
            });
        }
    }
    
    handleDataChannelMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('Received message:', message);
            
            // Log errors in detail
            if (message.type === 'error') {
                console.error('OpenAI Error:', message.error);
            }
            
            // Debug logging for text responses
            if (message.type && message.type.includes('text')) {
                console.log('Text-related message:', message.type, message);
            }
            
            // Debug logging for content parts
            if (message.type && message.type.includes('content')) {
                console.log('Content message:', message.type, message);
            }
            
            // Monitor rate limits
            if (message.type === 'rate_limits.updated') {
                console.log('Rate limits:', message.rate_limits);
                message.rate_limits.forEach(limit => {
                    if (limit.remaining < 10) {
                        console.warn(`Low ${limit.name}: ${limit.remaining}/${limit.limit} remaining`);
                    }
                });
            }
            
            // Track current response to avoid mixing multiple responses
            if (message.type === 'response.created') {
                this.currentResponseId = message.response?.id;
                this.currentTextContent = ''; // Reset accumulated text
                console.log('New response started:', this.currentResponseId);
                // Create a new assistant entry for this response
                if (this.onTranscript) {
                    this.onTranscript('assistant', '', false); // Start new message
                }
            }
            
            if (message.type === 'conversation.item.input_audio_transcription.completed') {
                console.log('User transcription received:', message.transcript);
                if (this.onTranscript) {
                    this.onTranscript('user', message.transcript || '[Speaking...]');
                }
            } else if (message.type === 'response.audio_transcript.delta') {
                // Only process deltas for the current response
                if (message.response_id === this.currentResponseId && this.onTranscript) {
                    this.onTranscript('assistant', message.delta, true); // true = delta update
                }
            } else if (message.type === 'response.text.delta') {
                // Handle text response deltas (for text input responses)
                if (message.response_id === this.currentResponseId && this.onTranscript) {
                    this.onTranscript('assistant', message.delta, true); // true = delta update
                }
            } else if (message.type === 'response.audio_transcript.done') {
                // Mark response as complete
                if (message.response_id === this.currentResponseId && this.onTranscript) {
                    this.onTranscript('assistant', '', false, true); // true = complete
                }
            } else if (message.type === 'response.text.done') {
                // Mark text response as complete
                if (message.response_id === this.currentResponseId && this.onTranscript) {
                    this.onTranscript('assistant', '', false, true); // true = complete
                }
            } else if (message.type === 'response.content_part.added') {
                // Handle content part for text responses
                if (message.part && message.part.type === 'text' && message.part.text) {
                    this.currentTextContent += message.part.text;
                    if (this.onTranscript) {
                        // Update the current message with accumulated text
                        this.onTranscript('assistant', this.currentTextContent, false, false, true); // true = replace content
                    }
                }
            } else if (message.type === 'response.content_part.done') {
                // Content part complete - text should be fully accumulated
                console.log('Content part done, accumulated text length:', this.currentTextContent.length);
            } else if (message.type === 'response.done') {
                console.log('Full response.done message:', message);
                const responseId = message.response?.id || message.response_id;
                console.log('Response complete:', responseId, 'Current ID:', this.currentResponseId);
                
                // Always reset the flag regardless of ID match
                isProcessingTextResponse = false;
                
                // Clear current response ID when done
                if (responseId === this.currentResponseId || !responseId) {
                    this.currentResponseId = null;
                    // Mark transcript as complete
                    if (this.onTranscript) {
                        this.onTranscript('assistant', '', false, true); // Mark complete
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing data channel message:', error);
        }
    }
    
    updateStatus(status) {
        if (this.onStatusUpdate) {
            this.onStatusUpdate(status);
        }
    }
}

// Global connection instance
let realtimeConnection = null;
let vadEnabled = true; // Default to VAD on
let pttActive = false; // Push-to-talk state
let pttKeyPressed = false; // Track if backtick is currently pressed
let isProcessingTextResponse = false; // Track if we're waiting for a text response

function startConversation() {
    if (!window.selectedNPC) {
        alert('Please select an NPC first');
        return;
    }
    
    if (realtimeConnection && realtimeConnection.isConnected) {
        return; // Already connected
    }
    
    // Clean up any existing connection first
    if (realtimeConnection) {
        realtimeConnection.disconnect();
        realtimeConnection = null;
    }
    
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const statusDiv = document.getElementById('status');
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusDiv.style.display = 'block';
    
    realtimeConnection = new SimpleRealtimeConnection();
    
    // Build comprehensive instructions with all NPC data
    const npc = window.selectedNPC;
    const instructions = `${npc.persona_prompt}

BACKSTORY: ${npc.backstory}

TOUR CONTENT: ${npc.tour_guide_story}

CURRENT EVENTS (June 2025): ${npc.current_events_2025}

PRACTICAL INFO: ${npc.prices_hours}

SAMPLE Q&A FOR REFERENCE: ${npc.sample_qa}

Remember: Stay completely in character as this specific guide. Use the tour content and current events naturally in conversation. Answer visitor questions using the provided information.`;
    
    realtimeConnection.connect(
        instructions,
        (status) => {
            statusDiv.textContent = status;
            statusDiv.className = 'status connecting';
            
            if (status.includes('Connected')) {
                statusDiv.className = 'status connected';
                updateTextInputState(true); // Enable text input when connected
            } else if (status.includes('Error')) {
                statusDiv.className = 'status error';
                startBtn.disabled = false;
                stopBtn.disabled = true;
                updateTextInputState(false); // Disable text input on error
            }
        },
        (role, text, isDelta, isComplete) => {
            addTranscriptEntry(role, text, isDelta, isComplete);
        }
    );
}

function stopConversation() {
    if (realtimeConnection) {
        realtimeConnection.disconnect();
        realtimeConnection = null;
    }
    
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const statusDiv = document.getElementById('status');
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.style.display = 'none';
    updateTextInputState(false); // Disable text input when disconnected
}

// Track current assistant message being built
let currentAssistantEntry = null;
let currentAssistantContent = null;

// Simple blackboard-style markdown formatting
function formatCodeBlocks(text) {
    try {
        // Configure marked for simple formatting
        marked.setOptions({
            breaks: true, // Convert line breaks to <br>
            gfm: true     // GitHub Flavored Markdown
        });
        
        // Parse markdown to HTML
        return marked.parse(text);
    } catch (error) {
        console.warn('Marked.js not available, using simple formatting');
        
        // Simple fallback formatting
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }
}

function addTranscriptEntry(role, text, isDelta = false, isComplete = false, replaceContent = false) {
    console.log('addTranscriptEntry called:', { role, text: text.substring(0, 50), isDelta, isComplete, replaceContent });
    const transcript = document.getElementById('transcript');
    
    if (role === 'user') {
        // User messages are always complete - show immediately on the right
        const entry = document.createElement('div');
        entry.className = 'transcript-entry transcript-user';
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container user-message';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;
        
        messageContainer.appendChild(content);
        entry.appendChild(messageContainer);
        transcript.appendChild(entry);
        
        // Clear any in-progress assistant message
        currentAssistantEntry = null;
        currentAssistantContent = null;
    } else if (role === 'assistant') {
        if (replaceContent && currentAssistantContent) {
            // Replace entire content (for content_part messages)
            currentAssistantContent.innerHTML = formatCodeBlocks(text);
        } else if (isDelta && !isComplete) {
            // Delta update - append to current message
            if (!currentAssistantEntry) {
                // Create new entry for assistant on the left
                currentAssistantEntry = document.createElement('div');
                currentAssistantEntry.className = 'transcript-entry transcript-ai';
                
                const messageContainer = document.createElement('div');
                messageContainer.className = 'message-container ai-message';
                
                const speaker = document.createElement('div');
                speaker.className = 'speaker';
                speaker.textContent = extractName(window.selectedNPC.persona_prompt);
                
                currentAssistantContent = document.createElement('div');
                currentAssistantContent.className = 'message-content';
                currentAssistantContent.textContent = '';
                
                messageContainer.appendChild(speaker);
                messageContainer.appendChild(currentAssistantContent);
                currentAssistantEntry.appendChild(messageContainer);
                transcript.appendChild(currentAssistantEntry);
            }
            
            // Append delta text
            currentAssistantContent.textContent += text;
        } else if (isComplete) {
            // Message complete, apply formatting and clear tracking variables
            if (currentAssistantContent) {
                currentAssistantContent.innerHTML = formatCodeBlocks(currentAssistantContent.textContent);
            }
            currentAssistantEntry = null;
            currentAssistantContent = null;
        } else if (text || text === '') {
            // Complete message (not delta) or starting a new message
            if (text === '' && !currentAssistantEntry) {
                // Just creating placeholder for upcoming content
                currentAssistantEntry = document.createElement('div');
                currentAssistantEntry.className = 'transcript-entry transcript-ai';
                
                const messageContainer = document.createElement('div');
                messageContainer.className = 'message-container ai-message';
                
                const speaker = document.createElement('div');
                speaker.className = 'speaker';
                speaker.textContent = extractName(window.selectedNPC.persona_prompt);
                
                currentAssistantContent = document.createElement('div');
                currentAssistantContent.className = 'message-content';
                currentAssistantContent.textContent = '...'; // Show loading indicator
                
                messageContainer.appendChild(speaker);
                messageContainer.appendChild(currentAssistantContent);
                currentAssistantEntry.appendChild(messageContainer);
                transcript.appendChild(currentAssistantEntry);
            } else if (text) {
                // Complete message with text
                const entry = document.createElement('div');
                entry.className = 'transcript-entry transcript-ai';
                
                const messageContainer = document.createElement('div');
                messageContainer.className = 'message-container ai-message';
                
                const speaker = document.createElement('div');
                speaker.className = 'speaker';
                speaker.textContent = extractName(window.selectedNPC.persona_prompt);
                
                const content = document.createElement('div');
                content.className = 'message-content';
                content.innerHTML = formatCodeBlocks(text);
                
                messageContainer.appendChild(speaker);
                messageContainer.appendChild(content);
                entry.appendChild(messageContainer);
                transcript.appendChild(entry);
            }
        }
    }
    
    // Scroll to bottom
    transcript.scrollTop = transcript.scrollHeight;
}

// VAD toggle function
function toggleVAD() {
    vadEnabled = !vadEnabled;
    
    const vadButton = document.getElementById('vad-toggle');
    const statusDiv = document.getElementById('status');
    
    if (vadEnabled) {
        vadButton.textContent = 'VAD: ON';
        vadButton.classList.remove('vad-off');
    } else {
        vadButton.textContent = 'VAD: OFF';
        vadButton.classList.add('vad-off');
        
        // Show PTT instructions when VAD is turned off
        if (realtimeConnection && realtimeConnection.isConnected) {
            statusDiv.style.display = 'block';
            statusDiv.className = 'status connected';
            statusDiv.textContent = 'Push-to-Talk Mode: Hold ` (backtick) key to talk';
        }
    }
    
    // If a conversation is active, restart with new VAD setting
    if (realtimeConnection && realtimeConnection.isConnected) {
        console.log('VAD toggled to:', vadEnabled ? 'ON' : 'OFF', '- restarting connection');
        stopConversation();
        setTimeout(() => startConversation(), 1000); // Give it a moment to disconnect
    } else {
        console.log('VAD toggled to:', vadEnabled ? 'ON' : 'OFF');
    }
}

// Push-to-talk keyboard handling
document.addEventListener('keydown', (event) => {
    // Only handle backtick key and only when VAD is off and conversation is active
    if (event.key === '`' && !vadEnabled && realtimeConnection && realtimeConnection.isConnected) {
        if (!pttKeyPressed) {  // Prevent repeat keydown events
            pttKeyPressed = true;
            pttActive = true;
            console.log('Push-to-talk activated');
            
            // Visual feedback
            const vadButton = document.getElementById('vad-toggle');
            vadButton.style.transform = 'scale(0.95)';
            vadButton.textContent = 'TALKING...';
        }
        event.preventDefault(); // Prevent default backtick behavior
    }
});

document.addEventListener('keyup', (event) => {
    // Handle backtick release
    if (event.key === '`' && !vadEnabled && realtimeConnection && realtimeConnection.isConnected) {
        if (pttKeyPressed) {  // Only if we were actively pressing
            pttKeyPressed = false;
            pttActive = false;
            console.log('Push-to-talk released - triggering response');
            
            // Visual feedback
            const vadButton = document.getElementById('vad-toggle');
            vadButton.style.transform = 'scale(1)';
            vadButton.textContent = 'VAD: OFF';
            
            // Trigger AI response
            realtimeConnection.triggerResponse();
        }
        event.preventDefault();
    }
});

// Text Input Functions
function sendTextMessage() {
    const textInput = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-text-btn');
    const statusDiv = document.getElementById('text-input-status');
    
    const text = textInput.value.trim();
    
    if (!text) {
        statusDiv.textContent = 'Please enter some text';
        statusDiv.className = 'text-input-status';
        return;
    }
    
    if (!realtimeConnection || !realtimeConnection.isConnected) {
        statusDiv.textContent = 'Not connected - start conversation first';
        statusDiv.className = 'text-input-status';
        return;
    }
    
    const dc = realtimeConnection.dc;
    if (!dc || dc.readyState !== 'open') {
        statusDiv.textContent = 'Connection not ready';
        statusDiv.className = 'text-input-status';
        return;
    }
    
    // Update UI
    sendBtn.disabled = true;
    statusDiv.textContent = 'Sending text message...';
    statusDiv.className = 'text-input-status sending';
    
    // Prevent sending if already processing
    if (isProcessingTextResponse) {
        statusDiv.textContent = 'Please wait for current response...';
        statusDiv.className = 'text-input-status';
        sendBtn.disabled = false;
        return;
    }
    
    try {
        isProcessingTextResponse = true;
        
        // Send text message to conversation
        realtimeConnection.sendMessage({
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: text
                    }
                ]
            }
        });
        
        // Add to transcript immediately
        addTranscriptEntry('user', text);
        
        // Small delay before triggering response to ensure message is processed
        setTimeout(() => {
            // Trigger AI response
            realtimeConnection.sendMessage({
                type: 'response.create'
            });
        }, 100);
        
        // Clear input and update status
        textInput.value = '';
        statusDiv.textContent = 'Text sent! Guide is responding...';
        statusDiv.className = 'text-input-status ready';
        
        console.log('Text message sent:', text);
        
    } catch (error) {
        console.error('Error sending text message:', error);
        statusDiv.textContent = 'Error sending message';
        statusDiv.className = 'text-input-status';
        isProcessingTextResponse = false;
    }
    
    // Re-enable button after short delay and check connection
    setTimeout(() => {
        sendBtn.disabled = false;
        if (realtimeConnection && realtimeConnection.isConnected) {
            statusDiv.textContent = 'Ready for text input';
            statusDiv.className = 'text-input-status ready';
        } else {
            statusDiv.textContent = 'Connection lost - text sent but voice disabled';
            statusDiv.className = 'text-input-status';
        }
    }, 2000);
}

function updateTextInputState(connected) {
    const textInput = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-text-btn');
    const statusDiv = document.getElementById('text-input-status');
    
    if (connected) {
        textInput.disabled = false;
        sendBtn.disabled = false;
        statusDiv.textContent = 'Ready for text input';
        statusDiv.className = 'text-input-status ready';
    } else {
        textInput.disabled = true;
        sendBtn.disabled = true;
        textInput.value = '';
        
        // Show different message based on connection state
        if (realtimeConnection && !realtimeConnection.isConnected) {
            statusDiv.textContent = 'Connection lost - restart conversation to continue';
            statusDiv.className = 'text-input-status';
        } else {
            statusDiv.textContent = 'Start a conversation to enable text input';
            statusDiv.className = 'text-input-status';
        }
        
        // Reset processing flag
        isProcessingTextResponse = false;
    }
}

// Keyboard shortcuts for text input
document.addEventListener('keydown', (event) => {
    // Ctrl+Enter to send text (don't interfere with backtick PTT)
    if (event.ctrlKey && event.key === 'Enter') {
        const textInput = document.getElementById('text-input');
        if (document.activeElement === textInput && !textInput.disabled) {
            event.preventDefault();
            sendTextMessage();
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (realtimeConnection) {
        realtimeConnection.disconnect();
    }
});