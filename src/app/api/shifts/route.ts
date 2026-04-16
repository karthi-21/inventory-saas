import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  getPagination,
  logActivity,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/shifts - List shifts with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const storeId = searchParams.get('storeId')
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status') // 'OPEN' or 'CLOSED'

    const where: Record<string, unknown> = {}
    if (storeId) where.storeId = storeId
    if (locationId) where.locationId = locationId
    if (status) where.status = status

    // Filter by tenant through store relation
    if (!storeId) {
      const stores = await prisma.store.findMany({
        where: { tenantId: user.tenantId },
        select: { id: true }
      })
      where.storeId = { in: stores.map(s => s.id) }
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where,
        include: {
          cashier: { select: { id: true, firstName: true, lastName: true } },
          store: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { openedAt: 'desc' }
      }),
      prisma.shift.count({ where })
    ])

    return successResponse({
      data: shifts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/shifts - Open a new shift
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_CREATE', 'CREATE')
    if (error) return error

    const body = await request.json()
    const { storeId, locationId, openingCash } = body as {
      storeId: string
      locationId?: string
      openingCash: number
    }

    if (!storeId) {
      return errorResponse('Store ID is required', 400)
    }

    if (openingCash === undefined || openingCash < 0) {
      return errorResponse('Opening cash amount is required', 400)
    }

    // Check if there's already an active shift for this location
    if (locationId) {
      const activeShift = await prisma.shift.findFirst({
        where: { locationId, status: 'OPEN' }
      })
      if (activeShift) {
        return errorResponse('There is already an active shift at this counter. Close it first.', 409)
      }
    }

    const shift = await prisma.shift.create({
      data: {
        storeId,
        locationId: locationId || null,
        cashierId: user.id,
        openingCash,
        expectedCash: openingCash,
        status: 'OPEN'
      },
      include: {
        cashier: { select: { id: true, firstName: true, lastName: true } },
        store: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } }
      }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'SHIFT_OPEN',
      module: 'BILLING_CREATE',
      entityType: 'Shift',
      entityId: shift.id,
      metadata: { openingCash, storeId, locationId }
    })

    return createdResponse(shift)
  } catch (error) {
    return handlePrismaError(error)
  }
}