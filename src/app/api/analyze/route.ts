import { NextResponse } from 'next/server'
import { conversationService, progressService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'
import { ConversationAnalysisService } from '@/services/conversation-analysis'

export async function POST(request: Request) {
  try {
    // Create server client with proper cookie handling
    const supabase = await createClient()
    
    // Get authenticated user
    const user = await dbHelpers.getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Get conversation from Supabase
    const conversation = await conversationService.getById(supabase, conversationId)
    
    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Analyze conversation using our analysis service
    const analysisService = new ConversationAnalysisService()
    const analysis = await analysisService.analyzeConversation(
      conversation.transcript as any,
      'beginner', // TODO: Get user level from profile
      ['order_food', 'make_polite_requests'] // TODO: Get scenario goals
    )

    // Update conversation with analysis in Supabase
    const updatedConversation = await conversationService.updateAnalysis(
      supabase,
      conversationId, 
      analysis
    )

    // Update user progress based on analysis
    const progressUpdate = await progressService.incrementStats(supabase, user.id, {
      minutes_practiced: Math.round(analysis.conversation_metrics.totalDuration / 60),
      conversations_completed: 1,
      pronunciation_improvement: Math.round(analysis.quality_assessment.engagement * 10),
      grammar_improvement: Math.round(analysis.quality_assessment.completeness * 10),
      fluency_improvement: Math.round(analysis.quality_assessment.progression * 10),
      cultural_improvement: analysis.cultural_notes.length * 5
    })

    // Add vocabulary to progress
    if (analysis.vocabulary_used.length > 0) {
      await progressService.addVocabulary(supabase, user.id, analysis.vocabulary_used)
    }

    return NextResponse.json({
      analysis: updatedConversation.analysis,
      progress: progressUpdate
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    )
  }
}