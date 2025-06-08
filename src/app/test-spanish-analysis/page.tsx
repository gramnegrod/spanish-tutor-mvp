'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  createTacoVendorAnalyzer,
  analyzeSpanishText,
  checkEssentialVocabulary,
  generateTestConversation,
  runDevelopmentAnalysis,
  type ConversationTurn 
} from '@/lib/spanish-analysis'

export default function TestSpanishAnalysisPage() {
  const [testText, setTestText] = useState('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [conversationAnalysis, setConversationAnalysis] = useState<any>(null)

  const runQuickAnalysis = () => {
    if (!testText.trim()) return
    
    console.log('[Test] Running quick analysis on:', testText)
    
    const result = analyzeSpanishText(testText, 'taco_vendor', 'beginner')
    const essentialCheck = checkEssentialVocabulary(testText, 'taco_vendor')
    
    setAnalysisResult({
      quickAnalysis: result,
      essentialCheck,
      timestamp: new Date().toLocaleTimeString()
    })
    
    console.log('[Test] Analysis complete:', { result, essentialCheck })
  }

  const runConversationAnalysis = () => {
    console.log('[Test] Running full conversation analysis')
    
    const devAnalysis = runDevelopmentAnalysis('taco_vendor')
    setConversationAnalysis(devAnalysis)
    
    console.log('[Test] Conversation analysis complete:', devAnalysis)
  }

  const testSpanishPhrases = [
    'Hola, quiero dos tacos de pastor',
    '¡Órale! ¿Cuánto cuesta?', 
    'Sí, con todo por favor',
    'Gracias güero, está muy rico',
    'Para llevar, sale pues',
    'Hello, I want some tacos please',
    'Me da tacos pero no entiendo español muy bien'
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Spanish Analysis Module Test</h1>
          <p className="text-gray-600">Test the enhanced Spanish vocabulary and cultural analysis system</p>
        </div>

        {/* Quick Text Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Spanish Text Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Spanish Text:</label>
              <textarea
                className="w-full p-3 border rounded-lg"
                rows={3}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter Spanish text to analyze..."
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button onClick={runQuickAnalysis} disabled={!testText.trim()}>
                Analyze Text
              </Button>
              {testSpanishPhrases.map((phrase, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setTestText(phrase)}
                >
                  "{phrase.slice(0, 20)}..."
                </Button>
              ))}
            </div>

            {analysisResult && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Analysis Results ({analysisResult.timestamp})</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Spanish Words Found:</strong>
                    <ul className="list-disc list-inside">
                      {analysisResult.quickAnalysis.spanishWords.map((word: string, i: number) => (
                        <li key={i}>{word}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Mexican Expressions:</strong>
                    <ul className="list-disc list-inside">
                      {analysisResult.quickAnalysis.mexicanExpressions.map((expr: string, i: number) => (
                        <li key={i} className="text-green-600 font-medium">{expr}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Essential Taco Vocab Used:</strong>
                    <ul className="list-disc list-inside">
                      {analysisResult.essentialCheck.used.map((word: string, i: number) => (
                        <li key={i} className="text-blue-600">{word}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Coverage:</strong>
                    <div className="text-lg font-bold">
                      {Math.round(analysisResult.essentialCheck.coverage * 100)}%
                    </div>
                    <div className="text-xs text-gray-600">
                      ({analysisResult.essentialCheck.used.length} of {analysisResult.essentialCheck.used.length + analysisResult.essentialCheck.missing.length} essential words)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Full Conversation Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Full Conversation Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runConversationAnalysis}>
              Run Test Conversation Analysis
            </Button>

            {conversationAnalysis && (
              <div className="space-y-4">
                {/* Test Conversation */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Test Conversation:</h4>
                  <div className="space-y-2">
                    {conversationAnalysis.conversation.map((turn: ConversationTurn, index: number) => (
                      <div key={index} className={`p-2 rounded ${
                        turn.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-green-100 mr-8'
                      }`}>
                        <span className="font-medium capitalize">{turn.role}:</span> {turn.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Words User Used:</h4>
                    <div className="space-y-1">
                      {conversationAnalysis.analysis.wordsUsed.map((word: any, i: number) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{word.word}</span>
                          <span className={`ml-2 px-1 rounded text-xs ${
                            word.isMexicanSpecific ? 'bg-green-200' : 'bg-blue-200'
                          }`}>
                            {word.category}
                          </span>
                          {word.isMexicanSpecific && <span className="ml-1 text-green-600">🇲🇽</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Session Metrics:</h4>
                    <div className="space-y-1 text-sm">
                      <div>Spanish Words: {conversationAnalysis.analysis.sessionMetrics.totalSpanishWords}</div>
                      <div>Mexican Expressions: {conversationAnalysis.analysis.sessionMetrics.mexicanExpressionsUsed}</div>
                      <div>Vocabulary Usage: {Math.round(conversationAnalysis.analysis.sessionMetrics.vocabularyUsageRate * 100)}%</div>
                      <div>Cultural Authenticity: {Math.round(conversationAnalysis.analysis.sessionMetrics.culturalAuthenticity * 100)}%</div>
                      <div>Overall Confidence: {Math.round(conversationAnalysis.analysis.sessionMetrics.overallConfidence * 100)}%</div>
                    </div>
                  </div>
                </div>

                {/* Database Format */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Database Format (for Enhanced Tables):</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium">Vocabulary Analysis:</h5>
                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(conversationAnalysis.databaseFormat.vocabularyAnalysis, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h5 className="font-medium">Struggle Analysis:</h5>
                      <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(conversationAnalysis.databaseFormat.struggleAnalysis, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Status */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Spanish Analysis Module Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">✅ Implemented Features</h4>
                <ul className="space-y-1">
                  <li>• Mexican vocabulary detection</li>
                  <li>• Cultural expression recognition</li>
                  <li>• Essential scenario vocabulary tracking</li>
                  <li>• Grammar pattern basics</li>
                  <li>• Database integration ready</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔧 Integration Points</h4>
                <ul className="space-y-1">
                  <li>• useConversationEngine hook</li>
                  <li>• UnifiedStorageService</li>
                  <li>• Enhanced database columns</li>
                  <li>• API conversation save route</li>
                  <li>• Real-time feedback system</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🎯 Next Steps</h4>
                <ul className="space-y-1">
                  <li>• Update practice pages to use scenario param</li>
                  <li>• Test with real conversations</li>
                  <li>• Enhance grammar detection</li>
                  <li>• Add pronunciation analysis hooks</li>
                  <li>• Build vocabulary review UI</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}