import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTrialEndDate } from '@/config/subscription'

/**
 * POST /api/payments/dev-expire-trial
 * DEV ONLY: Backdates the user's trial subscription so it appears expired.
 * POST { action: 'expire' } — sets currentPeriodEnd to 1 day ago
 * POST { action: 'restore' } — resets trial to full duration from now
 * Only works when NODE_ENV is 'development'.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body as { action: 'expire' | 'restore' }

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      select: { id: true, tenantId: true }
    })

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'User not fully set up' }, { status: 400 })
    }

    // Find the user's trial subscription
    const sub = await prisma.subscription.findFirst({
      where: { tenantId: dbUser.tenantId, status: 'TRIALING' }
    })

    if (!sub) {
      return NextResponse.json({ error: 'No trial subscription found' }, { status: 404 })
    }

    if (action === 'expire') {
      // Backdate to 1 day ago so trial appears expired
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
        }
      })
      return NextResponse.json({ success: true, action: 'expire', trialEnd: '1 day ago' })
    }

    if (action === 'restore') {
      // Reset trial to full duration from now
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodEnd: getTrialEndDate(),
        }
      })
      return NextResponse.json({ success: true, action: 'restore', trialEnd: getTrialEndDate().toISOString() })
    }

    return NextResponse.json({ error: 'Invalid action. Use "expire" or "restore".' }, { status: 400 })
  } catch (error) {
    console.error('Dev expire-trial error:', error)
    return NextResponse.json({ error: 'Dev expire-trial failed' }, { status: 500 })
  }
}
