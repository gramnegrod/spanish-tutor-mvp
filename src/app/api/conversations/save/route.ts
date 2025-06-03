import { NextResponse } from 'next/server'
import { conversationService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'
import { ConversationTranscript } from '@/types'

export async function POST(request: Request) {
  console.log('[API] Save conversation endpoint called');
  
  try {
    const supabase = await createClient()
    
    // Debug: Check session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[API] Session check:', { 
      hasSession: !!session, 
      sessionError: sessionError?.message,
      userId: session?.user?.id 
    });
    
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      console.error('[API] No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.log('[API] Authenticated user:', { email: user.email, id: user.id });

    const body = await request.json()
    const { title, persona, transcript, duration } = body

    // Validate required fields
    if (!title || !persona || !transcript || !duration) {
      console.error('[API] Missing required fields:', { title, persona, transcriptLength: transcript?.length, duration });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create conversation
    console.log('[API] Creating conversation with:', { title, persona, transcriptLength: transcript.length, duration, userId: user.id });
    
    const conversation = await conversationService.create(supabase, {
      user_id: user.id,
      title,
      persona,
      transcript: transcript as ConversationTranscript[],
      duration
    })
    
    console.log('[API] Conversation created successfully:', conversation.id);

    return NextResponse.json({ conversation })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[API] Error saving conversation:', error);
    
    // Log additional details if it's a Supabase error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[API] Detailed error info:', {
        message: errorMessage,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint
      });
    }
    
    return NextResponse.json(
      { error: `Failed to save conversation: ${errorMessage}` },
      { status: 500 }
    )
  }
}