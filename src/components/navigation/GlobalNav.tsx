'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Home, Users, MessageSquare, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

export function GlobalNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Don't show nav on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null
  }
  
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { 
      href: '/practice-v2/select-npc', 
      label: 'Browse Characters', 
      icon: Users
    },
    { href: '/dashboard', label: 'Dashboard', icon: MessageSquare, requiresAuth: true },
  ]
  
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌮</span>
            <span className="font-bold text-xl hidden sm:block">Spanish Tutor</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'default' : 'ghost'}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            
            {user && (
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="text-gray-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 space-y-1">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </div>
                </Link>
              )
            })}
            
            {user && (
              <button
                onClick={() => {
                  signOut()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}