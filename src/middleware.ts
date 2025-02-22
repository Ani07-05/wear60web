import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Refresh session if exists
  if (session) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata.full_name || '',
        avatar_url: user.user_metadata.avatar_url || '',
        role: 'customer', // Default role for new users
        created_at: new Date().toISOString(),
      })
    }
  }

  return res
}