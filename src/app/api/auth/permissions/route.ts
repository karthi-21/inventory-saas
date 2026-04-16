import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { successResponse, unauthorizedResponse } from '@/lib/api'

/**
 * GET /api/auth/permissions - Get current user's permissions
 *
 * Returns the user's assigned permissions based on their personas/roles.
 * Owner users get all permissions.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return unauthorizedResponse()
    }

    const dbUser = await prisma.user.findFirst({
      where: { email: authUser.email },
      include: {
        tenant: { select: { id: true, name: true } },
        storeAccess: { include: { store: { select: { id: true, name: true } } } },
        userPersonas: {
          include: {
            persona: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    })

    if (!dbUser) {
      return unauthorizedResponse('User not found')
    }

    // Collect all permissions
    const permissions: string[] = []

    if (dbUser.isOwner) {
      // Owner has all permissions
      permissions.push('*')
    } else {
      // Aggregate permissions from all personas
      for (const up of dbUser.userPersonas) {
        for (const perm of up.persona.permissions) {
          const key = `${perm.module}_${perm.action}`
          if (!permissions.includes(key)) {
            permissions.push(key)
          }
        }
      }
    }

    // Derive menu visibility from permissions
    const menuAccess: Record<string, boolean> = {
      dashboard: true, // Always visible
      stores: dbUser.isOwner || permissions.includes('STORE_VIEW_VIEW'),
      billing: dbUser.isOwner || permissions.some(p => p.startsWith('BILLING_')),
      inventory: dbUser.isOwner || permissions.some(p => p.startsWith('INVENTORY_')),
      customers: dbUser.isOwner || permissions.some(p => p.startsWith('CUSTOMER_')),
      vendors: dbUser.isOwner || permissions.some(p => p.startsWith('VENDOR_')),
      reports: dbUser.isOwner || permissions.includes('REPORT_VIEW_VIEW'),
      team: dbUser.isOwner || permissions.some(p => p.startsWith('USER_')),
      settings: dbUser.isOwner || permissions.some(p => p.startsWith('SETTINGS_')),
      categories: dbUser.isOwner || permissions.some(p => p.startsWith('PRODUCT_')),
      purchases: dbUser.isOwner || permissions.some(p => p.startsWith('PURCHASE_')),
    }

    return successResponse({
      user: {
        id: dbUser.id,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        email: dbUser.email,
        isOwner: dbUser.isOwner,
        tenantId: dbUser.tenantId,
      },
      permissions,
      menuAccess,
      stores: dbUser.storeAccess.map(sa => ({
        id: sa.store.id,
        name: sa.store.name,
        isDefault: sa.isDefault
      }))
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return unauthorizedResponse('Failed to fetch permissions')
  }
}