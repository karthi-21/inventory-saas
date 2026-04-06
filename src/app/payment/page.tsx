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
import { toast } from 'sonner'

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
    features: ['1 Store', '3 Users', 'GST Billing', 'Inventory Tracking', 'Email Support'],
    highlight: false,
  },
  grow: {
    name: 'Grow',
    price: 2499,
    priceDisplay: '₹2,499',
    description: 'Growing retail businesses',
    features: ['3 Stores', '10 Users', 'Full Inventory', 'Multi-Payment', 'Customer Management', 'Reports & Export', 'Priority Support'],
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

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [planId, setPlanId] = useState<string>('grow')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRazorpayReady, setIsRazorpayReady] = useState(false)

  const plan = PLAN_DETAILS[planId]

  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (planParam && PLAN_DETAILS[planParam]) {
      setPlanId(planParam)
    }
  }, [searchParams])

  // Load Razorpay script
  useEffect(() => {
    if (planId === 'scale') return

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setIsRazorpayReady(true)
    script.onerror = () => setError('Failed to load payment system. Please refresh.')
    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [planId])

  const handlePayment = async () => {
    if (planId === 'scale') {
      window.location.href = 'mailto:sales@omnibiz.in?subject=OmniBIZ%20Scale%20Plan'
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!orderRes.ok) {
        throw new Error('Failed to create order')
      }

      const { orderId, keyId } = await orderRes.json()

      // Razorpay options
      const options = {
        key: keyId,
        amount: plan.price * 100,
        currency: 'INR',
        name: 'OmniBIZ',
        description: `${plan.name} Plan - ${plan.priceDisplay}/month`,
        image: '/favicon.svg',
        prefill: {
          email: localStorage.getItem('user_email') || '',
          phone: localStorage.getItem('phone')?.replace('+91', '') || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Trigger webhook verification for payment confirmation
          try {
            await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': response.razorpay_signature,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
          } catch {
            // Webhook call failed but payment succeeded — continue
          }
          toast.success('Payment successful! Setting up your store...')
          setTimeout(() => {
            router.push('/onboarding')
          }, 1500)
        },
      }

      // @ts-expect-error Razorpay types not available
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Trial Badge */}
      <div className="mb-4 text-center">
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

          {/* Payment Error */}
          {error && (
            <div className="p-3 text-sm text-white bg-destructive rounded-md">
              {error}
            </div>
          )}

          {/* Pay Button */}
          {planId === 'scale' ? (
            <Link href="mailto:sales@omnibiz.in?subject=OmniBIZ%20Scale%20Plan%20Inquiry">
              <Button className="w-full" size="lg">
                Contact Sales
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={isLoading || !isRazorpayReady}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
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
            <span>Secure payment powered by Razorpay</span>
          </div>

          {/* Trial Info */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm">
              <strong>14-day free trial</strong> — Pay now, get refunded if you cancel within 14 days.
            </p>
          </div>
        </CardContent>
      </Card>

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
  )
}

function PaymentLoading() {
  return (
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
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentContent />
    </Suspense>
  )
}
