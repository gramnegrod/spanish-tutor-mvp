import { NextRequest } from 'next/server'
import { z } from 'zod'
import { conversationService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'
import { withSecurity, validateRequest, createSecureResponse, sanitizeObject } from '@/lib/api-security'

// Input validation schema
const updateAnalysisSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  analysis: z.object({
    wins: z.array(z.string()).optional(),
    mistakes: z.array(z.string()).optional(),
    corrections: z.array(z.string()).optional(),
    comprehension_level: z.string().optional(),
    goal_progress: z.record(z.any()).optional(),
    recommendations: z.array(z.string()).optional()
  })
})

async function handler(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      return createSecureResponse({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate and sanitize input
    const validation = await validateRequest(request, updateAnalysisSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { conversationId, analysis } = validation.data

    // Verify user owns the conversation
    const conversation = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single()

    if (conversation.error || conversation.data.user_id !== user.id) {
      return createSecureResponse(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Sanitize analysis data
    const sanitizedAnalysis = sanitizeObject(analysis)

    // Update conversation analysis
    await conversationService.updateAnalysis(supabase, conversationId, sanitizedAnalysis)

    return createSecureResponse({ success: true })
  } catch (error) {
    console.error('Error updating conversation analysis:', error)
    return createSecureResponse(
      { error: 'Failed to update analysis' },
      { status: 500 }
    )
  }
}

// Export with security wrapper
export const POST = withSecurity(handler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 updates per minute
  },
  maxBodySize: 512 * 1024, // 512KB
  requireAuth: true
})