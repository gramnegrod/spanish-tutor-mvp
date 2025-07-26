'use client'

import { useState, useEffect } from 'react'
import { getLoggedErrors, clearLoggedErrors } from '@/lib/error-logging'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Trash2, Download, RefreshCw } from 'lucide-react'

export function ErrorLogViewer() {
  const [errors, setErrors] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      loadErrors()
    }
  }, [])

  const loadErrors = () => {
    const loggedErrors = getLoggedErrors()
    setErrors(loggedErrors)
  }

  const handleClear = () => {
    clearLoggedErrors()
    setErrors([])
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(errors, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `error-log-${Date.now()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      {/* Floating debug button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-red-700"
        title="Error Log Viewer"
      >
        {errors.length > 0 ? errors.length : '!'}
      </button>

      {/* Error log panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Error Log Viewer (Dev Only)</CardTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={loadErrors}
                >
                  🔄
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleExport}
                  disabled={errors.length === 0}
                >
                  ⬇️
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleClear}
                  disabled={errors.length === 0}
                >
                  🗑️
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              {errors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No errors logged</p>
              ) : (
                <div className="space-y-4">
                  {errors.map((error, index) => (
                    <div key={index} className="border rounded p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-red-600">
                            {error.message}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {error.category}
                        </span>
                      </div>
                      
                      {error.context && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600">
                            Context
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      {error.stack && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600">
                            Stack trace
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}