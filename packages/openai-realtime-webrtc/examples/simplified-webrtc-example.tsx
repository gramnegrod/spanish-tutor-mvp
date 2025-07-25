/**
 * Example showing the simplified WebRTC implementation
 * Demonstrates cleaner API, better error handling, and connection monitoring
 */

import React, { useState, useEffect } from 'react';
import { 
  OpenAIRealtimeService,
  type RealtimeServiceConfig,
  type RealtimeServiceState
} from '../src/core/OpenAIRealtimeService';

// Example 1: Basic usage with the service
function BasicExample() {
  const [service] = useState(() => new OpenAIRealtimeService({
    tokenEndpoint: '/api/session',
    voice: 'alloy',
    instructions: 'You are a helpful assistant'
  }));
  const [state, setState] = useState<RealtimeServiceState>({
    status: 'disconnected',
    sessionId: null,
    error: null,
    metrics: {
      connectedAt: null,
      messagesSent: 0,
      messagesReceived: 0
    }
  });

  useEffect(() => {
    // Listen for state changes
    service.on('stateChanged', setState);
    
    // Handle incoming text messages
    service.on('textReceived', (text) => {
      console.log('AI said:', text);
    });

    // Handle errors
    service.on('error', (error) => {
      console.error('Service error:', error);
    });

    // Cleanup
    return () => {
      service.dispose();
    };
  }, [service]);

  const connect = async () => {
    try {
      // One simple method to connect - no complex flow!
      await service.connect();
    } catch (error) {
      // Errors are already user-friendly
      alert(error.message);
    }
  };

  const sendMessage = async () => {
    try {
      await service.sendText('Hello!');
    } catch (error) {
      // Clear error if not connected
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>Simplified WebRTC Example</h2>
      
      {/* Connection status */}
      <div className={`status status-${state.status}`}>
        Status: {state.status}
        {state.sessionId && (
          <span className="session">
            (Session: {state.sessionId.slice(0, 8)}...)
          </span>
        )}
      </div>

      {/* Error display */}
      {state.error && (
        <div className="error">
          {state.error.message}
        </div>
      )}

      {/* Simple controls */}
      {state.status === 'disconnected' && (
        <button onClick={connect}>Connect</button>
      )}
      
      {state.status === 'connecting' && (
        <div>Connecting...</div>
      )}
      
      {state.status === 'connected' && (
        <>
          <button onClick={() => service.disconnect()}>Disconnect</button>
          <button onClick={sendMessage}>Send Hello</button>
        </>
      )}
    </div>
  );
}

// Example 2: Using the React hook
import { useOpenAIRealtime } from '../src/react/useOpenAIRealtime';

function HookExample() {
  const {
    state,
    isConnected,
    connect,
    disconnect,
    sendText,
    audioRef
  } = useOpenAIRealtime({
    tokenEndpoint: '/api/session',
    voice: 'alloy',
    instructions: 'You are a helpful assistant'
  });

  // Status indicator component
  const StatusIndicator = () => {
    const colors = {
      connected: '#22c55e',
      connecting: '#eab308',
      disconnected: '#6b7280',
      error: '#ef4444'
    };

    return (
      <div 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '16px',
          backgroundColor: colors[state.status] + '20',
          color: colors[state.status],
          fontSize: '14px',
          fontWeight: 500
        }}
      >
        <div 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: colors[state.status]
          }}
        />
        {state.status}
        {state.metrics.messagesSent > 0 && ` (${state.metrics.messagesSent} sent)`}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h2>React Hook Example</h2>
      
      {/* Status bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px'
      }}>
        <span>Status: <strong>{state.status}</strong></span>
        <StatusIndicator />
        <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      </div>

      {/* Error display with helpful formatting */}
      {state.error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          whiteSpace: 'pre-line' // Preserves line breaks in error messages
        }}>
          {state.error.message}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {!isConnected ? (
          <button 
            onClick={connect}
            disabled={state.status === 'connecting'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: state.status === 'connecting' ? 'not-allowed' : 'pointer',
              opacity: state.status === 'connecting' ? 0.5 : 1
            }}
          >
            {state.status === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <>
            <button 
              onClick={disconnect}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
            <button 
              onClick={() => sendText('Hello from React!')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Send Test Message
            </button>
          </>
        )}
      </div>

      {/* Session info display */}
      {state.sessionId && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px'
        }}>
          <strong>Session info:</strong>
          <div style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
            ID: {state.sessionId.slice(0, 16)}...<br/>
            Messages sent: {state.metrics.messagesSent}<br/>
            Messages received: {state.metrics.messagesReceived}
          </div>
        </div>
      )}
    </div>
  );
}

// Example 3: Error handling demonstration
function ErrorHandlingExample() {
  const [service] = useState(() => new OpenAIRealtimeService({
    // Intentionally missing tokenEndpoint to show error
    tokenEndpoint: '',
    voice: 'alloy'
  }));
  const [error, setError] = useState<string>('');

  const demonstrateErrors = async () => {
    // Example 1: No token endpoint
    try {
      await service.connect();
    } catch (err) {
      setError(err.message);
    }

    // Example 2: Send without connection
    try {
      await service.sendText('test');
    } catch (err) {
      setError(prev => prev + '\n\n' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Error Handling Example</h2>
      <button onClick={demonstrateErrors}>Demonstrate Errors</button>
      
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
          whiteSpace: 'pre-line'
        }}>
          <strong>Errors are now user-friendly:</strong>
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

// Example 4: Service metrics monitoring
function MetricsExample() {
  const {
    state,
    connect,
    disconnect,
    isConnected,
    sendText
  } = useOpenAIRealtime({
    tokenEndpoint: '/api/session',
    voice: 'alloy',
    debug: true
  });

  const sendTestMessage = () => {
    sendText(`Test message at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Service Metrics Example</h2>
      
      <div style={{ marginBottom: '20px' }}>
        {!isConnected ? (
          <button onClick={connect}>Connect to Monitor</button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={disconnect}>Disconnect</button>
            <button onClick={sendTestMessage}>Send Test Message</button>
          </div>
        )}
      </div>

      {state.sessionId && (
        <div>
          <h3>Session Metrics</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Session ID:</td>
                <td style={{ padding: '8px' }}>{state.sessionId}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Status:</td>
                <td style={{ padding: '8px' }}>{state.status}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Connected At:</td>
                <td style={{ padding: '8px' }}>
                  {state.metrics.connectedAt?.toLocaleTimeString() || 'Not connected'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Messages Sent:</td>
                <td style={{ padding: '8px' }}>{state.metrics.messagesSent}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Messages Received:</td>
                <td style={{ padding: '8px' }}>{state.metrics.messagesReceived}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Main app component
export default function App() {
  return (
    <div>
      <h1>OpenAI Realtime API Examples</h1>
      <BasicExample />
      <hr />
      <HookExample />
      <hr />
      <ErrorHandlingExample />
      <hr />
      <MetricsExample />
    </div>
  );
}