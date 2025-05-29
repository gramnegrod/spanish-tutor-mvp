import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '@/lib/supabase'

// Test component that uses the auth hook
function TestComponent() {
  const { user, loading, signIn, signOut } = useAuth()
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {user ? (
        <>
          <p>Logged in as: {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <p>Not logged in</p>
          <button onClick={() => signIn('test@example.com', 'password')}>
            Sign In
          </button>
        </>
      )}
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show not logged in when no session', async () => {
    // Mock no session
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
  })

  it('should show user email when logged in', async () => {
    // Mock active session
    const mockUser = { email: 'test@example.com', id: '123' }
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: { user: mockUser } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Logged in as: test@example.com')).toBeInTheDocument()
    })
  })

  it('should handle sign in', async () => {
    const user = userEvent.setup()
    
    // Mock no initial session
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null }
    })
    
    // Mock successful sign in
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Sign In'))
    
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
  })

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation()
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    spy.mockRestore()
  })
})