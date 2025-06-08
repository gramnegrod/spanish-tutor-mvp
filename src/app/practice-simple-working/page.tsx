'use client';

import { useState } from 'react';

export default function PracticeSimpleWorkingPage() {
  const [message, setMessage] = useState('Ready to test!');

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1>🌮 Simple Practice Page (Working)</h1>
        <p>This is a minimal practice page that should definitely work.</p>
        
        <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
          <h2>Status: {message}</h2>
          <button 
            onClick={() => setMessage('Button clicked!')}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Test Click
          </button>
        </div>

        <div style={{ marginTop: '30px' }}>
          <h3>🎯 What we built today:</h3>
          <ul style={{ lineHeight: '1.6' }}>
            <li>✅ <strong>Mexico City Adventure</strong> - 11 NPCs with unique voices</li>
            <li>✅ <strong>NPC Personality System</strong> - Character-specific prompts</li>
            <li>✅ <strong>Adventure Progression</strong> - Linear unlock system</li>
            <li>✅ <strong>British Pharmacist</strong> - "Buenas tahdes, ¿en qué puedo ayudahle?"</li>
            <li>✅ <strong>WebRTC Audio Fix</strong> - Fixed audio track timing issue</li>
          </ul>
        </div>

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f5e8', border: '1px solid #4caf50' }}>
          <h3>🔧 Current Issue:</h3>
          <p>The AuthContext redirects signed-in users to <code>/practice</code> automatically.</p>
          <p><strong>Solution:</strong> We need to modify the redirect logic to allow Mexico City Adventure pages.</p>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>🚀 Next Steps:</h3>
          <ol style={{ lineHeight: '1.6' }}>
            <li>Fix AuthContext redirect to allow adventure pages</li>
            <li>Test the British pharmacist conversation</li>
            <li>Implement achievement system</li>
            <li>Add cross-scenario vocabulary tracking</li>
          </ol>
        </div>
      </div>
    </div>
  );
}