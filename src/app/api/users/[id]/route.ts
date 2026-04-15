import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  notFoundResponse,
  successResponse,
  errorResponse,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

/**
 * PUT /api/users/[id] - Update user role/store access
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('USER_EDIT', 'EDIT')
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Verify user belongs to same tenant
    const existing = await prisma.user.findFirst({
      where: { id, tenantId: user.tenantId },
    })
    if (!existing) return notFoundResponse('User')

    // Prevent deactivating the owner
    if (existing.isOwner && body.isActive === false) {
      return errorResponse('Cannot deactivate the owner account', 400)
    }

    const { firstName, lastName, phone, personaId, storeIds, isActive } = body

    // Update basic info
    const updateData: Record<string, unknown> = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    // Update persona assignment if provided
    if (personaId !== undefined) {
      await prisma.userPersona.deleteMany({ where: { userId: id } })
      if (personaId) {
        const persona = await prisma.persona.findFirst({
          where: { id: personaId, tenantId: user.tenantId },
        })
        if (persona) {
          await prisma.userPersona.create({
            data: { userId: id, personaId },
          })
        }
      }
    }

    // Update store access if provided
    if (storeIds !== undefined) {
      await prisma.userStoreAccess.deleteMany({ where: { userId: id } })
      if (Array.isArray(storeIds) && storeIds.length > 0) {
        await prisma.userStoreAccess.createMany({
          data: storeIds.map((storeId: string, index: number) => ({
            userId: id,
            storeId,
            isDefault: index === 0,
          })),
        })
      }
    }

    // Fetch with relations for response
    const result = await prisma.user.findUnique({
      where: { id },
      include: {
        storeAccess: { include: { store: { select: { id: true, name: true } } } },
        userPersonas: { include: { persona: { select: { id: true, name: true } } } },
      },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'USER_UPDATE',
      module: 'USER_EDIT',
      entityType: 'User',
      entityId: id,
      metadata: { email: existing.email },
    })

    return successResponse(result)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/users/[id] - Deactivate user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('USER_DELETE', 'DELETE')
    if (error) return error

    const { id } = await params

    const existing = await prisma.user.findFirst({
      where: { id, tenantId: user.tenantId },
    })
    if (!existing) return notFoundResponse('User')

    // Prevent deactivating the owner
    if (existing.isOwner) {
      return errorResponse('Cannot deactivate the owner account', 400)
    }

    // Soft delete by deactivating
    const deactivated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'USER_DEACTIVATE',
      module: 'USER_DELETE',
      entityType: 'User',
      entityId: id,
      metadata: { email: existing.email },
    })

    return successResponse({ deactivated: true, id: deactivated.id })
  } catch (error) {
    return handlePrismaError(error)
  }
}