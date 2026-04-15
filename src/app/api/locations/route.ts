import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { LocationType } from '@prisma/client'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  validateRequired,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

const VALID_LOCATION_TYPES = Object.values(LocationType)

/**
 * Check if user has access to a given store.
 * Owners always have access; non-owners must have a UserStoreAccess record.
 */
function userHasStoreAccess(
  user: NonNullable<Awaited<ReturnType<typeof import('@/lib/api').getAuthUserWithAccess>>>,
  storeId: string
): boolean {
  if (user.isOwner) return true
  return user.storeAccess.some((sa) => sa.storeId === storeId)
}

/**
 * GET /api/locations - List locations for a store
 * Query params: storeId (required), includeInactive (optional), type (optional filter by LocationType)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('STORE_EDIT', 'EDIT')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    if (!storeId) return errorResponse('Missing required query param: storeId', 400)

    // Verify user has access to this store
    if (!userHasStoreAccess(user, storeId)) {
      return errorResponse('You do not have access to this store', 403)
    }

    // Verify the store belongs to the user's tenant
    const store = await prisma.store.findFirst({
      where: { id: storeId, tenantId: user.tenantId },
    })
    if (!store) return errorResponse('Store not found', 404)

    const includeInactive = searchParams.get('includeInactive') === 'true'
    const typeFilter = searchParams.get('type')

    const where: Record<string, unknown> = { storeId }
    if (!includeInactive) {
      where.isActive = true
    }
    if (typeFilter) {
      if (!VALID_LOCATION_TYPES.includes(typeFilter as LocationType)) {
        return errorResponse(
          `Invalid location type. Must be one of: ${VALID_LOCATION_TYPES.join(', ')}`,
          400
        )
      }
      where.type = typeFilter
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.location.count({ where }),
    ])

    return successResponse({ data: locations, total })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/locations - Create a new location
 * Body: { storeId, name, type } (all required)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('STORE_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const validationError = validateRequired(body, ['storeId', 'name', 'type'])
    if (validationError) return errorResponse(validationError, 400)

    const { storeId, name, type } = body

    // Validate location type
    if (!VALID_LOCATION_TYPES.includes(type)) {
      return errorResponse(
        `Invalid location type. Must be one of: ${VALID_LOCATION_TYPES.join(', ')}`,
        400
      )
    }

    // Verify user has access to this store
    if (!userHasStoreAccess(user, storeId)) {
      return errorResponse('You do not have access to this store', 403)
    }

    // Verify the store belongs to the user's tenant
    const store = await prisma.store.findFirst({
      where: { id: storeId, tenantId: user.tenantId },
    })
    if (!store) return errorResponse('Store not found', 404)

    const location = await prisma.location.create({
      data: {
        storeId,
        name,
        type,
        isActive: true,
      },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOCATION_CREATE',
      module: 'STORE_EDIT',
      entityType: 'Location',
      entityId: location.id,
      metadata: { storeId, name, type },
    })

    return createdResponse(location)
  } catch (error) {
    return handlePrismaError(error)
  }
}