/**
 * ScenarioPreview Component
 * 
 * Displays scenario information including goals, context, and cultural tips
 * before starting a conversation practice session.
 */

import { LearningScenario } from '@/types/adaptive-learning'

interface ScenarioPreviewProps {
  scenario: LearningScenario;
  recordingError?: string;
  onStartConversation: () => void;
}

export function ScenarioPreview({ 
  scenario, 
  recordingError, 
  onStartConversation 
}: ScenarioPreviewProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        {scenario.title}
      </h1>
      
      <div className="mb-6">
        <h3 className="font-semibold text-green-300 mb-2">Goals for this conversation:</h3>
        
        {/* Required goals */}
        <div className="mb-3">
          <h4 className="text-sm text-gray-400 mb-2">Required:</h4>
          <ul className="space-y-1">
            {scenario.goals.filter(g => g.required).map(goal => (
              <li key={goal.id} className="text-gray-300 flex items-start text-sm">
                <span className="text-green-400 mr-2">✓</span>
                {goal.description}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Bonus goals */}
        {scenario.goals.filter(g => !g.required).length > 0 && (
          <>
            <h4 className="text-sm text-gray-400 mb-2">Bonus:</h4>
            <ul className="space-y-1">
              {scenario.goals.filter(g => !g.required).map(goal => (
                <li key={goal.id} className="text-gray-400 flex items-start text-sm">
                  <span className="text-yellow-400 mr-2">★</span>
                  {goal.description}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      
      <div className="mb-6 p-4 bg-blue-900/30 rounded">
        <h3 className="font-semibold text-blue-300 mb-2">Context:</h3>
        <p className="text-gray-300 text-sm mb-2">
          <strong>Setting:</strong> {scenario.context.setting}
        </p>
        <p className="text-gray-300 text-sm mb-2">
          <strong>Your role:</strong> {scenario.context.role_student}
        </p>
        <p className="text-gray-300 text-sm">
          <strong>AI's role:</strong> {scenario.context.role_ai}
        </p>
      </div>
      
      {scenario.context.cultural_notes && scenario.context.cultural_notes.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-900/20 rounded">
          <h3 className="font-semibold text-yellow-300 mb-2">Cultural Tips:</h3>
          <ul className="space-y-1">
            {scenario.context.cultural_notes.map((note, i) => (
              <li key={i} className="text-gray-300 text-sm">• {note}</li>
            ))}
          </ul>
        </div>
      )}
      
      {recordingError && (
        <div className="mb-4 p-3 bg-red-900/50 rounded text-red-300 text-sm">
          {recordingError}
        </div>
      )}
      
      <button
        onClick={onStartConversation}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Start Conversation
      </button>
    </div>
  );
}