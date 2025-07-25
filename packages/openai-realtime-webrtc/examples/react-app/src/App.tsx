import React, { useState } from 'react'
import { ConnectionPanel } from './components/ConnectionPanel'
import { ConversationView } from './components/ConversationView'
import { AudioControls } from './components/AudioControls'
import { StatusBar } from './components/StatusBar'
import { useRealtimeChat } from './hooks/useRealtimeChat'
import './App.css'

function App() {
  const [apiKey, setApiKey] = useState('')
  
  const {
    isConnected,
    connectionState,
    messages,
    audioLevel,
    isSpeaking,
    error,
    connect,
    disconnect,
    clearMessages
  } = useRealtimeChat()

  const handleConnect = async () => {
    if (!apiKey) {
      alert('Please enter your OpenAI API key')
      return
    }
    await connect(apiKey)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>OpenAI Realtime Chat</h1>
          <p>Production-ready React example with TypeScript</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="app-grid">
            <div className="app-sidebar">
              <ConnectionPanel
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                isConnected={isConnected}
                connectionState={connectionState}
                onConnect={handleConnect}
                onDisconnect={disconnect}
              />
              
              <AudioControls
                audioLevel={audioLevel}
                isSpeaking={isSpeaking}
                isConnected={isConnected}
              />
            </div>

            <div className="app-content">
              <ConversationView
                messages={messages}
                isConnected={isConnected}
                onClear={clearMessages}
              />
              
              {error && (
                <div className="error-banner">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <StatusBar
        isConnected={isConnected}
        messageCount={messages.length}
        connectionState={connectionState}
      />
    </div>
  )
}

export default App