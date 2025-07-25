/**
 * Browser compatibility type declarations
 * Extends Window interface with vendor-prefixed APIs
 */

interface Window {
  // Webkit-prefixed AudioContext for Safari compatibility
  webkitAudioContext?: typeof AudioContext;
  
  // MS-prefixed stream for older Edge/IE detection
  MSStream?: unknown;
}

// Extend HTMLMediaElement for iOS-specific properties
interface HTMLMediaElement {
  // iOS-specific playsinline attribute
  playsInline?: boolean;
}

// Safari-specific RTCPeerConnection extensions
interface RTCPeerConnection {
  // Some older Safari versions may not have getTransceivers
  getTransceivers?(): RTCRtpTransceiver[];
}

// Extend MediaTrackConstraints for browser-specific audio constraints
interface MediaTrackConstraints {
  // Safari may use different constraint formats
  sampleRate?: number | { ideal?: number; exact?: number };
  channelCount?: number | { ideal?: number; exact?: number };
}