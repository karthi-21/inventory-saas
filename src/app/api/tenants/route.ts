import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { errorResponse, createdResponse, handlePrismaError } from '@/lib/api'

/**
 * POST /api/tenants - Create a new tenant (used during signup)
 * This endpoint doesn't require authentication as it's called during the signup flow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, userId } = body

    if (!name || !userId) {
      return errorResponse('Missing required fields: name, userId', 400)
    }

    // Get the Supabase user to verify and get email
    const supabase = await createServerSupabaseClient()
    const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()

    if (userError || !supabaseUser || supabaseUser.id !== userId) {
      return errorResponse('Invalid or unauthorized user', 401)
    }

    // Check if tenant already exists for this user
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        users: {
          some: {
            email: supabaseUser.email
          }
        }
      }
    })

    if (existingTenant) {
      return errorResponse('Tenant already exists for this user', 409)
    }

    // Create tenant, user, store, and store access in a single transaction
    const subdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50)
    const { tenant, store, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name,
          subdomain,
          users: {
            create: {
              email: supabaseUser.email!,
              firstName: supabaseUser.user_metadata?.store_name || name,
              phone: supabaseUser.user_metadata?.phone || null,
              isActive: true,
            }
          }
        },
        include: {
          users: true
        }
      })

      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: name,
          code: 'STR-001',
          storeType: 'MULTI_CATEGORY',
          isActive: true,
          locations: {
            create: {
              name: 'Main Location',
              type: 'SHOWROOM',
              isActive: true
            }
          }
        },
        include: {
          locations: true
        }
      })

      await tx.user.update({
        where: { id: tenant.users[0].id },
        data: {
          storeAccess: {
            create: {
              storeId: store.id,
            }
          }
        }
      })

      return { tenant, store, user: tenant.users[0] }
    })

    return createdResponse({ tenant, store, user })
  } catch (error) {
    return handlePrismaError(error)
  }
}
