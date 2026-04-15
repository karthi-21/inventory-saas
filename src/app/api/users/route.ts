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

/**
 * GET /api/users - List users in the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('USER_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const search = searchParams.get('search')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (!includeInactive) where.isActive = true

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          storeAccess: { include: { store: { select: { id: true, name: true } } } },
          userPersonas: { include: { persona: { select: { id: true, name: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return paginatedResponse(users, total, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/users - Invite / create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('USER_CREATE', 'CREATE')
    if (error) return error

    const body = await request.json()
    const { email, firstName, lastName, phone, personaId, storeIds } = body

    const validationError = validateRequired(body, ['email', 'firstName'])
    if (validationError) return errorResponse(validationError, 400)

    // Check for duplicate email in tenant
    const existing = await prisma.user.findFirst({
      where: { tenantId: user.tenantId, email },
    })
    if (existing) return errorResponse('A user with this email already exists', 409)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        tenantId: user.tenantId,
        email,
        firstName,
        lastName: lastName || null,
        phone: phone || null,
        isActive: true,
      },
    })

    // Assign persona if provided
    if (personaId) {
      const persona = await prisma.persona.findFirst({
        where: { id: personaId, tenantId: user.tenantId },
      })
      if (persona) {
        await prisma.userPersona.create({
          data: { userId: newUser.id, personaId },
        })
      }
    }

    // Assign store access if provided
    if (storeIds && Array.isArray(storeIds) && storeIds.length > 0) {
      await prisma.userStoreAccess.createMany({
        data: storeIds.map((storeId: string, index: number) => ({
          userId: newUser.id,
          storeId,
          isDefault: index === 0,
        })),
      })
    }

    // Fetch with relations for response
    const result = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        storeAccess: { include: { store: { select: { id: true, name: true } } } },
        userPersonas: { include: { persona: { select: { id: true, name: true } } } },
      },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'USER_CREATE',
      module: 'USER_CREATE',
      entityType: 'User',
      entityId: newUser.id,
      metadata: { email, firstName },
    })

    return createdResponse(result)
  } catch (error) {
    return handlePrismaError(error)
  }
}