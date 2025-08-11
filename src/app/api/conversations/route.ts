import { NextRequest } from 'next/server'
import { z } from 'zod'
import { conversationService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'
import { withSecurity, validateRequest, createSecureResponse, sanitizeText } from '@/lib/api-security'

async function getHandler(_request: NextRequest) {
  try {
    // Create server client with proper cookie handling
    const supabase = await createClient()
    
    // Get authenticated user
    const user = await dbHelpers.getCurrentUser(supabase)
    if (!user) {
      return createSecureResponse({ error: 'Authentication required' }, { status: 401 })
    }

    // Get conversations for the authenticated user
    const conversations = await conversationService.getByUserId(supabase, user.id)

    return createSecureResponse({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return createSecureResponse(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export const GET = withSecurity(getHandler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute for GET
  },
  requireAuth: true
})

// Input validation schema for creating conversations
const createConversationSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizeText),
  persona: z.string().max(100).optional().transform(val => val ? sanitizeText(val) : undefined),
  transcript: z.array(z.object({
    id: z.string(),
    speaker: z.enum(['user', 'assistant']),
    text: z.string(),
    timestamp: z.union([z.string(), z.date()]).transform(val => val instanceof Date ? val.toISOString() : val),
    audioUrl: z.string().optional()
  })),
  duration: z.number().min(0).max(3600).optional() // Max 1 hour
})

async function postHandler(request: NextRequest) {
  try {
    // Create server client with proper cookie handling
    const supabase = await createClient()
    
    // Get authenticated user
    const user = await dbHelpers.getCurrentUser(supabase)
    if (!user) {
      return createSecureResponse({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate and sanitize input
    const validation = await validateRequest(request, createConversationSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { title, persona, transcript, duration } = validation.data

    // Create conversation in Supabase
    const conversation = await conversationService.create(supabase, {
      user_id: user.id,
      title,
      persona: persona || 'Taco Vendor',
      transcript,
      duration: duration || 0
    })

    return createSecureResponse({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return createSecureResponse(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

export const POST = withSecurity(postHandler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 requests per minute for POST
  },
  maxBodySize: 2 * 1024 * 1024, // 2MB for transcripts
  requireAuth: true
})