/**
 * UserSettingsForm Component
 * 
 * Handles user competency level and speech settings configuration
 * for adaptive learning scenarios.
 */

import { UserSettings } from '@/types/adaptive-learning'

interface UserSettingsFormProps {
  userSettings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onSave: () => void;
}

export function UserSettingsForm({ 
  userSettings, 
  onSettingsChange, 
  onSave 
}: UserSettingsFormProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Welcome to Adaptive Learning!
      </h1>
      
      <p className="text-gray-300 mb-6">
        Let's customize your learning experience. These settings help us adapt to your needs.
      </p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What's your current Spanish level?
          </label>
          <select
            value={userSettings.competency_level}
            onChange={(e) => onSettingsChange({
              ...userSettings,
              competency_level: e.target.value as any
            })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          >
            <option value="beginner">Beginner - I know basic phrases</option>
            <option value="intermediate">Intermediate - I can have simple conversations</option>
            <option value="advanced">Advanced - I'm comfortable in most situations</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            How fast should the AI speak?
          </label>
          <select
            value={userSettings.speech_settings.speaking_speed}
            onChange={(e) => onSettingsChange({
              ...userSettings,
              speech_settings: {
                ...userSettings.speech_settings,
                speaking_speed: e.target.value as any
              }
            })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          >
            <option value="slow">Slow - Give me time to process</option>
            <option value="normal">Normal - Natural pace</option>
            <option value="fast">Fast - Challenge me!</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pause duration between sentences (seconds)
          </label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.5"
            value={userSettings.speech_settings.pause_duration}
            onChange={(e) => onSettingsChange({
              ...userSettings,
              speech_settings: {
                ...userSettings.speech_settings,
                pause_duration: parseFloat(e.target.value)
              }
            })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded"
          />
        </div>
      </div>
      
      <button
        onClick={onSave}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-6"
      >
        Continue
      </button>
    </div>
  );
}