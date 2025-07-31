import { NextRequest } from 'next/server'
import { POST } from '../route'
import { getSupabaseClient } from '@/lib/supabase-server'
import { handleRateLimiting } from '@/lib/rate-limiting'

// Mock dependencies
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/rate-limiting')
jest.mock('openai')

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  }
}

describe('/api/ephemeral-key', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(handleRateLimiting as jest.Mock).mockResolvedValue({ success: true })
  })

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/ephemeral-key', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle rate limiting', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      ;(handleRateLimiting as jest.Mock).mockResolvedValue({ 
        success: false,
        error: 'Rate limit exceeded',
        reset: new Date(Date.now() + 60000).toISOString()
      })

      const request = new NextRequest('http://localhost:3000/api/ephemeral-key', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
      expect(data.reset).toBeDefined()
    })

    it('should create ephemeral key when authenticated and not rate limited', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockEphemeralKey = 'ephemeral-key-123'

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock OpenAI response
      const mockOpenAI = {
        beta: {
          realtime: {
            sessions: {
              createEphemeralKey: jest.fn().mockResolvedValue({
                client_secret: { value: mockEphemeralKey }
              })
            }
          }
        }
      }

      jest.doMock('openai', () => ({
        default: jest.fn(() => mockOpenAI)
      }))

      const request = new NextRequest('http://localhost:3000/api/ephemeral-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('ephemeralKey')
      expect(data.ephemeralKey).toBe(mockEphemeralKey)
      expect(handleRateLimiting).toHaveBeenCalledWith('ephemeral-key', mockUser.id)
    })

    it('should handle OpenAI API errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock OpenAI error
      const mockOpenAI = {
        beta: {
          realtime: {
            sessions: {
              createEphemeralKey: jest.fn().mockRejectedValue(
                new Error('OpenAI API error')
              )
            }
          }
        }
      }

      jest.doMock('openai', () => ({
        default: jest.fn(() => mockOpenAI)
      }))

      const request = new NextRequest('http://localhost:3000/api/ephemeral-key', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create ephemeral key')
    })

    it('should validate request body when provided', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockEphemeralKey = 'ephemeral-key-123'

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock OpenAI response
      const mockOpenAI = {
        beta: {
          realtime: {
            sessions: {
              createEphemeralKey: jest.fn().mockResolvedValue({
                client_secret: { value: mockEphemeralKey }
              })
            }
          }
        }
      }

      jest.doMock('openai', () => ({
        default: jest.fn(() => mockOpenAI)
      }))

      const request = new NextRequest('http://localhost:3000/api/ephemeral-key', {
        method: 'POST',
        body: JSON.stringify({
          voice: 'alloy',
          model: 'gpt-4o-realtime-preview-2024-10-01'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      await response.json()

      expect(response.status).toBe(200)
      expect(mockOpenAI.beta.realtime.sessions.createEphemeralKey).toHaveBeenCalledWith({
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: 'alloy'
      })
    })
  })
})