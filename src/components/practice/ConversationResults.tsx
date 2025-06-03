/**
 * ConversationResults Component
 * 
 * Displays comprehensive conversation analysis including strengths,
 * areas for improvement, comprehension scores, and recommendations.
 */

import { ConversationAnalysis } from '@/services/conversation-analysis'

interface ConversationResultsProps {
  analysisResults: ConversationAnalysis | null;
  onTryAgain: () => void;
  onNextScenario: () => void;
}

export function ConversationResults({ 
  analysisResults, 
  onTryAgain, 
  onNextScenario 
}: ConversationResultsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Conversation Results
      </h1>
      
      {analysisResults ? (
        <>
          {/* Strengths */}
          <div className="mb-6 p-4 bg-green-900/30 rounded">
            <h3 className="font-semibold text-green-300 mb-2">What You Did Well:</h3>
            <ul className="space-y-1">
              {(analysisResults.wins || []).map((win, i) => (
                <li key={i} className="text-gray-300">✓ {win}</li>
              ))}
            </ul>
          </div>
          
          {/* Areas for Improvement */}
          {analysisResults.mistakes && analysisResults.mistakes.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-900/30 rounded">
              <h3 className="font-semibold text-yellow-300 mb-2">Areas to Improve:</h3>
              <ul className="space-y-2">
                {analysisResults.mistakes.map((mistake, i) => (
                  <li key={i} className="text-gray-300">
                    <span className="text-yellow-400">→</span> {mistake}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Comprehension Score */}
          <div className="mb-6 p-4 bg-blue-900/30 rounded">
            <h3 className="font-semibold text-blue-300 mb-2">Comprehension Score:</h3>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-700 rounded-full h-4 mr-4">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${analysisResults.quality_assessment?.completeness ? 
                              analysisResults.quality_assessment.completeness * 100 : 50}%` 
                  }}
                />
              </div>
              <span className="text-white font-medium">
                {Math.round((analysisResults.quality_assessment?.completeness || 0.5) * 100)}%
              </span>
            </div>
          </div>
          
          {/* Engagement Score */}
          {analysisResults.quality_assessment?.engagement !== undefined && (
            <div className="mb-6 p-4 bg-purple-900/30 rounded">
              <h3 className="font-semibold text-purple-300 mb-2">Engagement Level:</h3>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-700 rounded-full h-4 mr-4">
                  <div 
                    className="bg-purple-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${analysisResults.quality_assessment.engagement * 100}%` }}
                  />
                </div>
                <span className="text-white font-medium">
                  {Math.round(analysisResults.quality_assessment.engagement * 100)}%
                </span>
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {analysisResults.recommendations.length > 0 && (
            <div className="mb-6 p-4 bg-indigo-900/30 rounded">
              <h3 className="font-semibold text-indigo-300 mb-2">Recommendations:</h3>
              <ul className="space-y-1">
                {analysisResults.recommendations.map((rec, i) => (
                  <li key={i} className="text-gray-300">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Cultural Notes */}
          {analysisResults.cultural_notes && analysisResults.cultural_notes.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-900/30 rounded">
              <h3 className="font-semibold text-yellow-300 mb-2">Cultural Insights:</h3>
              <ul className="space-y-1">
                {analysisResults.cultural_notes.map((note, i) => (
                  <li key={i} className="text-gray-300">🌎 {note}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-400 text-center py-8">
          Analysis results unavailable. Your conversation was still recorded for future review.
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onTryAgain}
          className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onNextScenario}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next Scenario
        </button>
      </div>
    </div>
  );
}