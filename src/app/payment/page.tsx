'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Check, Star, IndianRupee } from 'lucide-react'

const PLAN_DETAILS: Record<string, {
  name: string
  price: number
  priceDisplay: string
  description: string
  features: string[]
  highlight: boolean
}> = {
  launch: {
    name: 'Launch',
    price: 999,
    priceDisplay: '₹999',
    description: 'Perfect for a single store',
    features: ['1 Store', '3 Users', 'GST Billing', 'Stock Tracking', 'Email Support'],
    highlight: false,
  },
  grow: {
    name: 'Grow',
    price: 2499,
    priceDisplay: '₹2,499',
    description: 'Growing retail businesses',
    features: ['3 Stores', '10 Users', 'Full Stock', 'Multi-Payment', 'Customer Management', 'Reports & Export', 'Priority Support'],
    highlight: true,
  },
  scale: {
    name: 'Scale',
    price: 0,
    priceDisplay: 'Custom',
    description: 'Franchises & large operations',
    features: ['Unlimited Stores', 'Unlimited Users', 'Custom Roles', 'API Access', 'White-label', 'Dedicated Support'],
    highlight: false,
  },
}

type PlanKey = keyof typeof PLAN_DETAILS

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [planId, setPlanId] = useState<PlanKey>('grow')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true)

  const plan = PLAN_DETAILS[planId]

  useEffect(() => {
    const planParam = searchParams.get('plan') as PlanKey | null
    if (planParam && PLAN_DETAILS[planParam]) {
      setPlanId(planParam)
    }
  }, [searchParams])

  // Check if user already has an active subscription
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch('/api/payments/subscription-status')
        if (res.ok) {
          const data = await res.json()
          if (data.hasActiveSubscription) {
            setHasActiveSubscription(true)
          }
        }
      } catch (_e) {
        // Ignore errors - user may not be authenticated yet
      } finally {
        setIsCheckingSubscription(false)
      }
    }
    checkSubscription()
  }, [])

  const handlePayment = async () => {
    if (planId === 'scale') {
      window.location.href = 'mailto:sales@ezvento.karth-21.com?subject=Ezvento%20Scale%20Plan'
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create Dodo Payments checkout session
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { checkoutUrl } = await res.json()

      // Redirect to Dodo Payments checkout page
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setIsLoading(false)
    }
  }

  // If already subscribed, redirect to dashboard
  if (isCheckingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (hasActiveSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg">
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Already Subscribed</CardTitle>
              <CardDescription>Your subscription is active</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">You already have an active subscription.</p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg m-auto">
        {/* Trial Badge */}
        <div className="mt-10 mb-4 text-center">
          <Badge variant="outline" className="text-sm bg-green-50 border-green-200 text-green-700">
            <Check className="w-3 h-3 mr-1" />
            14-day free trial included
          </Badge>
        </div>

        <Card className={plan.highlight ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''}>
          <CardHeader className="text-center pb-2">
            {plan.highlight && (
              <Badge className="mb-2 w-fit mx-auto bg-primary text-primary-foreground">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            )}
            <CardTitle className="text-2xl">{plan.name} Plan</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Price */}
            <div className="text-center py-4 border-y">
              <div className="flex items-center justify-center gap-1">
                <IndianRupee className="w-6 h-6" />
                <span className="text-4xl font-bold">{plan.priceDisplay}</span>
                {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
              </div>
              {plan.price > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Billed monthly. Cancel anytime.
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Error */}
            {error && (
              <div className="p-3 text-sm text-white bg-destructive rounded-md">
                {error}
              </div>
            )}

            {/* Pay Button */}
            {planId === 'scale' ? (
              <Link href="mailto:sales@ezvento.karth-21.com?subject=Ezvento%20Scale%20Plan%20Inquiry">
                <Button className="w-full" size="lg">
                  Contact Sales
                </Button>
              </Link>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <IndianRupee className="mr-2 h-4 w-4" />
                    Pay {plan.priceDisplay} Now
                  </>
                )}
              </Button>
            )}

            <Separator />

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Check className="h-4 w-4" />
              <span>Secure payment powered by Dodo Payments</span>
            </div>

            {/* Trial Info */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm">
                <strong>14-day free trial</strong> — Pay now, get refunded if you cancel within 14 days.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plan Selector */}
        <div className="mt-4 flex gap-2 justify-center">
          {Object.entries(PLAN_DETAILS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setPlanId(key as PlanKey)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                planId === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* What's Included */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Your free trial includes:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Full access to all {plan.name} features
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Setup in under 10 minutes
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                No credit card required to start
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Cancel anytime, no questions asked
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PaymentLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-lg">
        <div className="mb-4 text-center">
          <Badge variant="outline" className="text-sm bg-green-50 border-green-200 text-green-700">
            <Check className="w-3 h-3 mr-1" />
            14-day free trial included
          </Badge>
        </div>
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentContent />
    </Suspense>
  )
}
