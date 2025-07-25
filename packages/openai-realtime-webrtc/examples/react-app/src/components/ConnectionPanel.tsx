import React from 'react'
import { ConnectionState } from '../hooks/useRealtimeChat'
import './ConnectionPanel.css'

interface ConnectionPanelProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  isConnected: boolean
  connectionState: ConnectionState
  onConnect: () => void
  onDisconnect: () => void
}

export function ConnectionPanel({
  apiKey,
  onApiKeyChange,
  isConnected,
  connectionState,
  onConnect,
  onDisconnect
}: ConnectionPanelProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) {
      onConnect()
    }
  }

  return (
    <div className="connection-panel">
      <h2>Connection</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="apiKey">OpenAI API Key</label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="sk-..."
            disabled={isConnected}
            className="api-key-input"
          />
          <small className="form-help">
            Your API key is never stored and is only used for this session
          </small>
        </div>

        <div className="connection-status">
          <div className={`status-indicator ${connectionState}`} />
          <span className="status-text">
            {connectionState === 'connecting' && 'Connecting...'}
            {connectionState === 'connected' && 'Connected'}
            {connectionState === 'disconnected' && 'Disconnected'}
            {connectionState === 'error' && 'Connection Error'}
          </span>
        </div>

        <div className="button-group">
          {!isConnected ? (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!apiKey || connectionState === 'connecting'}
            >
              {connectionState === 'connecting' ? (
                <>
                  <span className="loading" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onDisconnect}
              className="btn btn-danger"
            >
              Disconnect
            </button>
          )}
        </div>
      </form>

      <div className="connection-info">
        <h3>Configuration</h3>
        <div className="info-item">
          <span className="info-label">Model:</span>
          <span className="info-value">gpt-4o-realtime-preview</span>
        </div>
        <div className="info-item">
          <span className="info-label">Voice:</span>
          <span className="info-value">alloy</span>
        </div>
        <div className="info-item">
          <span className="info-label">Mode:</span>
          <span className="info-value">WebRTC</span>
        </div>
      </div>
    </div>
  )
}