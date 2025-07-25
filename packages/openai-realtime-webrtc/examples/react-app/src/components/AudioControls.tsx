import React from 'react'
import './AudioControls.css'

interface AudioControlsProps {
  audioLevel: number
  isSpeaking: boolean
  isConnected: boolean
}

export function AudioControls({ audioLevel, isSpeaking, isConnected }: AudioControlsProps) {
  // Generate frequency bars based on audio level
  const generateBars = () => {
    const barCount = 20
    const bars = []
    
    for (let i = 0; i < barCount; i++) {
      // Create a wave effect across the bars
      const wavePosition = (i / barCount) * Math.PI * 2
      const waveHeight = Math.sin(wavePosition + Date.now() / 200) * 0.3 + 0.7
      const height = audioLevel * waveHeight * 100
      
      bars.push(
        <div
          key={i}
          className="frequency-bar"
          style={{
            height: `${Math.max(5, height)}%`,
            backgroundColor: isSpeaking 
              ? `hsl(${260 + i * 5}, 70%, 60%)`
              : `hsl(${120 + i * 3}, 70%, 60%)`
          }}
        />
      )
    }
    
    return bars
  }

  return (
    <div className="audio-controls">
      <h2>Audio Monitor</h2>

      <div className="audio-visualizer">
        <div className="frequency-bars">
          {isConnected ? generateBars() : (
            <div className="offline-message">
              Connect to see audio visualization
            </div>
          )}
        </div>
      </div>

      <div className="audio-stats">
        <div className="stat-item">
          <span className="stat-label">Status</span>
          <span className={`stat-value ${isSpeaking ? 'speaking' : 'listening'}`}>
            {isConnected ? (isSpeaking ? 'Speaking' : 'Listening') : 'Offline'}
          </span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Level</span>
          <div className="level-bar">
            <div 
              className="level-fill" 
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">Quality</span>
          <span className="stat-value">
            {audioLevel > 0.7 ? 'Excellent' : audioLevel > 0.3 ? 'Good' : 'Low'}
          </span>
        </div>
      </div>

      <div className="audio-tips">
        <h3>Tips for best quality:</h3>
        <ul>
          <li>Use a headset or earbuds to prevent echo</li>
          <li>Speak clearly and at a normal pace</li>
          <li>Minimize background noise</li>
          <li>Keep your microphone 6-12 inches away</li>
        </ul>
      </div>
    </div>
  )
}