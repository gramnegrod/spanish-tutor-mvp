import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple rate limiting using memory (use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
    const now = Date.now()
    
    const userLimit = rateLimit.get(ip)
    
    if (userLimit && now < userLimit.resetTime) {
      if (userLimit.count >= 10) { // 10 requests per minute
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }
      userLimit.count++
    } else {
      rateLimit.set(ip, { count: 1, resetTime: now + 60000 }) // 1 minute window
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}