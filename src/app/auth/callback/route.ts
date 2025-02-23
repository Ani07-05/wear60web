// wear60web/src/app/auth/callback/route.ts
// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Log incoming request details (helpful for debugging)
    console.log('Auth callback URL:', requestUrl.toString())
    console.log('Auth code present:', !!code)
    
    // Handle OAuth errors
    if (error || error_description) {
      console.error('OAuth error:', error, error_description)
      return NextResponse.redirect(
        new URL(
          `/auth?error=${encodeURIComponent(error_description || error || 'Unknown error')}`,
          requestUrl.origin
        )
      )
    }

    // Verify auth code exists
    if (!code) {
      console.error('No code present in callback')
      return NextResponse.redirect(
        new URL('/auth?error=no_code', requestUrl.origin)
      )
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange code for session
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Session exchange error:', sessionError)
      throw sessionError
    }

    console.log('Session exchange successful:', !!data.session)

    // Redirect to home page on success
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  } catch (error) {
    console.error('Error in auth callback:', error)
    
    // Ensure we have a valid URL even if request object is somehow invalid
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      new URL('/auth?error=session_exchange_failed', baseUrl)
    )
  }
}

