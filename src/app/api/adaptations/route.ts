import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adaptationsService, dbHelpers } from '@/lib/supabase-db'
import { createClient } from '@/utils/supabase/server'
import { withSecurity, validateRequest, createSecureResponse, sanitizeText } from '@/lib/api-security'

async function getHandler(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      return createSecureResponse({ error: 'Authentication required' }, { status: 401 })
    }

    const adaptations = await adaptationsService.getByUserId(supabase, user.id)
    return createSecureResponse({ adaptations })
  } catch (error) {
    console.error('Error fetching adaptations:', error)
    return createSecureResponse(
      { error: 'Failed to fetch adaptations' },
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

// Input validation schema for adaptations
const adaptationsSchema = z.object({
  common_errors: z.array(z.string().transform(sanitizeText)).max(100).optional(),
  mastered_concepts: z.array(z.string().transform(sanitizeText)).max(100).optional(),
  struggle_areas: z.array(z.string().transform(sanitizeText)).max(50).optional()
})

async function postHandler(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await dbHelpers.getCurrentUser(supabase)
    
    if (!user) {
      return createSecureResponse({ error: 'Authentication required' }, { status: 401 })
    }

    // Validate and sanitize input
    const validation = await validateRequest(request, adaptationsSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { common_errors, mastered_concepts, struggle_areas } = validation.data

    const adaptations = await adaptationsService.upsert(supabase, {
      user_id: user.id,
      common_errors: common_errors || [],
      mastered_concepts: mastered_concepts || [],
      struggle_areas: struggle_areas || []
    })

    return createSecureResponse({ adaptations })
  } catch (error) {
    console.error('Error updating adaptations:', error)
    return createSecureResponse(
      { error: 'Failed to update adaptations' },
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