import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, handlePrismaError } from '@/lib/api'
import { isDodoConfigured, cancelSubscription, updateSubscription, PLAN_MAPPING } from '@/lib/dodo'

/**
 * GET /api/payments/manage-subscription
 * Get current subscription details
 */
export async function GET() {
  try {
    const { user, error } = await requirePermission('SETTINGS_VIEW', 'VIEW')
    if (error) return error

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: user.tenantId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      return NextResponse.json({ hasActiveSubscription: false })
    }

    return NextResponse.json({
      hasActiveSubscription: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        dodoSubscriptionId: subscription.dodoSubscriptionId,
      },
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}

/**
 * POST /api/payments/manage-subscription
 * Upgrade/downgrade plan
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_VIEW', 'VIEW')
    if (error) return error

    const body = await request.json()
    const { action, newPlanId } = body as { action: 'upgrade' | 'downgrade' | 'cancel'; newPlanId?: string }

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: user.tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
    })

    if (!subscription) {
      return errorResponse('No active subscription found', 404)
    }

    if (action === 'cancel') {
      if (isDodoConfigured() && subscription.dodoSubscriptionId) {
        await cancelSubscription(subscription.dodoSubscriptionId)
      }
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELLED' },
      })
      return NextResponse.json({ success: true, status: 'CANCELLED', message: 'Subscription cancelled at period end' })
    }

    if ((action === 'upgrade' || action === 'downgrade') && newPlanId) {
      const plan = PLAN_MAPPING[newPlanId]
      if (!plan) return errorResponse('Invalid plan', 400)

      const newPlanEnum = newPlanId === 'launch' ? 'STARTER' : newPlanId === 'grow' ? 'PRO' : 'ENTERPRISE'

      if (isDodoConfigured() && subscription.dodoSubscriptionId) {
        await updateSubscription(subscription.dodoSubscriptionId, newPlanId)
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { plan: newPlanEnum as 'STARTER' | 'PRO' | 'ENTERPRISE' },
      })

      return NextResponse.json({ success: true, plan: newPlanEnum, message: `Plan updated to ${plan.name}` })
    }

    return errorResponse('Invalid action. Use upgrade, downgrade, or cancel', 400)
  } catch (err) {
    return handlePrismaError(err)
  }
}
