import { NextRequest } from 'next/server'
import { withSecurity, createSecureResponse } from '@/lib/api-security'
import { createClient } from '@/utils/supabase/server'
import { dbHelpers } from '@/lib/supabase-db'

async function handler(_request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const user = await dbHelpers.getCurrentUser(supabase)
    if (!user) {
      return createSecureResponse(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    // Security: Removed API key logging
    
    if (!apiKey) {
      console.error('No OpenAI API key found in environment variables');
      return createSecureResponse(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      )
    }
    
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview",
        voice: "alloy", // or "verse"
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error
      })
      return createSecureResponse(
        { error: `Failed to create session: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return createSecureResponse(data)
    
  } catch (error) {
    console.error('Session creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return createSecureResponse(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// Export with security wrapper
export const GET = withSecurity(handler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // 20 requests per minute (session creation is expensive)
  },
  requireAuth: true
})