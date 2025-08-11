import { NextRequest } from 'next/server'
import { z } from 'zod'
import { progressService, dbHelpers } from '@/lib/supabase-db'
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

    // Get progress for the authenticated user
    const progress = await progressService.getByUserId(supabase, user.id)
    
    // Calculate streak (simplified for now)
    const streak = progress?.conversations_completed || 0

    // Determine level based on progress
    const totalScore = (progress?.pronunciation || 0) + (progress?.grammar || 0) + 
                      (progress?.fluency || 0) + (progress?.cultural_knowledge || 0)
    const level = totalScore < 100 ? 'beginner' : totalScore < 200 ? 'intermediate' : 'advanced'

    return createSecureResponse({
      progress: progress || {
        vocabulary: [],
        pronunciation: 0,
        grammar: 0,
        fluency: 0,
        cultural_knowledge: 0,
        total_minutes_practiced: 0,
        conversations_completed: 0
      },
      streak,
      level
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return createSecureResponse(
      { error: 'Failed to fetch progress' },
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

// Input validation schema for progress updates
const updateProgressSchema = z.object({
  vocabulary: z.array(z.string().transform(sanitizeText)).max(100).optional(),
  minutesPracticed: z.number().min(0).max(300).optional(), // Max 5 hours per session
  pronunciationImprovement: z.number().min(0).max(10).optional(),
  grammarImprovement: z.number().min(0).max(10).optional(),
  fluencyImprovement: z.number().min(0).max(10).optional(),
  culturalImprovement: z.number().min(0).max(10).optional()
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
    const validation = await validateRequest(request, updateProgressSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { 
      vocabulary, 
      minutesPracticed, 
      pronunciationImprovement,
      grammarImprovement,
      fluencyImprovement,
      culturalImprovement
    } = validation.data

    // Update progress using increment function
    const progress = await progressService.incrementStats(supabase, user.id, {
      minutes_practiced: minutesPracticed || 0,
      conversations_completed: 1,
      pronunciation_improvement: pronunciationImprovement || 0,
      grammar_improvement: grammarImprovement || 0,
      fluency_improvement: fluencyImprovement || 0,
      cultural_improvement: culturalImprovement || 0
    })

    // Add vocabulary if provided
    if (vocabulary && vocabulary.length > 0) {
      await progressService.addVocabulary(supabase, user.id, vocabulary)
    }

    // Calculate new streak
    const streak = progress.conversations_completed || 0

    return createSecureResponse({ 
      progress,
      streak
    })
  } catch (error) {
    console.error('Error updating progress:', error)
    return createSecureResponse(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

export const POST = withSecurity(postHandler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 updates per minute
  },
  maxBodySize: 100 * 1024, // 100KB
  requireAuth: true
})