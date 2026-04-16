import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyDodoWebhook } from '@/lib/dodo'
import { sendEmail, subscriptionConfirmationEmail } from '@/lib/emails'

/**
 * POST /api/payments/dodo-webhook
 * Handles Dodo Payments webhook events for subscription management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-dodo-signature') || ''

    // Verify webhook signature
    if (!verifyDodoWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    switch (event.type || event.event) {
      case 'subscription.created':
      case 'subscription.active': {
        const subData = event.data?.subscription || event.data
        const dodoSubId = subData?.id || subData?.subscription_id

        // Find and activate subscription
        const subscription = await prisma.subscription.findFirst({
          where: { dodoSubscriptionId: dodoSubId }
        })

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              dodoSubscriptionId: dodoSubId,
              currentPeriodStart: subData?.current_period_start ? new Date(subData.current_period_start) : new Date(),
              currentPeriodEnd: subData?.current_period_end ? new Date(subData.current_period_end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
          })

          // Send confirmation email
          const tenant = await prisma.tenant.findUnique({
            where: { id: subscription.tenantId },
            include: { users: { take: 1 } }
          })
          if (tenant?.users?.[0]?.email) {
            const planName = subscription.plan === 'STARTER' ? 'Launch' : subscription.plan === 'PRO' ? 'Grow' : 'Scale'
            const planPrice = subscription.plan === 'STARTER' ? '₹999' : subscription.plan === 'PRO' ? '₹2,499' : 'Custom'
            const nextBilling = subscription.currentPeriodEnd?.toLocaleDateString('en-IN') || 'N/A'
            await sendEmail({
              to: tenant.users[0].email,
              subject: `Your OmniBIZ ${planName} plan is now active!`,
              html: subscriptionConfirmationEmail({
                userName: tenant.users[0].firstName || 'User',
                planName,
                price: planPrice,
                nextBillingDate: nextBilling,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
              }),
              tags: { type: 'subscription_confirmation', tenantId: subscription.tenantId },
            }).catch(() => {}) // Don't fail webhook on email error
          }
        }
        break
      }

      case 'subscription.renewed': {
        const subData = event.data?.subscription || event.data
        const dodoSubId = subData?.id || subData?.subscription_id

        const subscription = await prisma.subscription.findFirst({
          where: { dodoSubscriptionId: dodoSubId }
        })

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              currentPeriodStart: subData?.current_period_start ? new Date(subData.current_period_start) : new Date(),
              currentPeriodEnd: subData?.current_period_end ? new Date(subData.current_period_end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
          })
        }
        break
      }

      case 'subscription.past_due': {
        const subData = event.data?.subscription || event.data
        const dodoSubId = subData?.id || subData?.subscription_id

        const subscription = await prisma.subscription.findFirst({
          where: { dodoSubscriptionId: dodoSubId }
        })

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' }
          })
        }
        break
      }

      case 'subscription.cancelled': {
        const subData = event.data?.subscription || event.data
        const dodoSubId = subData?.id || subData?.subscription_id

        const subscription = await prisma.subscription.findFirst({
          where: { dodoSubscriptionId: dodoSubId }
        })

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'CANCELLED' }
          })
        }
        break
      }

      case 'payment.succeeded': {
        // Payment succeeded - subscription status already handled above
        console.log('Payment succeeded:', event.data?.payment_id || event.data?.id)
        break
      }

      case 'payment.failed': {
        console.log('Payment failed:', event.data?.payment_id || event.data?.id)
        break
      }

      default:
        console.log('Unhandled Dodo webhook event:', event.type || event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Dodo webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
