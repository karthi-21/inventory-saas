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
  generateStoreCode,
  handlePrismaError,
  logActivity
} from '@/lib/api'

/**
 * GET /api/stores - List all stores for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('STORE_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const search = searchParams.get('search')

    // Build where clause
    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (!includeInactive) {
      where.isActive = true
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get stores with pagination
    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: {
          locations: true,
          _count: {
            select: { users: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.store.count({ where })
    ])

    return paginatedResponse(stores, total, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/stores - Create a new store
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('STORE_EDIT', 'CREATE')
    if (error) return error

    const body = await request.json()
    const { name, storeType, address, state, pincode, phone, locations = [] } = body

    // Validate required fields
    const validationError = validateRequired(body, ['name', 'storeType'])
    if (validationError) return errorResponse(validationError, 400)

    // Generate store code
    const code = await generateStoreCode(user.tenantId)

    // Create store with default location
    const store = await prisma.store.create({
      data: {
        tenantId: user.tenantId,
        name,
        code,
        storeType,
        address,
        state,
        pincode,
        phone,
        isActive: true,
        locations: {
          create: locations.length > 0
            ? locations.map((loc: { name: string; type: string }) => ({
                name: loc.name,
                type: loc.type,
                isActive: true
              }))
            : [{
                name: 'Main Location',
                type: storeType === 'RESTAURANT' ? 'KITCHEN' : 'SHOWROOM',
                isActive: true
              }]
        }
      },
      include: {
        locations: true
      }
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STORE_CREATE',
      module: 'STORE_EDIT',
      entityType: 'Store',
      entityId: store.id,
      metadata: { storeName: name, storeType }
    })

    return createdResponse(store)
  } catch (error) {
    return handlePrismaError(error)
  }
}
