import { redirect } from 'next/navigation'

/**
 * OAuth Callback Page - Server Component
 * 
 * This page handles the OAuth callback by:
 * 1. Extracting the code from query params
 * 2. Calling a Route Handler to exchange the code for a session
 * 3. Creating/updating the account via another API
 * 4. Redirecting to payment
 * 
 * The actual OAuth code exchange happens in:
 * /api/auth/exchange (Route Handler) - where cookies can be written
 */

async function handleAuthCallback(code: string, plan: string) {
  try {
    // Step 1: Exchange code for session via Route Handler
    // This is where the PKCE verification happens (in the Route Handler)
    const exchangeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://ezvento.karthi-21.com'}/api/auth/exchange`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      }
    )

    if (!exchangeResponse.ok) {
      const data = await exchangeResponse.json()
      console.error('OAuth exchange failed:', data)
      redirect(`/signup?error=oauth_exchange_failed`)
    }

    const { user } = await exchangeResponse.json()

    if (!user) {
      console.error('No user returned from exchange')
      redirect(`/signup?error=no_user`)
    }

    // Step 2: Create/update account via callback server API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ezvento.karthi-21.com'
    const createAccountResponse = await fetch(`${appUrl}/api/auth/callback-server`, {
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

    if (!createAccountResponse.ok) {
      const data = await createAccountResponse.json()
      console.error('Account creation failed:', data)
      redirect(`/signup?error=account_creation_failed`)
    }

    // Step 3: Redirect to payment
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

  // Handle explicit errors from OAuth provider
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