'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Store, ArrowRight, Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to onboarding after 3 seconds
    const timer = setTimeout(() => {
      router.push('/onboarding')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="w-full max-w-md text-center">
      {/* Success Animation */}
      <div className="mb-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
        <p className="text-muted-foreground mt-2">Your OmniBIZ subscription is now active.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Store className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Welcome to OmniBIZ!</p>
                <p className="text-sm text-muted-foreground">Your store is ready to set up</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Redirecting to store setup in 3 seconds...</p>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={() => router.push('/onboarding')}
        >
          Set Up My Store Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-muted-foreground">
          You can also{' '}
          <a href="/dashboard" className="text-primary hover:underline">
            go to your dashboard
          </a>
          {' '}and set up your store later.
        </p>
      </div>
    </div>
  )
}
