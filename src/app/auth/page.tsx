'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-16">
      <AuthHeader />
      <AuthContent
        loading={loading}
        onGoogleSignIn={handleGoogleSignIn}
      />
    </div>
  )
}

function AuthHeader() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
    })
  }, [])

  return (
    <section className="relative h-[40vh] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative flex h-full flex-col items-center justify-center text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-5xl font-bold md:text-6xl"
        >
          {user ? `Welcome back, ${user.user_metadata?.first_name || user.email?.split('@')[0]}!` : 'Welcome Back'}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-lg text-gray-300 md:text-xl"
        >
          {user ? 'Manage your account and orders' : 'Sign in to access your account'}
        </motion.p>
      </div>
    </section>
  )
}

function AuthContent({
  loading,
  onGoogleSignIn
}: {
  loading: boolean
  onGoogleSignIn: () => void
}) {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onGoogleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-white/10 py-3 text-lg font-medium transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </motion.button>
    </section>
  )
}