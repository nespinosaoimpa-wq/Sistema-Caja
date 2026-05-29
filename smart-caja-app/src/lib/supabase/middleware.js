import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  try {
    // Public routes that don't require auth
    const publicRoutes = ['/', '/login', '/register', '/api/webhooks', '/billing', '/api/billing/webhook']
    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith('/api/webhooks') || pathname.startsWith('/billing') || pathname.startsWith('/api/billing/webhook')
    )

    // 1. Optimize for Next.js Prefetches
    // Prefetch requests (triggered on hover) do not need to query the database.
    const isPrefetch = request.headers.get('x-middleware-prefetch') === '1' ||
                       request.headers.get('purpose') === 'prefetch'

    if (isPrefetch) {
      return supabaseResponse
    }

    // 2. Optimize for cookie presence
    // If there are no Supabase auth cookies, we don't need to invoke getUser() to know the user is logged out.
    const allCookies = request.cookies.getAll()
    const hasAuthCookie = allCookies.some(cookie =>
      cookie.name.includes('auth-token') || cookie.name.startsWith('sb-')
    )

    if (!hasAuthCookie) {
      if (!isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // Only query Supabase Auth when we have a candidate auth cookie
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && (pathname === '/login' || pathname === '/register')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (err) {
    console.error('Middleware execution error caught:', err)
    // If it's a private route, redirect to /login to be safe, else let it pass
    const publicRoutes = ['/', '/login', '/register', '/api/webhooks', '/billing', '/api/billing/webhook']
    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith('/api/webhooks') || pathname.startsWith('/billing') || pathname.startsWith('/api/billing/webhook')
    )
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }
}

