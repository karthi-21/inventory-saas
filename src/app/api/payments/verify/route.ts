import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

/**
 * POST /api/payments/verify
 * Handles Razorpay webhook for payment confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder')
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    // Handle different event types
    switch (event.event) {
      case 'order.paid': {
        const orderData = event.payload.order.entity

        // Find subscription by razorpayOrderId
        const subscription = await prisma.subscription.findFirst({
          where: { razorpayOrderId: orderData.id }
        })

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              razorpaySubscriptionId: orderData.id,
            }
          })
        }
        break
      }

      case 'order.failed': {
        const orderData = event.payload.order.entity
        console.log('Payment failed for order:', orderData.id)
        // Could: send notification email, clean up pending orders, etc.
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
