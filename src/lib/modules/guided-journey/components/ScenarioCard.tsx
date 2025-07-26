import React from 'react';
import { Lock, Play, CheckCircle, Clock } from 'lucide-react';

interface JourneyScenario {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  duration: number;
  imageUrl?: string;
}

interface ScenarioProgress {
  percentage: number;
  score?: number;
  achievements?: string[];
}

interface ScenarioCardProps {
  scenario: JourneyScenario;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  progress?: ScenarioProgress;
  onStart: () => void;
  prerequisites?: string[];
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  status,
  progress,
  onStart,
  prerequisites = []
}) => {
  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < count ? 'text-yellow-500' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  );

  const renderStatus = () => {
    switch (status) {
      case 'locked':
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Complete prerequisites first</span>
          </div>
        );
      case 'available':
        return (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        );
      case 'in-progress':
        return (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress?.percentage || 0}%` }}
              />
            </div>
            <button onClick={onStart} className="text-blue-600 text-sm hover:underline">
              Continue
            </button>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Score: {progress?.score || 0}%</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg ${
        status === 'locked' ? 'opacity-75' : ''
      }`}
    >
      {scenario.imageUrl && (
        <img
          src={scenario.imageUrl}
          alt={scenario.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">{scenario.title}</h3>
          <p className="text-gray-600 text-sm">{scenario.description}</p>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div>{renderStars(scenario.difficulty)}</div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{scenario.duration} min</span>
          </div>
        </div>

        {status === 'locked' && prerequisites.length > 0 && (
          <div className="text-sm text-gray-500 border-t pt-3">
            <p className="font-medium mb-1">Prerequisites:</p>
            <ul className="list-disc list-inside space-y-1">
              {prerequisites.map((prereq, index) => (
                <li key={index}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}

        {status === 'completed' && progress?.achievements && (
          <div className="flex gap-2 flex-wrap">
            {progress.achievements.map((badge, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="pt-2">{renderStatus()}</div>
      </div>
    </div>
  );
};