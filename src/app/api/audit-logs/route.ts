import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  getPagination,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/audit-logs - List activity logs with filters
 *
 * Query params: userId, action, entityType, entityId, from, to, search, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)

    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { tenantId: user.tenantId }

    if (userId) where.userId = userId
    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId

    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) dateFilter.lte = new Date(to)
      where.createdAt = dateFilter
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.activityLog.count({ where })
    ])

    return successResponse({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}