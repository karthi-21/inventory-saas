'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Check, IndianRupee, Loader2, CreditCard, Calendar, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { PLAN_DETAILS } from '@/lib/plan-limits'
import Link from 'next/link'

export default function SubscriptionPage() {
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState(false)

  const { data: subscriptionData, isLoading } = useQuery<{
    hasActiveSubscription: boolean
    subscription: {
      id: string
      status: string
      plan: string
      currentPeriodStart: string
      currentPeriodEnd: string
      dodoSubscriptionId?: string
    } | null
  }>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await fetch('/api/payments/subscription-status')
      if (!res.ok) return { hasActiveSubscription: false, subscription: null }
      return res.json()
    },
  })

  const { data: tenantData } = useQuery<{ plan: string }>({
    queryKey: ['tenant-plan'],
    queryFn: async () => {
      const res = await fetch('/api/tenant')
      if (!res.ok) throw new Error('Failed to fetch tenant')
      const json = await res.json()
      return json.tenant || json
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/payments/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      })
      if (!res.ok) throw new Error('Failed to cancel subscription')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Subscription cancelled. You can continue using Ezvento until the end of your billing period.')
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
      setCancelling(false)
    },
    onError: () => {
      toast.error('Failed to cancel subscription. Please try again.')
      setCancelling(false)
    },
  })

  const subscription = subscriptionData?.subscription
  const currentPlan = tenantData?.plan?.toLowerCase() || 'starter'
  const planDetails = PLAN_DETAILS[currentPlan] || PLAN_DETAILS['launch']
  const isActive = subscription?.status === 'ACTIVE'
  const isTrialing = subscription?.status === 'TRIALING'
  const isPastDue = subscription?.status === 'PAST_DUE'
  const _isCancelled = subscription?.status === 'CANCELLED'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Manage your Ezvento plan and billing</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <Badge variant={isActive ? 'default' : isTrialing ? 'secondary' : 'destructive'}>
              {subscription?.status || 'FREE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">{planDetails.name} Plan</h3>
              <p className="text-sm text-muted-foreground">{planDetails.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{planDetails.priceDisplay}</div>
              {planDetails.price > 0 && <p className="text-xs text-muted-foreground">/month</p>}
            </div>
          </div>

          {subscription && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Billing Period</p>
                    <p className="font-medium">
                      {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Next Billing Date</p>
                    <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {isTrialing && (
            <div className="p-3 bg-primary/10 rounded-lg text-sm">
              You are currently on a free trial. Subscribe to continue using Ezvento after the trial ends.
            </div>
          )}

          {isPastDue && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Payment failed — please update your payment method to avoid service interruption.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>What&apos;s included in your {planDetails.name} plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {planDetails.features.map(feature => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {(currentPlan === 'starter' || currentPlan === 'pro') && (
        <Card>
          <CardHeader>
            <CardTitle>Change Plan</CardTitle>
            <CardDescription>Upgrade or change your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(PLAN_DETAILS).filter(([key]) => {
              const planMap: Record<string, string> = { launch: 'starter', grow: 'pro', scale: 'enterprise' }
              return planMap[key] !== currentPlan
            }).map(([key, plan]) => (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <ul className="mt-2 space-y-1">
                    {plan.features.slice(0, 3).map(f => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="h-3 w-3" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{plan.priceDisplay}{plan.price > 0 ? '/mo' : ''}</p>
                  <Link href={`/payment?plan=${key}`}>
                    <Button size="sm" variant={plan.highlight ? 'default' : 'outline'} className="mt-2">
                      {plan.price > 0 ? 'Upgrade' : 'Contact Sales'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription */}
      {isActive && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Cancel Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your subscription will remain active until the end of your current billing period
              ({subscription ? formatDate(subscription.currentPeriodEnd) : 'N/A'}). After that, your account will be
              downgraded to the free plan.
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to cancel your subscription? You can continue using Ezvento until the end of your billing period.')) {
                  setCancelling(true)
                  cancelMutation.mutate()
                }
              }}
              disabled={cancelling}
            >
              {cancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling...</> : 'Cancel Subscription'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Subscription */}
      {!subscription && (
        <Card>
          <CardContent className="py-8 text-center">
            <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
            <p className="text-muted-foreground mb-4">Subscribe to a plan to unlock all features</p>
            <Link href="/payment">
              <Button size="lg">
                <IndianRupee className="mr-2 h-4 w-4" />
                Choose a Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}