import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * OAuth Callback Handler - Server Component
 * 
 * ⚠️ CRITICAL FIX: This is now a Server Component instead of Client Component
 * 
 * Why this matters:
 * - OAuth code exchange MUST happen on the server, not the browser
 * - Supabase's @supabase/ssr handles PKCE code verifier server-side
 * - No more "PKCE code verifier not found" errors
 * - Cookies are managed via Next.js cookies API (automatically sent with requests)
 * 
 * How it works:
 * 1. User clicks Google/magic link → redirected here with `code` param
 * 2. Server-side Supabase client exchanges code for session
 * 3. Supabase reads PKCE verifier from request cookies automatically
 * 4. Session is established, redirect to next step
 */

async function handleAuthCallback(code: string, plan: string) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  try {
    // Exchange OAuth code for session (server-side)
    // Supabase automatically reads the PKCE code verifier from cookies
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('OAuth exchange error:', exchangeError)
      redirect(`/signup?error=callback_failed`)
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('No user after exchange')
      redirect(`/signup?error=no_user`)
    }

    // Create account via API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ezvento.karthi-21.com'
    const response = await fetch(`${appUrl}/api/auth/callback-server`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          user_metadata: user.user_metadata,
          email_confirmed_at: user.email_confirmed_at,
        },
        plan,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      console.error('Callback server error:', data)
      redirect(`/signup?error=account_creation_failed`)
    }

    // Success — redirect to payment
    redirect(`/payment?plan=${plan}`)
  } catch (error) {
    console.error('Callback error:', error)
    redirect(`/signup?error=callback_failed`)
  }
}

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const code = typeof params.code === 'string' ? params.code : null
  const plan = typeof params.plan === 'string' ? params.plan : 'grow'
  const error = typeof params.error === 'string' ? params.error : null

  // Handle explicit errors
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error)}`)
  }

  // Require code
  if (!code) {
    redirect(`/signup?error=missing_code`)
  }

  // Process the callback
  await handleAuthCallback(code, plan)

  // Should never reach here (redirect() throws)
  return null
}