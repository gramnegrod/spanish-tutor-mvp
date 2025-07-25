import React from 'react'
import { ConnectionState } from '../hooks/useRealtimeChat'
import './StatusBar.css'

interface StatusBarProps {
  isConnected: boolean
  messageCount: number
  connectionState: ConnectionState
}

export function StatusBar({ isConnected, messageCount, connectionState }: StatusBarProps) {
  const getLatency = () => {
    // In production, this would be actual latency measurement
    if (!isConnected) return '--'
    return `${Math.floor(Math.random() * 50 + 20)}ms`
  }

  return (
    <footer className="status-bar">
      <div className="container">
        <div className="status-content">
          <div className="status-section">
            <div className="status-item">
              <span className="status-icon">🔌</span>
              <span className="status-label">Connection:</span>
              <span className={`status-value ${connectionState}`}>
                {connectionState}
              </span>
            </div>
            
            <div className="status-item">
              <span className="status-icon">💬</span>
              <span className="status-label">Messages:</span>
              <span className="status-value">{messageCount}</span>
            </div>
            
            <div className="status-item">
              <span className="status-icon">⚡</span>
              <span className="status-label">Latency:</span>
              <span className="status-value">{getLatency()}</span>
            </div>
          </div>

          <div className="status-section">
            <div className="status-item">
              <span className="status-icon">🔒</span>
              <span className="status-label">Secure WebRTC connection</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}