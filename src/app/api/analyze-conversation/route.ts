import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    // Security: Removed unnecessary logging
    
    if (!apiKey) {
      console.error('No OpenAI API key found in environment variables');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    const openai = new OpenAI({
      apiKey: apiKey
    })

    const { transcript, events, scenarioGoals, userLevel } = await request.json()

    if (!transcript || !userLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

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

    return NextResponse.json({
      wins: analysisResult.wins || [],
      mistakes: analysisResult.mistakes || [],
      corrections: analysisResult.corrections || [],
      comprehension_level: analysisResult.comprehension_level || 'unknown',
      goal_progress: analysisResult.goal_progress || {},
      recommendations: analysisResult.recommendations || []
    })

  } catch (error: any) {
    console.error('Analysis API error:', error)
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Unknown error'
      : 'Internal server error'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}