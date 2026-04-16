import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isDodoConfigured, getSubscription } from '@/lib/dodo'

/**
 * POST /api/payments/verify-payment
 * Verifies Dodo Payments checkout session and activates subscription
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { checkoutId, sessionId } = body as { checkoutId?: string; sessionId?: string }

    if (!checkoutId && !sessionId) {
      return NextResponse.json({ error: 'Missing checkout session ID' }, { status: 400 })
    }

    // Get user's tenant
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { tenant: { include: { subscriptions: true } } }
    })

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'User not fully set up' }, { status: 400 })
    }

    // Find subscription by Dodo checkout ID
    const subscription = await prisma.subscription.findFirst({
      where: {
        tenantId: dbUser.tenantId,
        dodoSubscriptionId: checkoutId || sessionId
      }
    })

    if (subscription) {
      // If Dodo is configured, verify subscription status
      if (isDodoConfigured() && subscription.dodoSubscriptionId) {
        try {
          const dodoSub = await getSubscription(subscription.dodoSubscriptionId)
          // Update status based on Dodo's response
          if (dodoSub && (dodoSub.status === 'active' || dodoSub.status === 'trialing')) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: 'ACTIVE' }
            })
          }
        } catch (err) {
          console.error('Failed to verify Dodo subscription:', err)
          // Continue even if verification fails - webhook will handle it
        }
      } else {
        // Dodo not configured - mark as active (for development)
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
