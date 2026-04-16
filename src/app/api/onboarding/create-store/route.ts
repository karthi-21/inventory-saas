import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { seedIndustryCategories, INDUSTRY_PRESETS, type IndustryType } from '@/lib/industry-presets'
import { sendEmail, welcomeEmail } from '@/lib/emails'

/**
 * POST /api/onboarding/create-store
 * Creates the first store for a new tenant during onboarding
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      storeName,
      storeCode,
      address,
      phone,
      state,
      pincode,
      storeType,
    } = body

    // Validate required fields
    if (!storeName || !storeCode) {
      return NextResponse.json(
        { error: 'Store name and code are required' },
        { status: 400 }
      )
    }

    // Get user from DB with tenant
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      include: { tenant: true }
    })

    if (!dbUser?.tenantId) {
      return NextResponse.json(
        { error: 'User tenant not found' },
        { status: 400 }
      )
    }

    // Check if store code is already taken by this tenant
    const existingStore = await prisma.store.findFirst({
      where: {
        tenantId: dbUser.tenantId,
        code: storeCode
      }
    })

    if (existingStore) {
      return NextResponse.json(
        { error: 'Store code already exists' },
        { status: 400 }
      )
    }

    // Create the store
    const store = await prisma.store.create({
      data: {
        tenantId: dbUser.tenantId,
        name: storeName,
        code: storeCode,
        address: address || null,
        phone: phone || null,
        state: state || null,
        pincode: pincode || null,
        storeType: storeType || 'MULTI_CATEGORY',
        isActive: true,
        locations: {
          create: {
            name: 'Main Location',
            type: 'SHOWROOM',
            isActive: true,
          }
        }
      }
    })

    // Seed industry-specific categories if storeType is set
    if (storeType && INDUSTRY_PRESETS[storeType as IndustryType]) {
      try {
        await seedIndustryCategories(dbUser.tenantId, storeType as IndustryType)
      } catch (catError) {
        console.error('Failed to seed industry categories:', catError)
        // Non-critical — don't block store creation
      }
    }

    // Also create a UserStoreAccess record for the owner
    await prisma.userStoreAccess.create({
      data: {
        userId: dbUser.id,
        storeId: store.id,
        isDefault: true,
      }
    })

    // Send welcome email (non-blocking)
    if (dbUser.email) {
      sendEmail({
        to: dbUser.email,
        subject: `Welcome to OmniBIZ! Your store "${storeName}" is ready`,
        html: welcomeEmail({
          userName: dbUser.firstName || dbUser.email?.split('@')[0] || 'Store Owner',
          storeName,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/dashboard`,
        }),
        tags: { type: 'welcome', tenantId: dbUser.tenantId },
      }).catch(err => console.error('Welcome email failed:', err))
    }

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
      }
    })
  } catch (error) {
    console.error('Create store error:', error)
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    )
  }
}
