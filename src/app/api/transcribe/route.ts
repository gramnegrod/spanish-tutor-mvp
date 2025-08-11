import { NextRequest } from 'next/server'
import { withSecurity, createSecureResponse } from '@/lib/api-security'
import { createClient } from '@/utils/supabase/server'
import { dbHelpers } from '@/lib/supabase-db'

async function handler(request: NextRequest) {
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
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return createSecureResponse(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get form data from request
    const formData = await request.formData()
    const audioFile = formData.get('file') as File
    
    if (!audioFile) {
      return createSecureResponse(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Check file size (API limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return createSecureResponse(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      )
    }

    // Create form data for OpenAI
    const openAIFormData = new FormData()
    openAIFormData.append('file', audioFile)
    openAIFormData.append('model', 'gpt-4o-mini-transcribe')
    openAIFormData.append('language', 'es') // Spanish
    openAIFormData.append('response_format', 'verbose_json')

    // Call OpenAI transcription API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: openAIFormData
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI transcription error:', error)
      return createSecureResponse(
        { error: `Transcription failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const transcript = await response.json()
    return createSecureResponse(transcript)

  } catch (error) {
    console.error('Transcription API error:', error)
    return createSecureResponse(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export with security wrapper
export const POST = withSecurity(handler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // 20 transcriptions per minute
  },
  maxBodySize: 25 * 1024 * 1024, // 25MB for audio files
  requireAuth: true
})