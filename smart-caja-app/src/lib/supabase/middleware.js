import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdaqvqhcfuyxitnpsesq.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_IPq6vXe2V1VZ9dgk_WLgdw_d7eL_pwm'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  try {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/promo',
      '/catalogo-gratis',
      '/terms',
      '/privacy',
      '/scan'
    ]
    const isPublicRoute = publicRoutes.some(route => pathname === route) ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/billing') ||
      pathname.startsWith('/api/billing') ||
      pathname.startsWith('/scan') ||
      pathname.startsWith('/tienda') ||
      pathname.startsWith('/api/tienda') ||
      pathname.startsWith('/api/leads') ||
      pathname.startsWith('/api/referrals') ||
      pathname.startsWith('/api/emails')

    // 1. Optimize for Next.js Prefetches
    const isPrefetch = request.headers.get('x-middleware-prefetch') === '1' ||
                       request.headers.get('purpose') === 'prefetch'

    if (isPrefetch) {
      return supabaseResponse
    }

    // 2. Optimize for cookie presence
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
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
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
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/promo',
      '/catalogo-gratis',
      '/terms',
      '/privacy',
      '/scan'
    ]
    const isPublicRoute = publicRoutes.some(route => pathname === route) ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/billing') ||
      pathname.startsWith('/api/billing') ||
      pathname.startsWith('/scan') ||
      pathname.startsWith('/tienda') ||
      pathname.startsWith('/api/tienda') ||
      pathname.startsWith('/api/leads') ||
      pathname.startsWith('/api/referrals') ||
      pathname.startsWith('/api/emails')
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }
}
