import { NextRequest } from 'next/server'
import { createSecureResponse } from '@/lib/api-security'

export async function POST(_request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('No OpenAI API key found in environment variables');
      return createSecureResponse(
        { error: 'OpenAI API key not configured.' },
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
        voice: "alloy",
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
    
    // Return in the format your NPM module expects
    return createSecureResponse({
      token: data.client_secret.value
    })
    
  } catch (error) {
    console.error('Session creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return createSecureResponse(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}