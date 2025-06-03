import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  // Check if env files exist
  const projectRoot = process.cwd()
  const envExists = fs.existsSync(path.join(projectRoot, '.env'))
  const envLocalExists = fs.existsSync(path.join(projectRoot, '.env.local'))
  
  // Read first line of each file (safely)
  let envFirstLine = 'N/A'
  let envLocalFirstLine = 'N/A'
  
  try {
    if (envExists) {
      const envContent = fs.readFileSync(path.join(projectRoot, '.env'), 'utf8')
      const lines = envContent.split('\n').filter(line => line.includes('OPENAI_API_KEY'))
      envFirstLine = lines[0] ? `Found: ${lines[0].substring(0, 30)}...` : 'No OPENAI_API_KEY found'
    }
    
    if (envLocalExists) {
      const envLocalContent = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf8')
      const lines = envLocalContent.split('\n').filter(line => line.includes('OPENAI_API_KEY'))
      envLocalFirstLine = lines[0] ? `Found: ${lines[0].substring(0, 30)}...` : 'No OPENAI_API_KEY found'
    }
  } catch (error) {
    console.error('Error reading files:', error)
  }
  
  // Manual dotenv load test
  let manualLoadResult = 'not attempted'
  try {
    const dotenv = require('dotenv')
    const result = dotenv.config({ path: '.env.local' })
    manualLoadResult = result.error ? `Error: ${result.error.message}` : 'Success'
  } catch (error: any) {
    manualLoadResult = `Exception: ${error.message}`
  }

  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 20) || 'not found',
    },
    files: {
      projectRoot,
      envExists,
      envLocalExists,
      envFirstLine,
      envLocalFirstLine
    },
    manualDotenvLoad: manualLoadResult,
    processInfo: {
      version: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  })
}