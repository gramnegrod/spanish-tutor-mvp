import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withSecurity, validateRequest, createSecureResponse, sanitizeText } from '@/lib/api-security'

// Define the type for our simple conversation storage
interface SimpleConversation {
  id: string
  userId: string
  title: string
  persona: string
  transcript: unknown // This is intentionally flexible for the MVP
  duration: number
  createdAt: string
}

// Simple in-memory storage for MVP (would use database in production)
const conversations: SimpleConversation[] = []

// Input validation schema for simple conversation creation
const simpleConversationSchema = z.object({
  title: z.string().max(200).optional().transform(val => val ? sanitizeText(val) : undefined),
  persona: z.string().max(100).optional().transform(val => val ? sanitizeText(val) : undefined),
  transcript: z.unknown(), // Flexible for MVP
  duration: z.number().min(0).max(7200), // Max 2 hours
  userId: z.string().max(100).optional().transform(val => val ? sanitizeText(val) : undefined)
})

async function postHandler(request: NextRequest) {
  try {
    // Validate and sanitize input
    const validation = await validateRequest(request, simpleConversationSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { title, persona, transcript, duration, userId } = validation.data

    // Create a mock conversation object
    const conversation: SimpleConversation = {
      id: crypto.randomUUID(),
      userId: userId || 'demo-user',
      title: title || 'Practice Conversation',
      persona: persona || 'TAQUERO',
      transcript,
      duration,
      createdAt: new Date().toISOString()
    }

    // Store in memory (in production, this would go to database)
    conversations.push(conversation)

    return createSecureResponse({ conversation })
  } catch (error) {
    console.error('Conversation creation error:', error)
    return createSecureResponse(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

export const POST = withSecurity(postHandler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 requests per minute
  },
  maxBodySize: 2 * 1024 * 1024, // 2MB
  requireAuth: false // Demo route doesn't require auth
})

async function getHandler(_request: NextRequest) {
  try {
    // Return recent conversations (in production, would query database)
    const recentConversations = conversations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return createSecureResponse({ conversations: recentConversations })
  } catch (error) {
    console.error('Conversations fetch error:', error)
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
  requireAuth: false // Demo route doesn't require auth
})