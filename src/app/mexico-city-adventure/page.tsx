'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MEXICO_CITY_ADVENTURE, ADVENTURE_STATS } from '@/config/mexico-city-adventure';
import { 
  loadAdventureProgress, 
  saveAdventureProgress, 
  initializeAdventureProgress,
  getScenarioDisplayStatus 
} from '@/lib/adventure-progression';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, MapPin, User, CheckCircle } from 'lucide-react';

export default function MexicoCityAdventurePage() {
  const router = useRouter();
  const [adventureProgress] = useState(() => {
    // Try to load existing progress
    const saved = loadAdventureProgress();
    if (saved) return saved;
    
    // Initialize new adventure
    return initializeAdventureProgress('mexico-city-adventure', MEXICO_CITY_ADVENTURE);
  });

  // Save progress whenever it changes
  useEffect(() => {
    saveAdventureProgress(adventureProgress);
  }, [adventureProgress]);

  const handleScenarioClick = (scenarioId: string) => {
    const scenario = MEXICO_CITY_ADVENTURE.find(s => s.id === scenarioId);
    const progress = adventureProgress.scenarios[scenarioId];
    
    if (!scenario || !progress) return;
    
    const displayStatus = getScenarioDisplayStatus(scenario, progress);
    if (displayStatus.canStart) {
      // Navigate to practice page with scenario context
      router.push(`/practice-v2?scenario=${scenarioId}&adventure=mexico-city&mode=adventure`);
    }
  };

  const completedCount = Object.values(adventureProgress.scenarios)
    .filter(s => s.status === 'completed').length;
  
  const progressPercentage = (completedCount / MEXICO_CITY_ADVENTURE.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menu
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🇲🇽 Mexico City Adventure
          </h1>
          <p className="text-xl text-gray-600">
            Your Complete Spanish Immersion Journey
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {ADVENTURE_STATS.totalScenarios} Authentic Conversations
            </span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              ~{Math.round(ADVENTURE_STATS.totalDuration / 60)} Hours Total
            </span>
            <span className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {ADVENTURE_STATS.difficultyLevel}
            </span>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Journey Progress</CardTitle>
            <CardDescription>
              {completedCount} of {MEXICO_CITY_ADVENTURE.length} scenarios completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="mb-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{Math.round(progressPercentage)}% Complete</span>
              <span>
                {adventureProgress.globalStats.totalTimeMinutes > 0 &&
                  `${Math.round(adventureProgress.globalStats.totalTimeMinutes)} minutes practiced`
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Itinerary */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Itinerary</h2>
          
          {/* Group scenarios by act */}
          <div className="space-y-8">
            {/* Act 1: Arrival */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                🌅 ACT 1: ARRIVAL
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (30-45 minutes)
                </span>
              </h3>
              <div className="grid gap-3">
                {MEXICO_CITY_ADVENTURE.filter(s => s.order >= 0 && s.order <= 4).map(scenario => {
                  const progress = adventureProgress.scenarios[scenario.id];
                  const displayStatus = getScenarioDisplayStatus(scenario, progress);
                  
                  return (
                    <Card 
                      key={scenario.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        displayStatus.canStart ? '' : 'opacity-60'
                      }`}
                      onClick={() => handleScenarioClick(scenario.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {scenario.id === 'travel-agent' && '🗺️'}
                                {scenario.id === 'immigration' && '✈️'}
                                {scenario.id === 'taxi-ride' && '🚕'}
                                {scenario.id === 'hotel-checkin' && '🏨'}
                                {scenario.id === 'luggage-help' && '🛎️'}
                              </span>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {scenario.order}. {scenario.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Meet {scenario.npc.name} • {scenario.npc.role}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Learn: {scenario.learningGoals[0]}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center ml-4">
                            <div className="text-2xl mb-1">{displayStatus.icon}</div>
                            <span className="text-xs text-gray-500">
                              {displayStatus.text}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Act 2: Exploration */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                🏛️ ACT 2: EXPLORATION
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (45-60 minutes)
                </span>
              </h3>
              <div className="grid gap-3">
                {MEXICO_CITY_ADVENTURE.filter(s => s.order >= 5 && s.order <= 7).map(scenario => {
                  const progress = adventureProgress.scenarios[scenario.id];
                  const displayStatus = getScenarioDisplayStatus(scenario, progress);
                  
                  return (
                    <Card 
                      key={scenario.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        displayStatus.canStart ? '' : 'opacity-60'
                      }`}
                      onClick={() => handleScenarioClick(scenario.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {scenario.id === 'taco-stand' && '🌮'}
                                {scenario.id === 'art-museum' && '🎨'}
                                {scenario.id === 'coffee-shop' && '☕'}
                              </span>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {scenario.order}. {scenario.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Meet {scenario.npc.name} • {scenario.npc.role}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Learn: {scenario.learningGoals[0]}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center ml-4">
                            <div className="text-2xl mb-1">{displayStatus.icon}</div>
                            <span className="text-xs text-gray-500">
                              {displayStatus.text}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Act 3: Integration */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                🌆 ACT 3: INTEGRATION
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (60-75 minutes)
                </span>
              </h3>
              <div className="grid gap-3">
                {MEXICO_CITY_ADVENTURE.filter(s => s.order >= 8).map(scenario => {
                  const progress = adventureProgress.scenarios[scenario.id];
                  const displayStatus = getScenarioDisplayStatus(scenario, progress);
                  
                  return (
                    <Card 
                      key={scenario.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        displayStatus.canStart ? '' : 'opacity-60'
                      }`}
                      onClick={() => handleScenarioClick(scenario.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {scenario.id === 'restaurant' && '🍽️'}
                                {scenario.id === 'pharmacy' && '💊'}
                                {scenario.id === 'bus-ride' && '🚌'}
                              </span>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {scenario.order}. {scenario.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Meet {scenario.npc.name} • {scenario.npc.role}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Learn: {scenario.learningGoals[0]}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center ml-4">
                            <div className="text-2xl mb-1">{displayStatus.icon}</div>
                            <span className="text-xs text-gray-500">
                              {displayStatus.text}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Goals */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What You&apos;ll Master</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ADVENTURE_STATS.languageGoals.map((goal, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{goal}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}