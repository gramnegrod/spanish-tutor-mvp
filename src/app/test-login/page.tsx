'use client'

import { useState } from 'react'

export default function TestLoginPage() {
  const [status, setStatus] = useState('')
  const [email, setEmail] = useState('gramnegrod@gmail.com')
  const [password, setPassword] = useState('')

  async function testLogin() {
    setStatus('Starting login...')
    
    try {
      // Import Supabase
      const { supabase } = await import('@/lib/supabase')
      
      setStatus('Supabase imported, attempting login...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })
      
      if (error) {
        setStatus(`Error: ${error.message}`)
        return
      }
      
      if (data.user) {
        setStatus(`Success! User: ${data.user.email}. Checking auth...`)
        
        // Check if auth is working
        setTimeout(async () => {
          const response = await fetch('/api/test-auth')
          const authData = await response.json()
          setStatus(`Auth check: ${JSON.stringify(authData, null, 2)}`)
          
          if (authData.user) {
            setTimeout(() => {
              window.location.href = '/practice'
            }, 2000)
          }
        }, 1000)
      }
    } catch (e: any) {
      setStatus(`Exception: ${e.message}`)
    }
  }

  async function testSignup() {
    setStatus('Starting signup...')
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
      })
      
      if (error) {
        setStatus(`Signup Error: ${error.message}`)
        return
      }
      
      if (data.user) {
        setStatus(`Signup Success! Check your email for confirmation.`)
      }
    } catch (e: any) {
      setStatus(`Exception: ${e.message}`)
    }
  }

  return (
    <div style={{ padding: '50px' }}>
      <h1>Test Login Page</h1>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '5px', marginRight: '10px', width: '250px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '5px', marginRight: '10px', width: '250px' }}
        />
      </div>
      
      <button 
        onClick={testLogin}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          backgroundColor: 'blue',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Test Login
      </button>
      
      <button 
        onClick={testSignup}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          backgroundColor: 'green',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Test Signup
      </button>
      
      <div style={{ marginTop: '20px', fontFamily: 'monospace' }}>
        Status: {status}
      </div>
    </div>
  )
}