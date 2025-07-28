'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-client'

// TypeScript interfaces
export interface UserProfile {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    preferred_language?: string
    timezone?: string
  }
  app_metadata?: {
    provider?: string
    providers?: string[]
  }
  created_at: string
  updated_at?: string
  last_sign_in_at?: string
}

export interface AuthErrorState {
  message: string
  status?: number
  code?: string
}

export interface AuthState {
  // State
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: AuthErrorState | null

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, options?: { data?: Record<string, any> }) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'github' | 'apple') => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile['user_metadata']>) => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
  
  // Internal actions
  _setUser: (user: User | null) => void
  _setSession: (session: Session | null) => void
  _setProfile: (profile: UserProfile | null) => void
  _setLoading: (loading: boolean) => void
  _setError: (error: AuthErrorState | null) => void
  _setInitialized: (initialized: boolean) => void
  _initialize: () => Promise<void>
}

const supabase = getSupabaseClient()

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        profile: null,
        isAuthenticated: false,
        isLoading: true,
        isInitialized: false,
        error: null,

        // Authentication actions
        signIn: async (email: string, password: string) => {
          try {
            set({ isLoading: true, error: null })
            
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            })

            if (error) {
              throw error
            }

            if (data.user && data.session) {
              get()._setUser(data.user)
              get()._setSession(data.session)
              get()._setProfile({
                id: data.user.id,
                email: data.user.email!,
                user_metadata: data.user.user_metadata,
                app_metadata: data.user.app_metadata,
                created_at: data.user.created_at,
                updated_at: data.user.updated_at,
                last_sign_in_at: data.user.last_sign_in_at,
              })
            }
          } catch (error: any) {
            get()._setError({
              message: error.message || 'Sign in failed',
              status: error.status,
              code: error.code,
            })
            throw error
          } finally {
            set({ isLoading: false })
          }
        },

        signUp: async (email: string, password: string, options = {}) => {
          try {
            set({ isLoading: true, error: null })
            
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options,
            })

            if (error) {
              throw error
            }

            // Note: User might not be confirmed yet, so we don't set them as authenticated
            if (data.user) {
              get()._setUser(data.user)
              if (data.session) {
                get()._setSession(data.session)
                get()._setProfile({
                  id: data.user.id,
                  email: data.user.email!,
                  user_metadata: data.user.user_metadata,
                  app_metadata: data.user.app_metadata,
                  created_at: data.user.created_at,
                  updated_at: data.user.updated_at,
                  last_sign_in_at: data.user.last_sign_in_at,
                })
              }
            }
          } catch (error: any) {
            get()._setError({
              message: error.message || 'Sign up failed',
              status: error.status,
              code: error.code,
            })
            throw error
          } finally {
            set({ isLoading: false })
          }
        },

        signInWithMagicLink: async (email: string) => {
          try {
            set({ isLoading: true, error: null })
            
            const { error } = await supabase.auth.signInWithOtp({
              email,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            })

            if (error) {
              throw error
            }
          } catch (error: any) {
            get()._setError({
              message: error.message || 'Magic link failed',
              status: error.status,
              code: error.code,
            })
            throw error
          } finally {
            set({ isLoading: false })
          }
        },

        signInWithOAuth: async (provider: 'google' | 'github' | 'apple') => {
          try {
            set({ isLoading: true, error: null })
            
            const { error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
              },
            })

            if (error) {
              throw error
            }
          } catch (error: any) {
            get()._setError({
              message: error.message || `${provider} sign in failed`,
              status: error.status,
              code: error.code,
            })
            throw error
          } finally {
            set({ isLoading: false })
          }
        },

        signOut: async () => {
          try {
            set({ isLoading: true, error: null })
            
            const { error } = await supabase.auth.signOut()

            if (error) {
              throw error
            }

            // Clear all auth state
            get()._setUser(null)
            get()._setSession(null)
            get()._setProfile(null)
          } catch (error: any) {
            get()._setError({
              message: error.message || 'Sign out failed',
              status: error.status,
              code: error.code,
            })
            throw error
          } finally {
            set({ isLoading: false })
          }
        },

        resetPassword: async (email: string) => {
          try {
            set({ isLoading: true, error: null })
            
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) {
              throw error
            }
          } catch (error: any) {
            get()._setError({
              message: error.message || 'Password reset failed',
              status: error.status,
              code: error.code,
            })
            throw error
          } finally {
            set({ isLoading: false })
          }
        },

        updatePassword: async (password: string) => {
          try {
            set({ isLoading: true, error: null })
            
            const { data, error } = await supabase.auth.updateUser({
              password,
            })

            if (error) {
              throw error
            }

            if (data.user) {
              get()._setUser(data.user)
              get()._setProfile({
                id: data.user.id,
                email: data.user.email!,
                user_metadata: data.user.user_metadata,
                app_metadata: data.user.app_metadata,
                created_at: data.user.created_at,
                updated_at: data.user.updated_at,
                last_sign_in_at: data.user.last_sign_in_at,
              })
            }
          } catch (error: any) {
            get()._setError({
              message: error.message || 'Password update failed',
              status: error.status,
              code: error.code,
            })
            throw error
          } finally {
            set({ isLoading: false })
          }
        },

        updateProfile: async (updates: Partial<UserProfile['user_metadata']>) => {
          try {
            set({ isLoading: true, error: null })
            
            const { data, error } = await supabase.auth.updateUser({
              data: updates,
            })

            if (error) {
              throw error
            }

            if (data.user) {
              get()._setUser(data.user)
              get()._setProfile({
                id: data.user.id,
                email: data.user.email!,
                user_metadata: data.user.user_metadata,
                app_metadata: data.user.app_metadata,
                created_at: data.user.created_at,
                updated_at: data.user.updated_at,
                last_sign_in_at: data.user.last_sign_in_at,
              })
            }
          } catch (error: any) {
            get()._setError({
              message: error.message || 'Profile update failed',
              status: error.status,
              code: error.code,
            })
            throw error
          } finally {
            set({ isLoading: false })
          }
        },

        refreshSession: async () => {
          try {
            set({ isLoading: true, error: null })
            
            const { data, error } = await supabase.auth.refreshSession()

            if (error) {
              throw error
            }

            if (data.session && data.user) {
              get()._setSession(data.session)
              get()._setUser(data.user)
              get()._setProfile({
                id: data.user.id,
                email: data.user.email!,
                user_metadata: data.user.user_metadata,
                app_metadata: data.user.app_metadata,
                created_at: data.user.created_at,
                updated_at: data.user.updated_at,
                last_sign_in_at: data.user.last_sign_in_at,
              })
            }
          } catch (error: any) {
            get()._setError({
              message: error.message || 'Session refresh failed',
              status: error.status,
              code: error.code,
            })
            // On refresh failure, clear auth state
            get()._setUser(null)
            get()._setSession(null)
            get()._setProfile(null)
          } finally {
            set({ isLoading: false })
          }
        },

        clearError: () => {
          set({ error: null })
        },

        // Internal state setters
        _setUser: (user: User | null) => {
          set({ 
            user, 
            isAuthenticated: !!user 
          })
        },

        _setSession: (session: Session | null) => {
          set({ session })
        },

        _setProfile: (profile: UserProfile | null) => {
          set({ profile })
        },

        _setLoading: (isLoading: boolean) => {
          set({ isLoading })
        },

        _setError: (error: AuthErrorState | null) => {
          set({ error })
        },

        _setInitialized: (isInitialized: boolean) => {
          set({ isInitialized })
        },

        // Initialize auth state
        _initialize: async () => {
          try {
            set({ isLoading: true, error: null })

            // Check for existing session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
              console.error('Error getting session:', sessionError)
              get()._setError({
                message: sessionError.message,
                status: sessionError.status,
                code: sessionError.name,
              })
              return
            }

            if (session && session.user) {
              // Get fresh user data
              const { data: { user }, error: userError } = await supabase.auth.getUser()
              
              if (userError) {
                console.error('Error getting user:', userError)
                get()._setError({
                  message: userError.message,
                  status: userError.status,
                  code: userError.name,
                })
                return
              }

              if (user) {
                get()._setUser(user)
                get()._setSession(session)
                get()._setProfile({
                  id: user.id,
                  email: user.email!,
                  user_metadata: user.user_metadata,
                  app_metadata: user.app_metadata,
                  created_at: user.created_at,
                  updated_at: user.updated_at,
                  last_sign_in_at: user.last_sign_in_at,
                })
              }
            } else {
              // No session, clear auth state
              get()._setUser(null)
              get()._setSession(null)
              get()._setProfile(null)
            }

            // Set up auth state change listener
            supabase.auth.onAuthStateChange(async (event, session) => {
              console.log('[AuthStore] Auth state change:', event, !!session?.user)
              
              if (session && session.user) {
                get()._setUser(session.user)
                get()._setSession(session)
                get()._setProfile({
                  id: session.user.id,
                  email: session.user.email!,
                  user_metadata: session.user.user_metadata,
                  app_metadata: session.user.app_metadata,
                  created_at: session.user.created_at,
                  updated_at: session.user.updated_at,
                  last_sign_in_at: session.user.last_sign_in_at,
                })
              } else {
                get()._setUser(null)
                get()._setSession(null)
                get()._setProfile(null)
              }

              // Handle specific events
              if (event === 'SIGNED_OUT') {
                get().clearError()
              }
              
              if (event === 'TOKEN_REFRESHED') {
                console.log('[AuthStore] Token refreshed successfully')
              }
            })

          } catch (error: any) {
            console.error('[AuthStore] Initialization error:', error)
            get()._setError({
              message: error.message || 'Auth initialization failed',
            })
          } finally {
            set({ isLoading: false, isInitialized: true })
          }
        },
      }),
      {
        name: 'auth-store',
        // Only persist minimal, non-sensitive data
        partialize: (state) => ({
          isInitialized: state.isInitialized,
        }),
        version: 1,
      }
    ),
    {
      name: 'auth-store',
    }
  )
)

// Initialize the store when it's first created
if (typeof window !== 'undefined') {
  useAuthStore.getState()._initialize()
}

// Convenience hooks for common patterns
export const useAuth = () => {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  }
}

export const useAuthActions = () => {
  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)
  const signOut = useAuthStore((state) => state.signOut)
  const signInWithMagicLink = useAuthStore((state) => state.signInWithMagicLink)
  const signInWithOAuth = useAuthStore((state) => state.signInWithOAuth)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const updatePassword = useAuthStore((state) => state.updatePassword)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const refreshSession = useAuthStore((state) => state.refreshSession)
  const clearError = useAuthStore((state) => state.clearError)
  
  return {
    signIn,
    signUp,
    signOut,
    signInWithMagicLink,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    clearError,
  }
}

export const useUserProfile = () => {
  const profile = useAuthStore((state) => state.profile)
  const session = useAuthStore((state) => state.session)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  
  return {
    profile,
    session,
    updateProfile,
  }
}

export default useAuthStore