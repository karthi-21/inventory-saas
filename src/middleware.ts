import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { apiLimiter, authLimiter } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

  // Auth route rate limiting (20 requests per 15 min per IP)
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password')) {
    const { allowed, remaining } = authLimiter(`auth:${clientIp}`)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    return response
  }

  // API route rate limiting (100 requests per min per IP)
  if (pathname.startsWith('/api/')) {
    const { allowed, remaining } = apiLimiter(`api:${clientIp}`)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    return response
  }

  // Public routes that don't need auth
  const _isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/payment')

  // If Supabase env vars are missing, only allow public routes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Allow public routes, redirect dashboard to login
    if (pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Create response that we'll modify with cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update request cookies for subsequent getAll calls
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            // Set on the response to be sent to browser
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = pathname.startsWith('/login') ||
    pathname.startsWith('/signup')
  const isDashboard = pathname.startsWith('/dashboard')
  const isOnboarding = pathname.startsWith('/onboarding')
  const _isPayment = pathname.startsWith('/payment')

  // Redirect unauthenticated users away from dashboard
  if (isDashboard && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users away from onboarding to login
  if (isOnboarding && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from payment page if they already have a store set up
  // (This check would require DB access, so we'll handle it client-side)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
