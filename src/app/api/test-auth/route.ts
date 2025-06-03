import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    
    // First check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Then get user if session exists
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      session: session ? { 
        user: { id: session.user.id, email: session.user.email },
        expires_at: session.expires_at 
      } : null,
      sessionError: sessionError?.message,
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError?.message,
      cookies: cookieStore.getAll().map(c => ({ 
        name: c.name, 
        value: c.value.substring(0, 20) + '...' 
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}