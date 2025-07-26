import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        details: authError 
      }, { status: 401 })
    }

    // Create test conversation data
    const testData = {
      user_id: user.id,
      title: `Test Conversation - ${new Date().toLocaleTimeString()}`,
      persona: 'Don Roberto (Test)',
      transcript: [
        { speaker: 'assistant', text: '¡Hola! ¿Qué te puedo servir hoy?' },
        { speaker: 'user', text: 'Hola, quiero dos tacos de pastor por favor' },
        { speaker: 'assistant', text: '¡Claro que sí! Dos tacos de pastor. ¿Con todo?' }
      ],
      duration: 120, // 2 minutes
      language: 'es',
      scenario: 'taco_ordering',
      metadata: {},
      analysis: null
    }

    console.log('Attempting to save test conversation for user:', user.email)
    
    // Try to save directly with Supabase
    const { data: result, error: saveError } = await supabase
      .from('conversations')
      .insert(testData)
      .select()
      .single()
    
    if (saveError) {
      throw saveError
    }
    
    console.log('Save successful:', result)

    // Now test progress update
    console.log('Testing progress update...')
    
    const progressData = {
      user_id: user.id,
      language: 'es',
      total_minutes_practiced: 2,
      conversations_completed: 1,
      updated_at: new Date().toISOString()
    }
    
    // First check if progress record exists
    const { data: existingProgress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    let progressResult, progressError
    
    if (existingProgress) {
      // Update existing record
      const { data, error } = await supabase
        .from('progress')
        .update({
          language: 'es',
          total_minutes_practiced: (existingProgress.total_minutes_practiced || 0) + 2,
          conversations_completed: (existingProgress.conversations_completed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()
      
      progressResult = data
      progressError = error
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('progress')
        .insert(progressData)
        .select()
        .single()
      
      progressResult = data
      progressError = error
    }
    
    if (progressError) {
      // If error mentions column not found, show which columns are missing
      if (progressError.message.includes('column')) {
        return NextResponse.json({
          success: false,
          error: 'Progress update failed - column issue',
          details: progressError.message,
          attempted_data: progressData,
          hint: 'The progress table exists but is missing some columns',
          fix: 'Run this SQL in Supabase: ALTER TABLE progress ADD COLUMN IF NOT EXISTS total_minutes_practiced INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS conversations_completed INTEGER DEFAULT 0;'
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Progress update failed',
        details: progressError.message,
        attempted_data: progressData
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Both conversation and progress saved successfully!',
      conversation: {
        id: result.id,
        title: result.title,
        created_at: result.created_at,
        user_id: result.user_id
      },
      progress: {
        total_minutes_practiced: progressResult.total_minutes_practiced,
        conversations_completed: progressResult.conversations_completed
      },
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Test failed:', error)
    
    return NextResponse.json({ 
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}