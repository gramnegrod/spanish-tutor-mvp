import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple middleware without NextAuth for now
export function middleware(request: NextRequest) {
  // For now, allow all requests to pass through
  // You can add your own auth logic here later
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/practice/:path*"],
}