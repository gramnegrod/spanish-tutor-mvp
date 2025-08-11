import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Rate limiting store (in-memory for MVP, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security headers to add to all API responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()'
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

// Default rate limit: 100 requests per minute
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100
}

// Check rate limit
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs }
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  // Increment count
  record.count++
  return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime }
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

// Input sanitization
export function sanitizeText(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Limit length to prevent abuse
  const maxLength = 10000
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue
      }
      sanitized[sanitizeText(key)] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

// Request body size validation
export async function validateRequestSize(
  request: NextRequest,
  maxSizeBytes: number = 1048576 // 1MB default
): Promise<{ valid: boolean; error?: string }> {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return { valid: false, error: `Request body too large. Maximum size: ${maxSizeBytes} bytes` }
  }
  
  return { valid: true }
}

// CORS validation
export function validateCORS(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  
  if (!origin) {
    // Same-origin requests don't have origin header
    return true
  }
  
  return allowedOrigins.includes(origin)
}

// Create a secure response with security headers
export function createSecureResponse(
  body: any,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(body, init)
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

// Validate request with schema
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    const sanitized = sanitizeObject(body)
    const parsed = schema.parse(sanitized)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Invalid request body' }
  }
}

// API route wrapper with security checks
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    rateLimit?: RateLimitConfig
    maxBodySize?: number
    requireAuth?: boolean
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check CORS
      if (!validateCORS(request)) {
        return createSecureResponse(
          { error: 'CORS policy violation' },
          { status: 403 }
        )
      }

      // Check request size
      const sizeCheck = await validateRequestSize(request, options?.maxBodySize)
      if (!sizeCheck.valid) {
        return createSecureResponse(
          { error: sizeCheck.error },
          { status: 413 }
        )
      }

      // Check rate limit
      const clientId = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'anonymous'
      const rateLimit = checkRateLimit(clientId, options?.rateLimit)
      
      if (!rateLimit.allowed) {
        return createSecureResponse(
          { error: 'Too many requests' },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': (options?.rateLimit?.maxRequests || DEFAULT_RATE_LIMIT.maxRequests).toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
            }
          }
        )
      }

      // Execute handler
      const response = await handler(request)
      
      // Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', (options?.rateLimit?.maxRequests || DEFAULT_RATE_LIMIT.maxRequests).toString())
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())
      
      return response
    } catch (error) {
      console.error('Security middleware error:', error)
      return createSecureResponse(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}