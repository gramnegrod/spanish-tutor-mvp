'use client'

import { useState } from 'react'
import { extractHiddenAnalysis } from '@/lib/pedagogical-system'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestHiddenAnalysisPage() {
  const [testResult, setTestResult] = useState<any>(null)
  
  const testAnalysisExtraction = () => {
    // Test different AI response formats
    const testCases = [
      {
        name: 'Standard response with analysis',
        input: `¡Órale! Dos tacos de pastor, very good choice!
<!--ANALYSIS:pronunciation=good,fluency=developing,errors=[gender_agreement],strengths=[food_vocabulary;ordering_phrases],confidence=0.7-->`
      },
      {
        name: 'Response with multiline analysis',
        input: `¡Claro que sí! Let me help you with that.
<!--ANALYSIS:
pronunciation=fair,
fluency=halting,
errors=[verb_conjugation;word_order],
strengths=[basic_greetings],
confidence=0.4
-->`
      },
      {
        name: 'Response without analysis',
        input: '¡Hola! ¿Qué tal? Welcome to my taco stand!'
      }
    ]
    
    const results = testCases.map(testCase => {
      const result = extractHiddenAnalysis(testCase.input)
      return {
        name: testCase.name,
        input: testCase.input,
        cleanText: result.cleanText,
        analysis: result.analysis
      }
    })
    
    setTestResult(results)
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Hidden Analysis System Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Analysis Extraction</CardTitle>
          <CardDescription>
            Test if the hidden analysis system correctly extracts and parses AI response data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testAnalysisExtraction}>Run Tests</Button>
        </CardContent>
      </Card>
      
      {testResult && (
        <div className="space-y-4">
          {testResult.map((result: any, idx: number) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">{result.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">Input:</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {result.input}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">Clean Text:</h4>
                    <p className="bg-blue-50 p-2 rounded">{result.cleanText}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600">Extracted Analysis:</h4>
                    {result.analysis ? (
                      <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.analysis, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-gray-500 italic">No analysis found</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}