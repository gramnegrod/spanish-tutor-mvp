import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        connected: false,
        error: 'Missing Supabase credentials',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test database connection by checking if tables exist
    const { data: profiles, error: profilesError } = await supabase
      .from('learner_profiles')
      .select('count')
      .limit(1)
      
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1)
      
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('count')
      .limit(1)

    return NextResponse.json({
      connected: true,
      database: {
        url: supabaseUrl,
        tables: {
          learner_profiles: profilesError ? `Error: ${profilesError.message}` : 'Connected ✓',
          conversations: conversationsError ? `Error: ${conversationsError.message}` : 'Connected ✓',
          user_progress: progressError ? `Error: ${progressError.message}` : 'Connected ✓'
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    })
  }
}