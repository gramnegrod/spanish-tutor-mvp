import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'API routes working',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      // Show all env vars that contain OPENAI
      allOpenAIVars: Object.keys(process.env).filter(key => key.includes('OPENAI'))
    }
  })
}