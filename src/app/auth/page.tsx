'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'

interface SessionUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    first_name?: string
    avatar_url?: string
  }
}

// Separate component for parts that use useSearchParams
function AuthContent({
  loading,
  session,
  setError,
  onGoogleSignIn,
  onSignOut
}: {
  loading: boolean
  session: { user: SessionUser } | null
  setError: (error: string | null) => void
  onGoogleSignIn: () => void
  onSignOut: () => void
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorMsg = searchParams.get('error')
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg))
    }
  }, [searchParams, setError])

  return (
    <section className="mx-auto max-w-md space-y-6">
      {session ? (
        <div className="space-y-6">
          <div className="rounded-lg bg-white/5 p-6">
            <div className="flex items-center space-x-4">
              {session.user.user_metadata?.avatar_url && (
                <img
                  src={session.user.user_metadata.avatar_url}
                  alt="Profile"
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div>
                <p className="text-lg font-medium">
                  {session.user.user_metadata?.name || session.user.email}
                </p>
                <p className="text-sm text-gray-400">{session.user.email}</p>
              </div>
            </div>
          </div>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onSignOut}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-red-500/10 py-3 text-lg font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign Out
          </motion.button>
        </div>
      ) : (
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
      )}
    </section>
  )
}

function AuthHeader({ session }: { session: { user: SessionUser } | null }) {
  const getDisplayName = () => {
    if (!session?.user) return 'Welcome Back'
    return `Welcome back, ${session.user.user_metadata?.first_name || 
            session.user.user_metadata?.name || 
            session.user.email?.split('@')[0]}!`
  }

  return (
    <section className="relative h-[40vh] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative flex h-full flex-col items-center justify-center text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-5xl font-bold md:text-6xl"
        >
          {getDisplayName()}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-lg text-gray-300 md:text-xl"
        >
          {session ? 'Manage your account and orders' : 'Sign in to access your account'}
        </motion.p>
      </div>
    </section>
  )
}

// Loading fallback component
function AuthLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
  )
}

export default function Auth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<{ user: SessionUser } | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setSession({ user: session.user })
      }
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session)
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in:', session.user)
        setSession({ user: session.user })
        router.push('/')
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        router.push('/auth')
      }
    })

    return () => subscription?.unsubscribe()
  }, [router])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      setError('Failed to initiate Google sign-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-16">
          <AuthHeader session={session} />
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-md rounded-lg bg-red-500/10 px-4 py-3 text-center text-red-500"
            >
              {error}
            </motion.div>
          )}
          <Suspense fallback={<AuthLoading />}>
            <AuthContent
              loading={loading}
              session={session}
              setError={setError}
              onGoogleSignIn={handleGoogleSignIn}
              onSignOut={handleSignOut}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}