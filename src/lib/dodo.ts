/**
 * Dodo Payments Client for OmniBIZ SaaS Subscriptions
 * 
 * Handles subscription billing for Launch/Grow/Scale plans.
 * Replaces Razorpay for SaaS subscription management.
 * 
 * API Docs: https://docs.dodopayments.com
 */

import crypto from 'crypto'

const DODO_BASE_URL = process.env.DODO_BASE_URL || 'https://api.sandbox.dodopayments.com'
const DODO_API_KEY = process.env.DODO_API_KEY || ''

export const PLAN_MAPPING: Record<string, { dodoPlanId: string; name: string; price: number; priceDisplay: string }> = {
  launch: {
    dodoPlanId: process.env.DODO_LAUNCH_PLAN_ID || 'launch_monthly',
    name: 'Launch',
    price: 999,
    priceDisplay: '₹999',
  },
  grow: {
    dodoPlanId: process.env.DODO_GROW_PLAN_ID || 'grow_monthly',
    name: 'Grow',
    price: 2499,
    priceDisplay: '₹2,499',
  },
}

export function isDodoConfigured(): boolean {
  return !!(DODO_API_KEY && DODO_BASE_URL)
}

async function dodoFetch(path: string, options: RequestInit = {}) {
  if (!isDodoConfigured()) {
    throw new Error('Dodo Payments is not configured. Set DODO_API_KEY environment variable.')
  }

  const response = await fetch(`${DODO_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${DODO_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Dodo API error: ${response.status} ${error}`)
  }

  return response.json()
}

export interface DodoCheckoutParams {
  planId: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  successUrl: string
  cancelUrl: string
}

export async function createCheckout(params: DodoCheckoutParams): Promise<{ id: string; url: string; status: string }> {
  const plan = PLAN_MAPPING[params.planId]
  if (!plan) throw new Error(`Invalid plan: ${params.planId}`)

  const customer = await dodoFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      email: params.customerEmail,
      name: params.customerName,
      phone: params.customerPhone,
      metadata: { source: 'omnibiz' },
    }),
  })

  const checkout = await dodoFetch('/checkout', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: customer.id,
      products: [plan.dodoPlanId],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { plan: params.planId, source: 'omnibiz' },
    }),
  })

  return { id: checkout.id, url: checkout.url, status: checkout.status }
}

export async function getSubscription(subscriptionId: string) {
  return dodoFetch(`/subscriptions/${subscriptionId}`)
}

export async function cancelSubscription(subscriptionId: string) {
  return dodoFetch(`/subscriptions/${subscriptionId}/cancel`, { method: 'POST' })
}

export async function updateSubscription(subscriptionId: string, newPlanId: string) {
  const plan = PLAN_MAPPING[newPlanId]
  if (!plan) throw new Error(`Invalid plan: ${newPlanId}`)
  return dodoFetch(`/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ product_id: plan.dodoPlanId }),
  })
}

export function verifyDodoWebhook(payload: string, signature: string): boolean {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET
  if (!webhookSecret) return false

  const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex')
  return signature === expected
}
