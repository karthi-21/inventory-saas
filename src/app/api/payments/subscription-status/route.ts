import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/payments/subscription-status
 * Returns whether the user has an active subscription
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ hasActiveSubscription: false })
    }

    // Get user from DB
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { tenant: { include: { subscriptions: true } } }
    })

    if (!dbUser?.tenant?.subscriptions) {
      return NextResponse.json({ hasActiveSubscription: false })
    }

    // Check for active or trialing (non-expired) subscription
    const now = new Date()
    const hasActive = dbUser.tenant.subscriptions.some(
      sub => sub.status === 'ACTIVE' ||
        (sub.status === 'TRIALING' && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > now)
    )

    const activeSub = hasActive ? dbUser.tenant.subscriptions.find(
      sub => sub.status === 'ACTIVE' ||
        (sub.status === 'TRIALING' && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > now)
    ) : null

    return NextResponse.json({
      hasActiveSubscription: hasActive,
      subscription: activeSub
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}
