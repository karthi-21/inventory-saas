import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/shifts/current - Get current active shift for user/location
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const locationId = searchParams.get('locationId')

    const where: Record<string, unknown> = {
      cashierId: user.id,
      status: 'OPEN'
    }
    if (storeId) where.storeId = storeId
    if (locationId) where.locationId = locationId

    const shift = await prisma.shift.findFirst({
      where,
      include: {
        cashier: { select: { id: true, firstName: true, lastName: true } },
        store: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } }
      },
      orderBy: { openedAt: 'desc' }
    })

    return successResponse(shift)
  } catch (error) {
    return handlePrismaError(error)
  }
}