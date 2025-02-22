"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useCart } from "@/contexts/CartContext"

interface User {
  email: string;
  user_metadata?: {
    first_name?: string;
  };
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const { cartCount } = useCart()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUser({
          email: session.user.email,
          user_metadata: session.user.user_metadata
        })
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUser({
          email: session.user.email,
          user_metadata: session.user.user_metadata
        })
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold font-mono hover:text-primary transition-colors">
            Wear60
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <span className="text-sm text-gray-300">
                Welcome, {user.user_metadata?.first_name || user.email.split('@')[0]}!
              </span>
            )}
            {[
              { name: 'Shop', href: '/shop' },
              { name: 'About', href: '/about' },
              { name: 'Cart', href: '/cart' }
            ].map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium relative"
              >
                {item.name}
                {item.name === 'Cart' && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}