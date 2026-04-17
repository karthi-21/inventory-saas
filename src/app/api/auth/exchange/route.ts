import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth Code Exchange Route Handler
 * 
 * This Route Handler is responsible for:
 * 1. Exchanging OAuth code for a session (server-side)
 * 2. Setting session cookies (which only works in Route Handlers)
 * 3. Returning the result to the callback page
 */

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Missing code parameter' },
        { status: 400 }
      )
    }

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
            // This works in Route Handlers!
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('OAuth exchange error:', exchangeError)
      return NextResponse.json(
        { error: 'OAuth exchange failed', details: exchangeError.message },
        { status: 401 }
      )
    }

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        user_metadata: user.user_metadata,
        email_confirmed_at: user.email_confirmed_at,
      },
    })
  } catch (error) {
    console.error('Exchange route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
