'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function InspectStoragePage() {
  const [storageData, setStorageData] = useState<Record<string, any>>({})
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    loadStorageData()
  }, [])

  const loadStorageData = () => {
    if (typeof window === 'undefined') return

    const data: Record<string, any> = {}
    
    // Get all localStorage keys that might be related to our app
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            // Try to parse as JSON, fallback to string
            try {
              data[key] = JSON.parse(value)
            } catch {
              data[key] = value
            }
          }
        } catch (error) {
          data[key] = `Error reading: ${error}`
        }
      }
    }
    
    setStorageData(data)
  }

  const clearStorage = () => {
    if (confirm('Are you sure you want to clear all localStorage? This will delete all guest progress.')) {
      localStorage.clear()
      loadStorageData()
    }
  }

  const clearSpecificKey = (key: string) => {
    if (confirm(`Delete "${key}"?`)) {
      localStorage.removeItem(key)
      loadStorageData()
    }
  }

  const formatValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  const getStorageSize = () => {
    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total
  }

  if (!isMounted) {
    return <div>Loading...</div>
  }

  // Filter for Spanish tutor related keys
  const spanishTutorKeys = Object.keys(storageData).filter(key => 
    key.includes('spanish-tutor') || 
    key.includes('mexico-city') ||
    key.includes('guest') ||
    key.includes('conversation') ||
    key.includes('progress')
  )

  const otherKeys = Object.keys(storageData).filter(key => !spanishTutorKeys.includes(key))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">localStorage Inspector</h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Total items: {Object.keys(storageData).length}</span>
            <span>Total size: ~{Math.round(getStorageSize() / 1024)} KB</span>
            <span>Spanish Tutor items: {spanishTutorKeys.length}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={loadStorageData}>Refresh</Button>
            <Button variant="destructive" onClick={clearStorage}>Clear All Storage</Button>
          </div>
        </div>

        {/* Spanish Tutor Data */}
        {spanishTutorKeys.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-green-700">🎓 Spanish Tutor Data</h2>
            <div className="grid gap-4">
              {spanishTutorKeys.map(key => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span className="font-mono text-sm">{key}</span>
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {typeof storageData[key] === 'object' ? 'JSON' : 'String'}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => clearSpecificKey(key)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                      {formatValue(storageData[key])}
                    </pre>
                    
                    {/* Special formatting for known structures */}
                    {key.includes('conversations') && Array.isArray(storageData[key]) && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <h4 className="font-semibold text-sm mb-2">📋 Conversation Summary:</h4>
                        <ul className="text-sm space-y-1">
                          {storageData[key].map((conv: any, i: number) => (
                            <li key={i}>
                              <strong>{conv.title || 'Untitled'}</strong> 
                              ({conv.transcript?.length || 0} messages, {conv.duration || 0}s)
                              {conv.createdAt && ` - ${new Date(conv.createdAt).toLocaleDateString()}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {key.includes('progress') && typeof storageData[key] === 'object' && (
                      <div className="mt-3 p-3 bg-green-50 rounded">
                        <h4 className="font-semibold text-sm mb-2">📈 Progress Summary:</h4>
                        <div className="text-sm">
                          <div>Practice time: {storageData[key].totalMinutes || 0} minutes</div>
                          <div>Conversations: {storageData[key].conversationsCompleted || 0}</div>
                          <div>Vocabulary: {storageData[key].vocabulary?.length || 0} words</div>
                        </div>
                      </div>
                    )}
                    
                    {key.includes('learner-profile') && typeof storageData[key] === 'object' && (
                      <div className="mt-3 p-3 bg-purple-50 rounded">
                        <h4 className="font-semibold text-sm mb-2">👤 Profile Summary:</h4>
                        <div className="text-sm">
                          <div>Level: {storageData[key].level || 'Unknown'}</div>
                          <div>Struggling words: {storageData[key].strugglingWords?.length || 0}</div>
                          <div>Mastered phrases: {storageData[key].masteredPhrases?.length || 0}</div>
                          {storageData[key].pronunciation && <div>Pronunciation: {storageData[key].pronunciation}</div>}
                          {storageData[key].fluency && <div>Fluency: {storageData[key].fluency}</div>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other localStorage Data */}
        {otherKeys.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-700">🗃️ Other localStorage Data</h2>
            <div className="grid gap-4">
              {otherKeys.map(key => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span className="font-mono text-sm">{key}</span>
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {typeof storageData[key] === 'object' ? 'JSON' : 'String'}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => clearSpecificKey(key)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                      {formatValue(storageData[key]).substring(0, 500)}
                      {formatValue(storageData[key]).length > 500 && '...'}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {Object.keys(storageData).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No Data Found</h2>
              <p className="text-gray-600">Your localStorage is empty or contains no readable data.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}