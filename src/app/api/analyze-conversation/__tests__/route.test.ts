import { NextRequest } from 'next/server'
import { POST } from '../route'
import { getSupabaseClient } from '@/lib/supabase-server'
import { analyzeConversation } from '@/lib/conversation-analysis'

// Mock dependencies
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/conversation-analysis')

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}

describe('/api/analyze-conversation', () => {
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

      const request = new NextRequest('http://localhost:3000/api/analyze-conversation', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          transcript: []
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when conversationId is missing', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analyze-conversation', {
        method: 'POST',
        body: JSON.stringify({
          transcript: []
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Conversation ID and transcript are required')
    })

    it('should return 400 when transcript is missing', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analyze-conversation', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Conversation ID and transcript are required')
    })

    it('should successfully analyze conversation', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockAnalysis = {
        keyLearnings: ['learned greeting', 'ordering food'],
        grammarCorrections: [],
        vocabularyUsed: ['hola', 'tacos', 'por favor'],
        pronunciationNotes: [],
        conversationFlow: 'good',
        recommendedNext: 'Practice numbers',
        overallRating: 85
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      ;(analyzeConversation as jest.Mock).mockResolvedValue(mockAnalysis)

      const mockTranscript = [
        { speaker: 'user', text: 'Hola', timestamp: new Date() },
        { speaker: 'assistant', text: '¡Hola! ¿Qué desea ordenar?', timestamp: new Date() },
        { speaker: 'user', text: 'Dos tacos por favor', timestamp: new Date() }
      ]

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'conv-123', analysis: mockAnalysis },
              error: null
            })
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      })

      const request = new NextRequest('http://localhost:3000/api/analyze-conversation', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          transcript: mockTranscript
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analysis).toEqual(mockAnalysis)
      expect(analyzeConversation).toHaveBeenCalledWith(mockTranscript)
      expect(mockUpdate).toHaveBeenCalledWith({
        analysis: mockAnalysis,
        analyzed_at: expect.any(String)
      })
    })

    it('should handle analysis errors gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      ;(analyzeConversation as jest.Mock).mockRejectedValue(
        new Error('OpenAI API error')
      )

      const request = new NextRequest('http://localhost:3000/api/analyze-conversation', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          transcript: [{ speaker: 'user', text: 'Hola', timestamp: new Date() }]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to analyze conversation')
    })

    it('should handle database update errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockAnalysis = {
        keyLearnings: ['test'],
        grammarCorrections: [],
        vocabularyUsed: ['hola'],
        pronunciationNotes: [],
        conversationFlow: 'good',
        recommendedNext: 'Practice more',
        overallRating: 75
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      ;(analyzeConversation as jest.Mock).mockResolvedValue(mockAnalysis)

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error')
            })
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      })

      const request = new NextRequest('http://localhost:3000/api/analyze-conversation', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          transcript: [{ speaker: 'user', text: 'Hola', timestamp: new Date() }]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save analysis')
    })

    it('should handle invalid JSON in request body', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/analyze-conversation', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request body')
    })
  })
})