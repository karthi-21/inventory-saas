import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
  validateRequired,
  handlePrismaError,
  logActivity,
} from '@/lib/api'
import { PermissionModule, PermissionAction } from '@prisma/client'

/**
 * GET /api/personas - List personas with permissions
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('USER_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)

    const where = { tenantId: user.tenantId }

    const [personas, total] = await Promise.all([
      prisma.persona.findMany({
        where,
        include: {
          permissions: true,
          _count: { select: { userPersonas: true } },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.persona.count({ where }),
    ])

    return paginatedResponse(personas, total, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/personas - Create a custom role/persona
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('USER_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { name, description, permissions } = body

    const validationError = validateRequired(body, ['name'])
    if (validationError) return errorResponse(validationError, 400)

    // Check for duplicate name in tenant
    const existing = await prisma.persona.findFirst({
      where: { tenantId: user.tenantId, name },
    })
    if (existing) return errorResponse('A role with this name already exists', 409)

    // Create persona with permissions
    const persona = await prisma.persona.create({
      data: {
        tenantId: user.tenantId,
        name,
        description: description || null,
        isSystem: false,
        permissions: permissions && Array.isArray(permissions)
          ? {
              create: permissions.map((p: { module: string; action: string }) => ({
                module: p.module as PermissionModule,
                action: p.action as PermissionAction,
              })),
            }
          : undefined,
      },
      include: { permissions: true },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PERSONA_CREATE',
      module: 'USER_EDIT',
      entityType: 'Persona',
      entityId: persona.id,
      metadata: { name },
    })

    return createdResponse(persona)
  } catch (error) {
    return handlePrismaError(error)
  }
}