'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      await signIn(email, password)
      // AuthContext will handle redirect on successful sign in
    } catch (error) {
      console.error('Login error:', error)
      setError((error as Error).message || 'An error occurred during sign in')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ¡Bienvenido!
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to start practicing Mexican Spanish
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
            <Link href="/practice-no-auth" className="w-full">
              <Button type="button" variant="outline" className="w-full">
                Continue without account
              </Button>
            </Link>
            <p className="text-sm text-center text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}