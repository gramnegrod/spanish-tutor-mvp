import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // TEMPORARY: Hardcode the API key to get it working
    // TODO: Fix environment variable loading in Next.js 15.1.5
    const apiKey = '***REMOVED***';
    
    console.log('Session API - Using hardcoded key temporarily');
    
    if (!apiKey) {
      console.error('No OpenAI API key found');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
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
        model: "gpt-4o-realtime-preview-2024-12-17",
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
      return NextResponse.json(
        { error: `Failed to create session: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}