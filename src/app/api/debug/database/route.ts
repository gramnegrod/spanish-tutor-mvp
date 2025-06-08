import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result: any = {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      tables: {}
    }

    // If specific table requested
    if (table) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        result.tables[table] = { error: error.message }
      } else {
        result.tables[table] = { data, count, limited_to: limit }
      }
    } else {
      // Get overview of all tables
      const tables = [
        'conversations',
        'progress', 
        'user_adaptations',
        'vocabulary_entries',
        'vocabulary_usage_log',
        'learning_difficulties',
        'learning_patterns',
        'remediation_opportunities'
      ]

      for (const tableName of tables) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5) // Just a few records for overview

          if (error) {
            result.tables[tableName] = { error: error.message, count: 0 }
          } else {
            result.tables[tableName] = { 
              count, 
              sample_data: data,
              has_data: (count || 0) > 0
            }
          }
        } catch (err) {
          result.tables[tableName] = { 
            error: `Table might not exist or access denied: ${err}`,
            count: 0 
          }
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch database information' },
      { status: 500 }
    )
  }
}