import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createCheckout, isDodoConfigured, PLAN_MAPPING } from '@/lib/dodo'

/**
 * POST /api/payments/create-order
 * Creates a Dodo Payments checkout session for the selected plan
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body

    if (!planId || !PLAN_MAPPING[planId]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!isDodoConfigured()) {
      return NextResponse.json({ error: 'Payment system is not configured. Please contact support.' }, { status: 503 })
    }

    // Get user from DB to get tenantId
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { tenant: true }
    })

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'User not fully set up' }, { status: 400 })
    }

    // Create Dodo Payments checkout session
    const checkout = await createCheckout({
      planId,
      customerEmail: user.email || '',
      customerName: dbUser.firstName ? `${dbUser.firstName} ${dbUser.lastName || ''}`.trim() : user.email || '',
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?plan=${planId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment?plan=${planId}`,
    })

    // Create or update subscription record
    const existingSub = await prisma.subscription.findFirst({
      where: { tenantId: dbUser.tenantId, status: { in: ['TRIALING', 'ACTIVE'] } }
    })

    const plan = PLAN_MAPPING[planId]
    const planEnum = planId === 'launch' ? 'STARTER' : planId === 'grow' ? 'PRO' : 'ENTERPRISE'

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan: planEnum as 'STARTER' | 'PRO' | 'ENTERPRISE',
          dodoCustomerId: checkout.id,
          dodoSubscriptionId: checkout.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
    } else {
      await prisma.subscription.create({
        data: {
          tenantId: dbUser.tenantId,
          plan: planEnum as 'STARTER' | 'PRO' | 'ENTERPRISE',
          status: 'TRIALING',
          dodoCustomerId: checkout.id,
          dodoSubscriptionId: checkout.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
    }

    return NextResponse.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      planId,
      amount: plan.price,
      planName: plan.name,
    })
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
