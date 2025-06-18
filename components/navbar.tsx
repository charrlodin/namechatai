// Navigation bar component for Name Check AI
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <header 
      className={`w-full py-4 sticky top-0 z-50 border-b border-gray-800 transition-colors duration-200 ${
        scrolled ? 'bg-black shadow-md' : 'bg-black/95'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-lg font-medium">
            Name Check AI
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm font-normal text-gray-300 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-normal text-gray-300 hover:text-white transition-colors">
            Login
          </Link>
          <Button 
            variant="accent" 
            className="text-sm font-normal h-9 rounded" 
            asChild
          >
            <Link href="/register">Register</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
