import { NextRequest } from 'next/server'
import { z } from 'zod'
import { conversationService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'
import { ConversationTranscript } from '@/types'
import { withSecurity, validateRequest, createSecureResponse, sanitizeText, sanitizeObject } from '@/lib/api-security'

// Input validation schema
const saveConversationSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizeText),
  persona: z.string().min(1).max(100).transform(sanitizeText),
  transcript: z.array(z.object({
    id: z.string().optional(),
    role: z.string(),
    content: z.string(),
    timestamp: z.number().optional()
  })).min(1).max(1000), // Max 1000 messages
  duration: z.number().min(0).max(7200), // Max 2 hours
  vocabularyAnalysis: z.object({}).passthrough().optional(),
  struggleAnalysis: z.object({}).passthrough().optional()
})

async function handler(request: NextRequest) {
  // Save conversation endpoint
  
  try {
    const supabase = await createClient()
    
    // Check session first
    await supabase.auth.getSession()
    
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      return createSecureResponse({ error: 'Authentication required' }, { status: 401 })
    }
    
    // User authenticated

    // Validate and sanitize input
    const validation = await validateRequest(request, saveConversationSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { title, persona, transcript, duration, vocabularyAnalysis, struggleAnalysis } = validation.data

    // Sanitize transcript content and map to correct format
    const sanitizedTranscript: ConversationTranscript[] = transcript.map((msg, index) => ({
      id: msg.id || `msg-${index}`,
      speaker: msg.role === 'user' ? 'user' : 'assistant',
      text: sanitizeText(msg.content),
      timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString()
    }))

    // Create conversation with enhanced analysis
    
    const conversation = await conversationService.create(supabase, {
      user_id: user.id,
      title,
      persona,
      transcript: sanitizedTranscript,
      duration,
      vocabulary_analysis: sanitizeObject(vocabularyAnalysis || {}),
      struggle_analysis: sanitizeObject(struggleAnalysis || {})
    })
    
    // Conversation created successfully

    return createSecureResponse({ conversation })
  } catch (error) {
    console.error('Save conversation error:', error)
    return createSecureResponse(
      { error: 'Failed to save conversation' },
      { status: 500 }
    )
  }
}

// Export with security wrapper
export const POST = withSecurity(handler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // 20 saves per minute
  },
  maxBodySize: 5 * 1024 * 1024, // 5MB for conversation data
  requireAuth: true
})