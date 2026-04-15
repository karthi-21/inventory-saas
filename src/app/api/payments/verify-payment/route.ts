import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/payments/verify-payment
 * Verifies Razorpay payment signature and activates subscription
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
      .update(sign.toString())
      .digest('hex')

    if (expectedSign !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Get user's tenant
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { tenant: { include: { subscriptions: true } } }
    })

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'User not fully set up' }, { status: 400 })
    }

    // Find and update subscription
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: dbUser.tenantId, razorpayOrderId: razorpay_order_id }
    })

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          razorpaySubscriptionId: razorpay_payment_id,
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
