import { NextRequest } from 'next/server'
import { POST } from '../route'
import { getSupabaseClient } from '@/lib/supabase-server'

// Mock dependencies
jest.mock('@/lib/supabase-server')
jest.mock('openai')

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

describe('/api/session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/session', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should create session when user is authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSessionToken = 'test-session-token'

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
                client_secret: { value: mockSessionToken }
              })
            }
          }
        }
      }

      jest.doMock('openai', () => ({
        default: jest.fn(() => mockOpenAI)
      }))

      const request = new NextRequest('http://localhost:3000/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('clientSecret')
      expect(data.clientSecret.value).toBe(mockSessionToken)
    })

    it('should handle OpenAI API errors gracefully', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/session', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create session')
    })

    it('should handle database errors when saving session', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock database error
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      })

      const request = new NextRequest('http://localhost:3000/api/session', {
        method: 'POST'
      })

      const response = await POST(request)
      
      // Should still return 200 as session creation is not critical
      expect(response.status).toBe(200)
    })
  })
})