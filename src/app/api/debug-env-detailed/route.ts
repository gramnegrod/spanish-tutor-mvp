import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const cwd = process.cwd()
  
  // Check which env files exist
  const envFiles = {
    '.env': existsSync(join(cwd, '.env')),
    '.env.local': existsSync(join(cwd, '.env.local')),
    '.env.development': existsSync(join(cwd, '.env.development')),
    '.env.development.local': existsSync(join(cwd, '.env.development.local')),
    '.env.production': existsSync(join(cwd, '.env.production')),
    '.env.production.local': existsSync(join(cwd, '.env.production.local')),
  }
  
  // Try to read .env and .env.local directly
  let dotEnvContent = ''
  let dotEnvLocalContent = ''
  
  try {
    if (envFiles['.env']) {
      dotEnvContent = readFileSync(join(cwd, '.env'), 'utf-8')
        .split('\n')
        .filter(line => line.includes('OPENAI'))
        .map(line => line.substring(0, 50) + '...')
        .join('\n')
    }
  } catch (e) {
    dotEnvContent = 'Error reading .env'
  }
  
  try {
    if (envFiles['.env.local']) {
      dotEnvLocalContent = readFileSync(join(cwd, '.env.local'), 'utf-8')
        .split('\n')
        .filter(line => line.includes('OPENAI'))
        .map(line => line.substring(0, 50) + '...')
        .join('\n')
    }
  } catch (e) {
    dotEnvLocalContent = 'Error reading .env.local'
  }
  
  // Get all environment variables
  const allEnvVars = Object.keys(process.env)
    .filter(key => key.includes('OPENAI') || key.includes('NEXT') || key === 'NODE_ENV')
    .reduce((acc, key) => {
      acc[key] = {
        exists: !!process.env[key],
        length: process.env[key]?.length || 0,
        preview: process.env[key]?.substring(0, 20) + '...' || 'undefined'
      }
      return acc
    }, {} as Record<string, any>)
  
  return NextResponse.json({
    cwd,
    nodeVersion: process.version,
    nodeEnv: process.env.NODE_ENV,
    envFiles,
    dotEnvContent,
    dotEnvLocalContent,
    openaiKey: {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY?.length || 0,
      preview: process.env.OPENAI_API_KEY?.substring(0, 20) + '...' || 'undefined',
      startsWithSK: process.env.OPENAI_API_KEY?.startsWith('sk-') || false
    },
    publicOpenaiKey: {
      exists: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      length: process.env.NEXT_PUBLIC_OPENAI_API_KEY?.length || 0,
      preview: process.env.NEXT_PUBLIC_OPENAI_API_KEY?.substring(0, 20) + '...' || 'undefined'
    },
    allEnvVars,
    nextVersion: require('next/package.json').version,
    timestamp: new Date().toISOString()
  })
}