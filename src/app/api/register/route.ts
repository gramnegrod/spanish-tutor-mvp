import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { withSecurity, validateRequest, createSecureResponse, sanitizeText } from '@/lib/api-security'

// Input validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1).max(100).optional().transform(val => val ? sanitizeText(val) : undefined)
})

async function handler(request: NextRequest) {
  try {
    // Validate and sanitize input
    const validation = await validateRequest(request, registerSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data

    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return createSecureResponse(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name: name || email.split('@')[0]
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return createSecureResponse(
          { error: 'User already exists' },
          { status: 409 }
        )
      }
      throw authError
    }

    // Create initial progress record
    const { error: progressError } = await supabase
      .from('progress')
      .insert({
        user_id: authData.user.id,
        vocabulary: [],
        pronunciation: 0,
        grammar: 0,
        fluency: 0,
        cultural_knowledge: 0,
        total_minutes_practiced: 0,
        conversations_completed: 0
      })

    if (progressError) {
      console.error('Progress creation error:', progressError)
      // Don't fail the registration if progress creation fails
    }

    return createSecureResponse({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata.name
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return createSecureResponse(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// Export with security wrapper
export const POST = withSecurity(handler, {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // Only 5 registration attempts per 15 minutes
  },
  maxBodySize: 10 * 1024, // 10KB
  requireAuth: false // Registration doesn't require auth
})