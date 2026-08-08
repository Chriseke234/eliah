import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // -------------------------------------------------------------------------
  // Auth guard: redirect unauthenticated users hitting /app/* to /login
  // -------------------------------------------------------------------------
  if (pathname.startsWith('/app')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Determine user role (prefer metadata, fallback to DB query)
    let role = user.user_metadata?.role as 'ADMIN' | 'CLIENT' | undefined

    if (!role) {
      try {
        const { data: profileData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profileData?.role) {
          role = profileData.role as 'ADMIN' | 'CLIENT'
        }
      } catch {
        // Fallback gracefully if DB query fails in edge runtime
      }
    }

    // If user lands on /app root, redirect to their role's dashboard (default to /app/client)
    if (pathname === '/app' || pathname === '/app/') {
      const dest = role === 'ADMIN' ? '/app/admin' : '/app/client'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // Prevent clients from accessing admin routes (ONLY if role is explicitly CLIENT)
    if (pathname.startsWith('/app/admin') && role === 'CLIENT') {
      return NextResponse.redirect(new URL('/app/client', request.url))
    }

    // Prevent admins from accessing client routes (ONLY if role is explicitly ADMIN)
    if (pathname.startsWith('/app/client') && role === 'ADMIN') {
      return NextResponse.redirect(new URL('/app/admin', request.url))
    }
  }

  // -------------------------------------------------------------------------
  // Redirect already-authenticated users away from /login and /signup
  // -------------------------------------------------------------------------
  if ((pathname === '/login' || pathname === '/signup') && user) {
    let role = user.user_metadata?.role as 'ADMIN' | 'CLIENT' | undefined

    if (!role) {
      try {
        const { data: profileData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profileData?.role) {
          role = profileData.role as 'ADMIN' | 'CLIENT'
        }
      } catch {
        // Fallback
      }
    }

    const dest = role === 'ADMIN' ? '/app/admin' : '/app/client'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

// Export proxy as an alias for Next.js proxy/middleware compatibility
export const proxy = middleware

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
