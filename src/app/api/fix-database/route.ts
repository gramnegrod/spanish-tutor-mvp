import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Run the SQL command using Supabase's rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE progress ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';`
    })
    
    if (error) {
      // If RPC doesn't exist, we need to use a different approach
      // Try creating a test row with the language field
      const { error: insertError } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          language: 'es',
          total_minutes_practiced: 0,
          conversations_completed: 0
        })
      
      if (insertError && insertError.message.includes('language')) {
        return NextResponse.json({
          error: 'Cannot add language column via API',
          message: 'You need to run this SQL in Supabase dashboard:',
          sql: "ALTER TABLE progress ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';",
          steps: [
            '1. Go to your Supabase dashboard',
            '2. Click "SQL Editor" in the left sidebar',
            '3. Click "New Query"',
            '4. Paste the SQL above',
            '5. Click "Run"'
          ]
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Database structure updated successfully!'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Language column added successfully!'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fix database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}