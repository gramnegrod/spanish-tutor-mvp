import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try to select from progress table to see what columns exist
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        error: 'Failed to query progress table',
        details: error.message,
        code: error.code
      })
    }
    
    // Get the columns from the result
    const columns = data && data.length > 0 
      ? Object.keys(data[0])
      : 'No rows found to inspect columns'
    
    // Also try a raw SQL query to get table structure
    const { data: tableStructure, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'progress' })
      .select('*')
    
    return NextResponse.json({
      success: true,
      columns_from_data: columns,
      sample_row: data?.[0] || null,
      structure_query_error: structureError?.message || null,
      recommendation: 'Check what columns exist vs what the code expects'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check progress table',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}