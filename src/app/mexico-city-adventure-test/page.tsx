'use client';

import { useRouter } from 'next/navigation';
// Simple test without complex imports

export default function MexicoCityAdventureTestPage() {
  const router = useRouter();

  const scenarios = [
    { id: 'travel-agent', title: 'Travel Planning', icon: '🗺️' },
    { id: 'immigration', title: 'Airport Immigration', icon: '✈️' },
    { id: 'taxi-ride', title: 'Taxi to Hotel', icon: '🚕' },
    { id: 'hotel-checkin', title: 'Hotel Check-in', icon: '🏨' },
    { id: 'luggage-help', title: 'Luggage Assistance', icon: '🛎️' },
  ];

  const handleScenarioClick = (scenarioId: string) => {
    console.log('Clicked scenario:', scenarioId);
    // Navigate to practice-adventure page with scenario
    router.push(`/practice-adventure?scenario=${scenarioId}&adventure=mexico-city`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => router.push('/dashboard')}>
        ← Back to Menu
      </button>

      <h1>🇲🇽 Mexico City Adventure</h1>
      <p>Test Version - Your Complete Spanish Immersion Journey</p>

      <div>
        {scenarios.map((scenario) => (
          <div 
            key={scenario.id} 
            onClick={() => handleScenarioClick(scenario.id)}
            style={{ 
              border: '1px solid #ccc', 
              margin: '10px 0', 
              padding: '10px',
              cursor: 'pointer',
              backgroundColor: '#f9f9f9',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e9e9e9'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#f9f9f9'}
          >
            <span style={{ fontSize: '24px', marginRight: '10px' }}>{scenario.icon}</span>
            <strong>{scenario.title}</strong>
            <p style={{ margin: '5px 0', color: '#666' }}>Click to start scenario</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>Next Steps</h3>
        <p>This is a test version of the Mexico City Adventure system.</p>
        <p>The full version will include:</p>
        <ul>
          <li>Progress tracking</li>
          <li>11 unique NPCs with different voices</li>
          <li>Achievement system</li>
          <li>Cross-scenario vocabulary tracking</li>
        </ul>
      </div>
    </div>
  );
}