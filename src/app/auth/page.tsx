// src/app/auth/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface SessionUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    first_name?: string
    avatar_url?: string
  }
}

function AuthHeader({ session }: { session: { user: SessionUser } | null }) {
  const getDisplayName = () => {
    if (!session?.user) return 'Welcome'
    return `Welcome back, ${session.user.user_metadata?.first_name || 
            session.user.user_metadata?.name || 
            session.user.email?.split('@')[0]}!`
  }

  return (
    <section className="relative h-[40vh] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur">
      <div className="absolute inset-0 bg-black/40" />
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
          {session ? 'Sign in Manage your products and orders' : 'Manage your products and orders'}
        </motion.p>
      </div>
    </section>
  )
}

function AuthContent({
  loading,
  session,
  setError,
  onSignOut
}: {
  loading: boolean
  session: { user: SessionUser } | null
  setError: (error: string | null) => void
  onSignOut: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorMsg = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (errorMsg) {
      console.error('Auth Error:', errorMsg, errorDescription)
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
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Sign Out'
            )}
          </motion.button>
        </div>
      ) : (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push('/auth/register')}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-white/10 py-3 text-lg font-medium transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Manage Your Products and Orders'
          )}
        </motion.button>
      )}
    </section>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
}

export default function AuthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<{ user: SessionUser } | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session?.user) {
          console.log('Existing session found:', session.user.id)
          setSession({ user: session.user })
        } else {
          console.log('No existing session')
        }
      } catch (err) {
        console.error('Session check error:', err)
        setError('Failed to check session status')
      }
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          console.log('Sign in successful:', {
            id: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata.provider
          })
          setSession({ user: session.user })
          router.push('/')
        } catch (err) {
          console.error('Post sign-in error:', err)
          setError('Error processing sign-in')
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        setSession(null)
        router.push('/auth')
      }
    })

    return () => {
      console.log('Cleaning up auth subscriptions')
      subscription?.unsubscribe()
    }
  }, [router])

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
          <Suspense fallback={<LoadingFallback />}>
            <AuthContent
              loading={loading}
              session={session}
              setError={setError}
              onSignOut={handleSignOut}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
