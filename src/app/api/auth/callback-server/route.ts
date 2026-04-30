import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TenantPlan } from '@prisma/client'
import { getTrialEndDate } from '@/config/subscription'

const PLAN_MAP: Record<string, TenantPlan> = {
  launch: 'STARTER',
  grow: 'PRO',
  scale: 'ENTERPRISE',
}

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
    })

    // First time user - create tenant, user, and subscription in a transaction
    if (!dbUser) {
      // Use email prefix for subdomain to ensure uniqueness per user
      const emailPrefix = user.email?.split('@')[0] || 'store'
      const baseSubdomain = emailPrefix
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40)

      // Check if subdomain already exists and append random suffix if needed
      let subdomain = baseSubdomain
      let existingTenant = await prisma.tenant.findUnique({ where: { subdomain } })
      let attempts = 0
      while (existingTenant && attempts < 5) {
        subdomain = `${baseSubdomain}-${Math.floor(Math.random() * 10000)}`
        existingTenant = await prisma.tenant.findUnique({ where: { subdomain } })
        attempts++
      }

      dbUser = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: user.user_metadata?.store_name || `${emailPrefix}'s Store`,
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
        })

        // Create trial subscription if not exists
        const existingSub = await tx.subscription.findFirst({
          where: { tenantId: tenant.id }
        })

        if (!existingSub) {
          await tx.subscription.create({
            data: {
              tenantId: tenant.id,
              plan: PLAN_MAP[plan] || 'PRO',
              status: 'TRIALING',
              currentPeriodStart: new Date(),
              currentPeriodEnd: getTrialEndDate(),
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

  // Redirect URL — derive from the incoming request so localhost testing works
  const requestOrigin = request.nextUrl.origin
  const origin = requestOrigin.includes('localhost') ? requestOrigin : (process.env.NEXT_PUBLIC_APP_URL || 'https://ezvento.karthi-21.com')

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent(error)}`)
  }

  // For OAuth, redirect to the client-side callback with the code
  // Validate code format: Supabase PKCE codes are 43+ chars of alphanumeric + hyphens/underscores
  if (code) {
    const isValidCode = /^[A-Za-z0-9_-]{43,128}$/.test(code)
    if (!isValidCode) {
      console.error('Invalid OAuth code format')
      return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent('Invalid authentication code')}`)
    }
    return NextResponse.redirect(`${origin}/auth/callback?code=${encodeURIComponent(code)}&plan=${plan}`)
  }

  // No code or error - redirect to signup
  return NextResponse.redirect(`${origin}/signup`)
}
