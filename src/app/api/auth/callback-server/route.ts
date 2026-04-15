import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/auth/callback-server
 * Creates user/tenant in database after Supabase authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user, plan } = body

    if (!user?.email) {
      return NextResponse.json({ error: 'No user data' }, { status: 400 })
    }

    // Check if user already exists in Prisma
    let dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { tenant: { include: { subscriptions: true } } }
    })

    // First time user - create tenant, user, and subscription in a transaction
    if (!dbUser) {
      const subdomain = (user.user_metadata?.store_name || user.email?.split('@')[0] || 'store')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)

      dbUser = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: user.user_metadata?.store_name || `${user.email?.split('@')[0]}'s Store`,
            subdomain,
          }
        })

        const createdUser = await tx.user.create({
          data: {
            email: user.email,
            phone: user.phone || null,
            firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'User',
            lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || null,
            isOwner: true,
            isActive: true,
            emailVerified: user.email_confirmed_at != null,
            tenantId: tenant.id,
          },
          include: { tenant: { include: { subscriptions: true } } }
        })

        // Create trial subscription if not exists
        const existingSub = await tx.subscription.findFirst({
          where: { tenantId: tenant.id }
        })

        if (!existingSub) {
          await tx.subscription.create({
            data: {
              tenantId: tenant.id,
              plan: 'PRO',
              status: 'TRIALING',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            }
          })
        }

        return createdUser
      })
    }

    return NextResponse.json({ success: true, plan: plan || 'grow' })
  } catch (error) {
    console.error('Callback server error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * GET handler for OAuth callbacks (Google)
 * Supabase returns OAuth code here which can be exchanged server-side
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const plan = searchParams.get('plan') || 'grow'

  // Redirect URL - use the client-side callback handler
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent(error)}`)
  }

  // For OAuth, redirect to the client-side callback with the code
  // The client will exchange it and get the session
  if (code) {
    return NextResponse.redirect(`${origin}/auth/callback?code=${code}&plan=${plan}`)
  }

  // No code or error - redirect to signup
  return NextResponse.redirect(`${origin}/signup`)
}
