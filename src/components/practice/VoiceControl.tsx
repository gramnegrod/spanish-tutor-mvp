/**
 * VoiceControl Component
 * 
 * Provides the voice connection interface including connection status,
 * microphone visual indicators, speaking state animations, and 
 * conversation starters/menu tips.
 */

import { Button } from '@/components/ui/button'
import { Mic, Loader2 } from 'lucide-react'
import { LearnerProfile } from '@/lib/pedagogical-system'

interface VoiceControlProps {
  isConnected: boolean;
  isConnecting?: boolean;
  currentSpeaker: 'user' | 'assistant' | null;
  learnerProfile: LearnerProfile;
  onConnect: () => void;
  hasManuallyConnected?: boolean;
  adaptationProgress?: {
    mode: string;
    progress: number;
    target: number;
    description: string;
  };
  children?: React.ReactNode; // For additional UI like session stats
}

export function VoiceControl({
  isConnected,
  isConnecting = false,
  currentSpeaker,
  learnerProfile,
  onConnect,
  hasManuallyConnected = false,
  adaptationProgress,
  children
}: VoiceControlProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Connection Status */}
      <div className="text-center">
        {isConnected ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Mic className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-sm text-green-600 font-medium">Connected - Speak anytime</p>
          </div>
        ) : isConnecting ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            </div>
            <p className="text-sm text-gray-600">Connecting to tutor...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <Mic className="h-10 w-10 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600 mb-2">Not connected</p>
            <Button 
              onClick={onConnect} 
              size="sm"
              disabled={hasManuallyConnected}
            >
              {hasManuallyConnected ? 'Connecting...' : 'Start New Session'}
            </Button>
          </div>
        )}
      </div>
      
      {/* Speaking Indicators */}
      {currentSpeaker === 'user' && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-blue-600 animate-pulse"></div>
            <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm font-medium">Analyzing your Spanish...</span>
        </div>
      )}
      
      {currentSpeaker === 'assistant' && (
        <div className="flex items-center gap-2 text-green-600">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-green-600 animate-pulse"></div>
            <div className="w-1 h-4 bg-green-600 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-4 bg-green-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm font-medium">
            {learnerProfile.needsMoreEnglish ? 'Teaching with English...' : 'Immersing in Spanish...'}
          </span>
        </div>
      )}

      {/* AI Tutor Mode & Adaptation Progress */}
      {adaptationProgress && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs">🧠 AI Tutor Mode</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              learnerProfile.needsMoreEnglish ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {learnerProfile.needsMoreEnglish ? '🤝 Helping' : '🚀 Immersion'}
            </span>
          </div>
          
          {/* Adaptation Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Adaptation Progress:</span>
              <span className="text-gray-500">{adaptationProgress.description}</span>
            </div>
            <div className="flex gap-1">
              {[...Array(adaptationProgress.target)].map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${
                  i < adaptationProgress.progress 
                    ? (adaptationProgress.mode === 'helper' ? 'bg-green-400' : 'bg-orange-400')
                    : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>

          {/* Session Stats (passed as children) */}
          {children}
        </div>
      )}
      
      {/* Tips section with conversation starters and menu */}
      <div className="text-sm text-gray-600 space-y-2 text-center">
        <p className="font-semibold">Conversation starters:</p>
        <ul className="space-y-1">
          <li>"Hola, ¿qué tal?"</li>
          <li>"Quiero tacos, por favor"</li>
          <li>"¿De qué son?"</li>
          <li>"¿Cuánto cuesta?"</li>
        </ul>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="font-semibold text-xs mb-2">Today's Menu:</p>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>🐷 Al Pastor (pork + 🍍)</span>
              <span>$15</span>
            </div>
            <div className="flex justify-between">
              <span>🥩 Carnitas (crispy pork)</span>
              <span>$12</span>
            </div>
            <div className="flex justify-between">
              <span>🥩 Suadero (beef)</span>
              <span>$12</span>
            </div>
            <div className="flex justify-between">
              <span>🧀 Quesadilla</span>
              <span>$20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}