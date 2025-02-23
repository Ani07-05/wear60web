// wear60web/src/app/delivery/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AuthError {
  message: string;
}

export default function DeliveryLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
  
    try {
      // First, attempt to sign in
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
  
      if (signInError) throw signInError
  
      // Then, verify if the user is a delivery partner
      const { data: deliveryPartner, error: roleError } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user?.id)
        .single()
  
      if (roleError || !deliveryPartner) {
        // If not a delivery partner, sign them out and show error
        await supabase.auth.signOut()
        throw new Error('Unauthorized access. Please contact support if you think this is a mistake.')
      }
  
      // If all checks pass, redirect to delivery portal
      router.push('/delivery')
    } catch (err: unknown) {
      if (err instanceof Error || isAuthError(err)) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }
  // Type guard for auth error
  function isAuthError(error: unknown): error is AuthError {
    return typeof error === 'object' && error !== null && 'message' in error
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 bg-gray-800/50 rounded-lg shadow-lg backdrop-blur-sm"
      >
        <h1 className="text-3xl font-bold text-center mb-8">Delivery Partner Login</h1>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}