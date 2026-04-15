import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { LocationType } from '@prisma/client'
import {
  requirePermission,
  successResponse,
  notFoundResponse,
  errorResponse,
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

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/locations/[id] - Update a location
 * Body: { name?, type?, isActive? } (all optional)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requirePermission('STORE_EDIT', 'EDIT')
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Find the location and verify it belongs to a store in the user's tenant
    const existing = await prisma.location.findFirst({
      where: { id },
      include: { store: { select: { tenantId: true, id: true } } },
    })

    if (!existing) return notFoundResponse('Location')
    if (existing.store.tenantId !== user.tenantId) {
      return notFoundResponse('Location')
    }

    // Verify user has access to this store
    if (!userHasStoreAccess(user, existing.storeId)) {
      return errorResponse('You do not have access to this store', 403)
    }

    const { name, type, isActive } = body

    // Validate location type if provided
    if (type !== undefined && !VALID_LOCATION_TYPES.includes(type)) {
      return errorResponse(
        `Invalid location type. Must be one of: ${VALID_LOCATION_TYPES.join(', ')}`,
        400
      )
    }

    // If deactivating, check that this isn't the last active location in the store
    if (isActive === false && existing.isActive) {
      const activeCount = await prisma.location.count({
        where: { storeId: existing.storeId, isActive: true },
      })
      if (activeCount <= 1) {
        return errorResponse('Cannot deactivate the last active location in a store', 400)
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOCATION_UPDATE',
      module: 'STORE_EDIT',
      entityType: 'Location',
      entityId: id,
      metadata: { name, type, isActive },
    })

    return successResponse(location)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/locations/[id] - Soft-delete a location (set isActive = false)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requirePermission('STORE_EDIT', 'EDIT')
    if (error) return error

    const { id } = await params

    // Find the location and verify it belongs to a store in the user's tenant
    const existing = await prisma.location.findFirst({
      where: { id },
      include: { store: { select: { tenantId: true } } },
    })

    if (!existing) return notFoundResponse('Location')
    if (existing.store.tenantId !== user.tenantId) {
      return notFoundResponse('Location')
    }

    // Verify user has access to this store
    if (!userHasStoreAccess(user, existing.storeId)) {
      return errorResponse('You do not have access to this store', 403)
    }

    // Don't allow deleting the last active location in a store
    const activeCount = await prisma.location.count({
      where: { storeId: existing.storeId, isActive: true },
    })
    if (activeCount <= 1) {
      return errorResponse('Cannot delete the last active location in a store', 400)
    }

    // Soft delete
    const location = await prisma.location.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOCATION_DELETE',
      module: 'STORE_EDIT',
      entityType: 'Location',
      entityId: id,
      metadata: { name: existing.name, storeId: existing.storeId },
    })

    return successResponse({ deleted: true, id: location.id })
  } catch (error) {
    return handlePrismaError(error)
  }
}