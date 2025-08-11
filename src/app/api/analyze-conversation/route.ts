import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { withSecurity, validateRequest, createSecureResponse, sanitizeText } from '@/lib/api-security'
import { createClient } from '@/utils/supabase/server'
import { dbHelpers } from '@/lib/supabase-db'

// Input validation schema
const analyzeConversationSchema = z.object({
  transcript: z.string().min(1).max(50000).transform(sanitizeText),
  events: z.array(z.any()).optional(),
  scenarioGoals: z.array(z.string()).optional(),
  userLevel: z.enum(['beginner', 'intermediate', 'advanced', 'native'])
})

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

    // Validate and sanitize input
    const validation = await validateRequest(request, analyzeConversationSchema)
    if (!validation.success) {
      return createSecureResponse(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { transcript, events, scenarioGoals, userLevel } = validation.data

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('No OpenAI API key found in environment variables');
      return createSecureResponse(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    const openai = new OpenAI({
      apiKey: apiKey
    })

    // Call GPT-4.1 for analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1', // Advanced language model for conversation analysis (Released April 2025)
      messages: [
        {
          role: 'system',
          content: `You are an expert Spanish language teacher analyzing a student's conversation.
          
          Analyze the transcript and events to identify:
          1. Specific wins (what they did well)
          2. Specific mistakes with corrections
          3. Comprehension level based on response timing and accuracy
          4. Progress on scenario goals
          5. Recommendations for future practice
          
          Consider the student's level: ${userLevel}
          
          Return a structured analysis in JSON format.`
        },
        {
          role: 'user',
          content: JSON.stringify({
            transcript: transcript,
            events: events,
            goals: scenarioGoals,
            student_level: userLevel
          })
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}')

    // Sanitize output
    return createSecureResponse({
      wins: analysisResult.wins || [],
      mistakes: analysisResult.mistakes || [],
      corrections: analysisResult.corrections || [],
      comprehension_level: analysisResult.comprehension_level || 'unknown',
      goal_progress: analysisResult.goal_progress || {},
      recommendations: analysisResult.recommendations || []
    })

  } catch (error) {
    console.error('Analysis API error:', error)
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error'
    
    return createSecureResponse(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Export with security wrapper
export const POST = withSecurity(handler, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 requests per minute
  },
  maxBodySize: 1024 * 1024, // 1MB
  requireAuth: true
})