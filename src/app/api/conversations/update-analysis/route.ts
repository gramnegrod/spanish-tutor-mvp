import { NextResponse } from 'next/server'
import { conversationService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, analysis } = body

    if (!conversationId || !analysis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update conversation analysis
    await conversationService.updateAnalysis(supabase, conversationId, analysis)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating conversation analysis:', error)
    return NextResponse.json(
      { error: 'Failed to update analysis' },
      { status: 500 }
    )
  }
}