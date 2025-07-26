import { NextResponse } from 'next/server'

/**
 * Safe error response that doesn't expose internal details
 */
export function errorResponse(
  message: string = 'An error occurred',
  status: number = 500,
  error?: unknown
) {
  // Log the actual error server-side
  if (error) {
    console.error(`[API Error] ${message}:`, error)
  }
  
  // Return generic message to client
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * Wrap API route handlers with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return errorResponse('Internal server error', 500, error)
    }
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `Missing required field: ${field}`
    }
  }
  return null
}