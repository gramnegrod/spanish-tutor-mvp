import React, { useRef, useEffect } from 'react'
import { Message } from '../hooks/useRealtimeChat'
import './ConversationView.css'

interface ConversationViewProps {
  messages: Message[]
  isConnected: boolean
  onClear: () => void
}

export function ConversationView({ messages, isConnected, onClear }: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="conversation-view">
      <div className="conversation-header">
        <h2>Conversation</h2>
        {messages.length > 0 && (
          <button onClick={onClear} className="clear-btn">
            Clear History
          </button>
        )}
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            {isConnected ? (
              <>
                <div className="empty-icon">🎤</div>
                <h3>Ready to chat!</h3>
                <p>Just start speaking and I'll respond.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">🔌</div>
                <h3>Not connected</h3>
                <p>Connect to start your conversation.</p>
              </>
            )}
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role} fade-in`}
              >
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' && '👤 You'}
                    {message.role === 'assistant' && '🤖 Assistant'}
                    {message.role === 'system' && '⚙️ System'}
                  </span>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {isConnected && (
        <div className="conversation-footer">
          <div className="typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <span className="listening-text">Listening...</span>
        </div>
      )}
    </div>
  )
}