'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('Setting up your account...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the plan from query params
        const plan = searchParams.get('plan') || 'grow'

        // Check for error in query params
        const errorParam = searchParams.get('error')
        if (errorParam) {
          setError(errorParam)
          setTimeout(() => router.push(`/signup?error=${encodeURIComponent(errorParam)}`), 3000)
          return
        }

        // Check for OAuth code
        const code = searchParams.get('code')
        if (code) {
          // Exchange OAuth code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('OAuth exchange error:', exchangeError)
            setError('Failed to complete OAuth sign in')
            setTimeout(() => router.push('/signup?error=oauth_failed'), 3000)
            return
          }
        }

        // Get the current session
        // Supabase client automatically processes tokens from URL hash (for email confirmation)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('Failed to establish session')
          setTimeout(() => router.push('/signup?error=session_error'), 3000)
          return
        }

        if (!session?.user) {
          // No session yet - try to refresh
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError || !refreshedSession?.user) {
            console.error('No session after callback')
            setError('Session not established. Please try signing up again.')
            setTimeout(() => router.push('/signup?error=no_session'), 3000)
            return
          }

          // Use refreshed session
          const user = refreshedSession.user
          setMessage('Creating your account...')

          // Call the server-side callback to create the user in the database
          const response = await fetch('/api/auth/callback-server', {
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
            throw new Error(data.error || 'Failed to create account')
          }

          // Redirect to payment page
          router.push(`/payment?plan=${plan}`)
          return
        }

        const user = session.user
        setMessage('Creating your account...')

        // Call the server-side callback to create the user in the database
        const response = await fetch('/api/auth/callback-server', {
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
          throw new Error(data.error || 'Failed to create account')
        }

        // Redirect to payment page
        router.push(`/payment?plan=${plan}`)
      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        setTimeout(() => router.push('/signup?error=callback_failed'), 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to signup...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{message}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  )
}

function AuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
