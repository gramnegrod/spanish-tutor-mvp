'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, Home } from 'lucide-react'

export function GuestModeHeader() {
  const router = useRouter()

  return (
    <div className="w-full border-b bg-gradient-to-r from-orange-50 to-red-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <span className="text-sm text-gray-600 font-medium">
            🎯 Guest Mode
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">
            Ready to save your progress?
          </span>
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
          <Button
            onClick={() => router.push('/register')}
            size="sm"
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <UserPlus className="h-4 w-4" />
            Sign Up Free
          </Button>
        </div>
      </div>
    </div>
  )
}