import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

    // Fetch the user's role from public.users
    const { data: profileData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileData as { role: 'ADMIN' | 'CLIENT' } | null
    const role = profile?.role

    // If user lands on /app (root), redirect to their dashboard
    if (pathname === '/app' || pathname === '/app/') {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/app/admin', request.url))
      }
      return NextResponse.redirect(new URL('/app/client', request.url))
    }

    // Prevent clients from accessing admin routes
    if (pathname.startsWith('/app/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/app/client', request.url))
    }

    // Prevent admins from accessing client routes
    if (pathname.startsWith('/app/client') && role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/app/admin', request.url))
    }
  }

  // -------------------------------------------------------------------------
  // Redirect already-authenticated users away from /login and /signup
  // -------------------------------------------------------------------------
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const { data: profileData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileData as { role: 'ADMIN' | 'CLIENT' } | null
    const role = profile?.role
    const dest = role === 'ADMIN' ? '/app/admin' : '/app/client'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
