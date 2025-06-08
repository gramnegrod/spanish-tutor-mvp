'use client';

import { useEffect, useState } from 'react';

export default function DebugNoAuthPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('Debug page mounted - checking for redirects...');
    
    // Check if there are any automatic redirects happening
    const timer = setTimeout(() => {
      console.log('Page stayed mounted for 2 seconds - no redirects detected');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1>🐛 Debug Page (No Auth Redirect)</h1>
      <p>✅ This page should stay visible.</p>
      <p>✅ Mounted at: {new Date().toLocaleTimeString()}</p>
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Test Links:</h3>
        <ul>
          <li><a href="/test-simple">Simple Test Page</a></li>
          <li><a href="/practice-no-auth">Practice (No Auth Required)</a></li>
          <li><a href="/mexico-city-adventure-test">Mexico City Test</a></li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>🎯 Mexico City Adventure Preview:</h3>
        
        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ddd' }}>
          <h4>🗺️ Travel Agent - Lic. Patricia</h4>
          <p>Professional, organized travel expert (nova voice)</p>
          <p><strong>Role:</strong> Explains your confirmed Mexico City itinerary</p>
        </div>

        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ddd' }}>
          <h4>✈️ Immigration Officer - Lic. Martínez</h4>
          <p>Formal Monterrey businessman, military precision (onyx voice)</p>
          <p><strong>Quirk:</strong> Says "precisamente" constantly, never contracts words</p>
        </div>

        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ddd' }}>
          <h4>💊 British Pharmacist - Lic. Ramírez</h4>
          <p>UK transplant with British accent in Spanish (nova voice)</p>
          <p><strong>Quirk:</strong> "Buenas tahdes, ¿en qué puedo ayudahle?"</p>
        </div>
      </div>
    </div>
  );
}