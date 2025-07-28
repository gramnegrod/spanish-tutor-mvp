import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, MapPin, Star } from 'lucide-react';
import type { JourneyProgress } from '../journey-config';
import { learningScenarios } from '@/config/learning-scenarios';
import type { LearningScenario } from '@/types/adaptive-learning';

interface JourneyMapProps {
  currentProgress: JourneyProgress;
  onScenarioSelect: (scenarioId: string) => void;
  isLoading?: boolean;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  currentProgress,
  onScenarioSelect,
  isLoading = false,
}) => {
  const getScenarioStatus = (scenario: LearningScenario) => {
    // For now, just check if it's the current scenario
    if (currentProgress.scenarioId === scenario.id) {
      return currentProgress.completed ? 'completed' : 'unlocked';
    }
    return 'locked';
  };

  const completedCount = currentProgress.completed ? 1 : 0; // Simplified for now
  const progressPercentage = Math.round((completedCount / learningScenarios.length) * 100);

  return (
    <div className="relative w-full max-w-6xl mx-auto p-4">
      {/* Progress Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu Viaje en Ciudad de México</h2>
        <div className="flex items-center justify-center gap-4">
          <div className="bg-gray-200 rounded-full h-3 w-48 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">{progressPercentage}% Completado</span>
        </div>
      </div>

      {/* Journey Map */}
      <div className="relative">
        {/* Path SVG Background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 10,50 Q 25,20 50,30 T 90,50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.5"
            strokeDasharray="2 2"
            className="hidden md:block"
          />
        </svg>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
          {learningScenarios.map((scenario, index) => {
            const status = getScenarioStatus(scenario);
            const isAccessible = status !== 'locked';
            const isCurrent = currentProgress.scenarioId === scenario.id;

            return (
              <motion.button
                key={scenario.id}
                onClick={() => isAccessible && onScenarioSelect(scenario.id)}
                disabled={!isAccessible || isLoading}
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${status === 'locked' ? 'border-gray-300 bg-gray-100' : ''}
                  ${status === 'unlocked' ? 'border-blue-400 bg-blue-50 hover:bg-blue-100' : ''}
                  ${status === 'completed' ? 'border-green-400 bg-green-50' : ''}
                  ${isCurrent ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
                `}
                whileHover={isAccessible ? { scale: 1.05 } : {}}
                whileTap={isAccessible ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                aria-label={`${scenario.title} - ${status}`}
                aria-disabled={!isAccessible}
              >
                {/* Location Icon */}
                <div className="flex justify-between items-start mb-2">
                  <MapPin
                    className={`w-5 h-5 ${
                      status === 'locked' ? 'text-gray-400' : 'text-red-500'
                    }`}
                  />
                  {status === 'locked' && <Lock className="w-4 h-4 text-gray-400" />}
                  {status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </motion.div>
                  )}
                </div>

                {/* Scenario Info */}
                <h3
                  className={`text-sm font-semibold mb-1 text-left ${
                    status === 'locked' ? 'text-gray-500' : 'text-gray-800'
                  }`}
                >
                  {scenario.title}
                </h3>
                <p
                  className={`text-xs text-left line-clamp-2 ${
                    status === 'locked' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {scenario.description}
                </p>

                {/* Difficulty Badge */}
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      status === 'locked'
                        ? 'bg-gray-200 text-gray-400'
                        : scenario.difficulty === 'beginner'
                        ? 'bg-green-200 text-green-700'
                        : scenario.difficulty === 'intermediate'
                        ? 'bg-yellow-200 text-yellow-700'
                        : 'bg-red-200 text-red-700'
                    }`}
                  >
                    {scenario.difficulty === 'beginner' ? 'Principiante' : 
                     scenario.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                  </span>
                  {status === 'completed' && (
                    <span className="text-xs text-green-600 font-medium">
                      {currentProgress.scenarioId === scenario.id ? currentProgress.bestScore : 0} puntos
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
};