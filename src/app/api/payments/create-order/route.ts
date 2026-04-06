import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const PLAN_PRICES: Record<string, { amount: number; plan: 'STARTER' | 'PRO' | 'ENTERPRISE' }> = {
  launch: { amount: 99900, plan: 'STARTER' },   // ₹999 in paise
  grow:   { amount: 249900, plan: 'PRO' },     // ₹2,499 in paise
  // scale is custom - handled separately
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
})

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for the selected plan
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const price = PLAN_PRICES[planId]

    // Get user from DB to get tenantId
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { tenant: true }
    })

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'User not fully set up' }, { status: 400 })
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: price.amount,
      currency: 'INR',
      receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        email: user.email || '',
        plan: price.plan,
      },
    })

    // Find existing TRIALING subscription and update it
    const existingSub = await prisma.subscription.findFirst({
      where: { tenantId: dbUser.tenantId, status: 'TRIALING' }
    })

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan: price.plan,
          razorpayOrderId: razorpayOrder.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      })
    } else {
      await prisma.subscription.create({
        data: {
          tenantId: dbUser.tenantId,
          plan: price.plan,
          status: 'TRIALING',
          razorpayOrderId: razorpayOrder.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
