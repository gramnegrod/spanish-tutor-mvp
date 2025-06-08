'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TableData {
  count?: number
  sample_data?: any[]
  has_data: boolean
  error?: string
  data?: any[]
  limited_to?: number
}

interface DatabaseInfo {
  user_id: string
  timestamp: string
  tables: Record<string, TableData>
}

export default function DatabaseDebugPage() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableDetails, setTableDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDatabaseOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug/database')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setDbInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load database info')
    } finally {
      setLoading(false)
    }
  }

  const loadTableDetails = async (tableName: string, limit = 50) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/debug/database?table=${tableName}&limit=${limit}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setTableDetails(data.tables[tableName])
      setSelectedTable(tableName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDatabaseOverview()
  }, [])

  const formatJson = (obj: any) => {
    if (typeof obj === 'object' && obj !== null) {
      return JSON.stringify(obj, null, 2)
    }
    return String(obj)
  }

  const getTableStatus = (tableData: TableData) => {
    if (tableData.error) return { color: 'bg-red-100 text-red-800', text: 'Error' }
    if (!tableData.has_data) return { color: 'bg-gray-100 text-gray-600', text: 'Empty' }
    return { color: 'bg-green-100 text-green-800', text: `${tableData.count} records` }
  }

  if (loading && !dbInfo) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading database information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Database Inspector</h1>
          <div className="flex gap-4 text-sm text-gray-600">
            {dbInfo && (
              <>
                <span>User: {dbInfo.user_id.substring(0, 8)}...</span>
                <span>Last updated: {new Date(dbInfo.timestamp).toLocaleTimeString()}</span>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={loadDatabaseOverview} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Overview'}
            </Button>
            {selectedTable && (
              <Button variant="outline" onClick={() => {setSelectedTable(null); setTableDetails(null)}}>
                Back to Overview
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-800">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {!selectedTable && dbInfo && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Database Tables Overview</h2>
            
            {/* Original Tables */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700">Original Tables</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {['conversations', 'progress', 'user_adaptations'].map(tableName => {
                  const tableData = dbInfo.tables[tableName]
                  const status = getTableStatus(tableData)
                  return (
                    <Card key={tableName} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-sm font-medium">{tableName}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tableData.error ? (
                          <p className="text-red-600 text-xs">{tableData.error}</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600">
                              {tableData.has_data ? `${tableData.count} total records` : 'No data yet'}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => loadTableDetails(tableName)}
                              disabled={!tableData.has_data}
                            >
                              View Details
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* New Tables */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">New Enhanced Tables</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['vocabulary_entries', 'vocabulary_usage_log', 'learning_difficulties', 'learning_patterns', 'remediation_opportunities'].map(tableName => {
                  const tableData = dbInfo.tables[tableName]
                  const status = getTableStatus(tableData)
                  return (
                    <Card key={tableName} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-sm font-medium">{tableName}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tableData.error ? (
                          <p className="text-red-600 text-xs">{tableData.error}</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600">
                              {tableData.has_data ? `${tableData.count} total records` : 'Ready for data'}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => loadTableDetails(tableName)}
                            >
                              {tableData.has_data ? 'View Data' : 'Check Structure'}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Migration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">✅ Successfully Created</h4>
                    <ul className="text-sm space-y-1">
                      {Object.entries(dbInfo.tables).filter(([_, data]) => !data.error).map(([name]) => (
                        <li key={name}>• {name}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">📊 Data Status</h4>
                    <p className="text-sm">
                      Tables with data: {Object.values(dbInfo.tables).filter(t => t.has_data).length} / {Object.keys(dbInfo.tables).length}
                    </p>
                    <p className="text-sm mt-1">
                      New tables are empty (expected) - they'll populate as you use enhanced features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTable && tableDetails && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">{selectedTable}</h2>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                tableDetails.error ? 'bg-red-100 text-red-800' : 
                tableDetails.count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {tableDetails.error ? 'Error' : `${tableDetails.count || 0} records`}
              </span>
            </div>

            {tableDetails.error ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-800">{tableDetails.error}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tableDetails.data && tableDetails.data.length > 0 ? (
                  tableDetails.data.map((record: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Record {index + 1} {record.id && `(ID: ${record.id.substring(0, 8)}...)`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-64">
                          {formatJson(record)}
                        </pre>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
                      <p className="text-gray-600">
                        This table exists and is ready to collect data, but no records have been created yet.
                      </p>
                      {selectedTable.includes('vocabulary') && (
                        <p className="text-sm text-blue-600 mt-2">
                          Vocabulary data will be collected during conversations once we implement the tracking logic.
                        </p>
                      )}
                      {selectedTable.includes('learning_difficulties') && (
                        <p className="text-sm text-blue-600 mt-2">
                          Struggle data will be captured during conversations once we implement the detection logic.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {tableDetails.limited_to && tableDetails.count > tableDetails.limited_to && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <p className="text-yellow-800">
                        Showing {tableDetails.limited_to} of {tableDetails.count} total records. 
                        Use the API directly for full data access.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}