import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') ?? '/app/client'

  const supabase = await createClient()

  // 1. Handle PKCE authorization code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[Auth Callback Error - Code Exchange]:', error.message)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }
  }

  // 2. Handle OTP / Token Hash exchange (for direct magic link hashes)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (error) {
      console.error('[Auth Callback Error - Token Hash]:', error.message)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }
  }

  // 3. Retrieve authenticated user to determine destination
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    let role = user.user_metadata?.role as string | undefined

    if (!role) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      role = profile?.role
    }

    // Determine destination route (defaults to /app/client for clients)
    const destination = next.startsWith('/app')
      ? next
      : role === 'ADMIN'
      ? '/app/admin'
      : '/app/client'

    return NextResponse.redirect(new URL(destination, request.url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
