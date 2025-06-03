import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get form data from request
    const formData = await request.formData()
    const audioFile = formData.get('file') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Check file size (API limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
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
      return NextResponse.json(
        { error: `Transcription failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const transcript = await response.json()
    return NextResponse.json(transcript)

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}