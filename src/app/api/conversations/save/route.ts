import { NextResponse } from 'next/server'
import { conversationService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'
import { ConversationTranscript } from '@/types'
import { errorResponse } from '@/lib/api-utils'

export async function POST(request: Request) {
  // Save conversation endpoint
  
  try {
    const supabase = await createClient()
    
    // Check session first
    await supabase.auth.getSession()
    
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // User authenticated

    const body = await request.json()
    const { title, persona, transcript, duration, vocabularyAnalysis, struggleAnalysis } = body

    // Validate required fields
    if (!title || !persona || !transcript || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create conversation with enhanced analysis
    
    const conversation = await conversationService.create(supabase, {
      user_id: user.id,
      title,
      persona,
      transcript: transcript as ConversationTranscript[],
      duration,
      vocabulary_analysis: vocabularyAnalysis || {},
      struggle_analysis: struggleAnalysis || {}
    })
    
    // Conversation created successfully

    return NextResponse.json({ conversation })
  } catch (error) {
    return errorResponse('Failed to save conversation', 500, error)
  }
}