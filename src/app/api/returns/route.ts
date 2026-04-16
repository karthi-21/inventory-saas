import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  handlePrismaError,
  getPagination
} from '@/lib/api'

/**
 * GET /api/returns - List all returns with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const storeId = searchParams.get('storeId')
    const invoiceId = searchParams.get('invoiceId')

    // Build where clause through invoice relation
    const invoiceWhere: Record<string, unknown> = { tenantId: user.tenantId }
    if (storeId) invoiceWhere.storeId = storeId

    const where: Record<string, unknown> = {}
    if (invoiceId) where.invoiceId = invoiceId
    where.invoice = invoiceWhere

    const [returns, total] = await Promise.all([
      prisma.salesReturn.findMany({
        where,
        include: {
          items: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              customer: { select: { id: true, firstName: true, lastName: true } },
              store: { select: { id: true, name: true } }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesReturn.count({ where })
    ])

    return successResponse({
      data: returns,
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