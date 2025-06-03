import { NextResponse } from 'next/server'

export async function GET() {
  // Log all env vars that start with OPENAI
  const openaiVars = Object.keys(process.env)
    .filter(key => key.includes('OPENAI'))
    .map(key => ({
      key,
      hasValue: !!process.env[key],
      length: process.env[key]?.length || 0
    }));

  return NextResponse.json({
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY?.length || 0,
    keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not found',
    nodeEnv: process.env.NODE_ENV,
    openaiVars,
    // Check if we're reading from .env or .env.local
    envFiles: {
      dotenv: !!process.env.DOTENV_LOADED,
      cwd: process.cwd()
    }
  })
}