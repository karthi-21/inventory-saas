import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const PLAN_MAP: Record<string, 'STARTER' | 'PRO' | 'ENTERPRISE'> = {
  launch: 'STARTER',
  grow: 'PRO',
  scale: 'ENTERPRISE',
}

/**
 * POST /api/payments/dev-bypass
 * DEV ONLY: Creates a trial subscription without payment.
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
    const { planId } = body

    const planEnum = PLAN_MAP[planId] || 'PRO'

    // Get user from DB
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      select: { id: true, tenantId: true }
    })

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'User not fully set up' }, { status: 400 })
    }

    // Check for existing subscription
    const existingSub = await prisma.subscription.findFirst({
      where: { tenantId: dbUser.tenantId, status: { in: ['TRIALING', 'ACTIVE'] } }
    })

    if (existingSub) {
      // Update existing
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan: planEnum,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        }
      })
    } else {
      // Create new trial subscription
      await prisma.subscription.create({
        data: {
          tenantId: dbUser.tenantId,
          plan: planEnum,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        }
      })
    }

    return NextResponse.json({ success: true, planId })
  } catch (error) {
    console.error('Dev bypass error:', error)
    return NextResponse.json({ error: 'Dev bypass failed' }, { status: 500 })
  }
}
