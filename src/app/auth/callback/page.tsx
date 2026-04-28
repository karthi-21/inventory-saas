'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * OAuth/Email Confirmation Callback Page — Client Component
 *
 * This page handles the auth callback by making browser-side fetch calls
 * to /api/auth/exchange. This is REQUIRED because the PKCE code verifier
 * cookie must travel with the request, and response session cookies must
 * be set in the browser. Server Component fetch calls to internal routes
 * do not preserve cookies, so a Client Component is necessary here.
 */

export default function AuthCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasRun = useRef(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const code = searchParams.get('code')
  const plan = searchParams.get('plan') || 'grow'
  const error = searchParams.get('error')

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    // Handle explicit OAuth errors
    if (error) {
      router.push(`/signup?error=${encodeURIComponent(error)}`)
      return
    }

    if (!code) {
      router.push(`/signup?error=missing_code`)
      return
    }

    async function handleAuthCallback() {
      setStatus('loading')

      try {
        // Step 1: Exchange code for session via Route Handler
        // Browser fetch automatically sends cookies (PKCE verifier)
        // and receives session cookies in the response
        const exchangeResponse = await fetch('/api/auth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (!exchangeResponse.ok) {
          const data = await exchangeResponse.json().catch(() => ({}))
          console.error('OAuth exchange failed:', data)
          setStatus('error')
          setErrorMessage(data.error || 'OAuth exchange failed')
          return
        }

        const { user } = await exchangeResponse.json()

        if (!user) {
          console.error('No user returned from exchange')
          setStatus('error')
          setErrorMessage('No user returned from exchange')
          return
        }

        // Step 2: Create/update account via callback server API
        const createAccountResponse = await fetch('/api/auth/callback-server', {
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
          const data = await createAccountResponse.json().catch(() => ({}))
          console.error('Account creation failed:', data)
          setStatus('error')
          setErrorMessage(data.error || 'Account creation failed')
          return
        }

        // Step 3: Redirect to payment
        router.push(`/payment?plan=${plan}`)
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    handleAuthCallback()
  }, [code, plan, error, router])

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <h1 className="text-lg font-semibold">Authentication failed</h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage || 'Something went wrong during authentication. Please try again.'}
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Confirming your account…</p>
      </div>
    </div>
  )
}
