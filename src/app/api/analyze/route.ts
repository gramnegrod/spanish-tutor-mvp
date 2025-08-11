import { NextRequest } from 'next/server'
import { z } from 'zod'
import { conversationService, progressService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'
import { ConversationAnalysisService } from '@/services/conversation-analysis'
import { ConversationTranscript } from '@/types'
import { withSecurity, validateRequest, createSecureResponse } from '@/lib/api-security'

// Input validation schema
const analyzeSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID')
})

async function handler(request: NextRequest) {
  try {
    // Create server client with proper cookie handling
    const supabase = await createClient()
    
    // Get authenticated user
    const user = await dbHelpers.getCurrentUser(supabase)
    if (!user) {
      return createSecureResponse({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate and sanitize input
    const validation = await validateRequest(request, analyzeSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { conversationId } = validation.data

    // Get conversation from Supabase
    const conversation = await conversationService.getById(supabase, conversationId)
    
    if (!conversation || conversation.user_id !== user.id) {
      return createSecureResponse({ error: 'Conversation not found' }, { status: 404 })
    }

    // Analyze conversation using our analysis service
    const analysisService = new ConversationAnalysisService()
    const analysis = await analysisService.analyzeConversation(
      conversation.transcript as ConversationTranscript[],
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

    return createSecureResponse({
      analysis: updatedConversation.analysis,
      progress: progressUpdate
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return createSecureResponse(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    )
  }
}

// Export with security wrapper
export const POST = withSecurity(handler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // 20 analyses per minute
  },
  maxBodySize: 50 * 1024, // 50KB
  requireAuth: true
})