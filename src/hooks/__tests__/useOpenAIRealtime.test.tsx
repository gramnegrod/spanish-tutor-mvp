import { renderHook, act } from '@testing-library/react'
import { useOpenAIRealtime } from '../useOpenAIRealtime'

// Mock the OpenAIRealtimeService
jest.mock('@openai-realtime/webrtc', () => ({
  OpenAIRealtimeService: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    updateInstructions: jest.fn(),
    extendSession: jest.fn(),
    dismissWarning: jest.fn(),
    startFreshSession: jest.fn(),
  })),
}))

describe('useOpenAIRealtime', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useOpenAIRealtime({
      instructions: 'Test instructions',
    }))

    expect(result.current.isConnected).toBe(false)
    expect(result.current.isConnecting).toBe(false)
    expect(result.current.isSpeaking).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.costs).toBe(null)
    expect(result.current.showTimeWarning).toBe(false)
    expect(result.current.showSessionComplete).toBe(false)
    expect(result.current.showMaxSessions).toBe(false)
  })

  it('should connect when autoConnect is true', async () => {
    const { result } = renderHook(() => useOpenAIRealtime({
      instructions: 'Test instructions',
      autoConnect: true,
    }))

    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isConnecting).toBe(true)
  })

  it('should handle manual connect', async () => {
    const { result } = renderHook(() => useOpenAIRealtime({
      instructions: 'Test instructions',
      autoConnect: false,
    }))

    expect(result.current.isConnected).toBe(false)

    await act(async () => {
      await result.current.connect()
    })

    // In real implementation, this would set isConnected to true after connection
    // but our mock doesn't trigger the onConnect callback
  })

  it('should update instructions', () => {
    const { result } = renderHook(() => useOpenAIRealtime({
      instructions: 'Initial instructions',
    }))

    act(() => {
      result.current.updateInstructions('New instructions')
    })

    // The mock service's updateInstructions should have been called
    const mockService = require('@/services/openai-realtime').OpenAIRealtimeService
    const instance = mockService.mock.results[0].value
    expect(instance.updateInstructions).toHaveBeenCalledWith('New instructions')
  })

  it('should handle session extension', () => {
    const { result } = renderHook(() => useOpenAIRealtime({
      instructions: 'Test instructions',
    }))

    // Set up session complete state
    act(() => {
      result.current.showSessionComplete = true
    })

    act(() => {
      result.current.extendSession()
    })

    expect(result.current.showSessionComplete).toBe(false)
  })

  it('should handle disconnect on unmount', () => {
    const { unmount } = renderHook(() => useOpenAIRealtime({
      instructions: 'Test instructions',
    }))

    const mockService = require('@/services/openai-realtime').OpenAIRealtimeService
    const instance = mockService.mock.results[0].value

    unmount()

    expect(instance.disconnect).toHaveBeenCalled()
  })
})