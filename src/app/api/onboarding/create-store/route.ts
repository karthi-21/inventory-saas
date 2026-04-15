import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
        storeType: 'MULTI_CATEGORY',
        isActive: true,
      }
    })

    // Also create a UserStoreAccess record for the owner
    await prisma.userStoreAccess.create({
      data: {
        userId: dbUser.id,
        storeId: store.id,
        isDefault: true,
      }
    })

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
