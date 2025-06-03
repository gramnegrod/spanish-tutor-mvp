import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    console.log('Session API - Environment check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENAI'))
    });
    
    if (!apiKey) {
      console.error('No OpenAI API key found in environment variables');
      console.error('Available environment variables:', Object.keys(process.env).slice(0, 10));
      return NextResponse.json(
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