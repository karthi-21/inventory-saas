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
import { PermissionModule, PermissionAction } from '@prisma/client'

/**
 * PUT /api/personas/[id] - Update persona permissions
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
    const { name, description, permissions } = body

    // Verify persona belongs to tenant
    const existing = await prisma.persona.findFirst({
      where: { id, tenantId: user.tenantId },
    })
    if (!existing) return notFoundResponse('Persona')

    // Update basic info
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description

    await prisma.persona.update({
      where: { id },
      data: updateData,
    })

    // Update permissions if provided (replace all)
    if (permissions !== undefined && Array.isArray(permissions)) {
      // Delete existing permissions and create new ones
      await prisma.personaPermission.deleteMany({
        where: { personaId: id },
      })

      if (permissions.length > 0) {
        await prisma.personaPermission.createMany({
          data: permissions.map((p: { module: string; action: string }) => ({
            personaId: id,
            module: p.module as PermissionModule,
            action: p.action as PermissionAction,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Fetch with updated permissions
    const result = await prisma.persona.findUnique({
      where: { id },
      include: { permissions: true },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PERSONA_UPDATE',
      module: 'USER_EDIT',
      entityType: 'Persona',
      entityId: id,
      metadata: { name: existing.name },
    })

    return successResponse(result)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/personas/[id] - Delete a custom persona
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('USER_DELETE', 'DELETE')
    if (error) return error

    const { id } = await params

    const existing = await prisma.persona.findFirst({
      where: { id, tenantId: user.tenantId },
    })
    if (!existing) return notFoundResponse('Persona')

    // Prevent deleting system personas
    if (existing.isSystem) {
      return errorResponse('Cannot delete system roles', 400)
    }

    // Check if any users are assigned this persona
    const assignmentCount = await prisma.userPersona.count({
      where: { personaId: id },
    })
    if (assignmentCount > 0) {
      return errorResponse(
        `Cannot delete: ${assignmentCount} user(s) are assigned this role. Reassign them first.`,
        409
      )
    }

    // Delete persona (cascades to permissions)
    await prisma.persona.delete({ where: { id } })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PERSONA_DELETE',
      module: 'USER_DELETE',
      entityType: 'Persona',
      entityId: id,
      metadata: { name: existing.name },
    })

    return successResponse({ deleted: true, id })
  } catch (error) {
    return handlePrismaError(error)
  }
}