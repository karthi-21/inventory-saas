import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/onboarding/status
 * Returns whether the currently authenticated user already has a tenant with at least one store
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ hasExistingStore: false })
    }

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { tenant: { include: { stores: true } } }
    })

    const hasExistingStore = dbUser?.tenant && dbUser.tenant.stores.length > 0

    return NextResponse.json({ hasExistingStore })
  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json({ hasExistingStore: false })
  }
}
