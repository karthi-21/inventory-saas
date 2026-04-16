import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, getPagination, handlePrismaError } from '@/lib/api'

/**
 * GET /api/emails/logs
 * List email activity for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const template = searchParams.get('template')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (template) where.template = template
    if (status) where.status = status

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emailLog.count({ where }),
    ])

    return NextResponse.json({ data: logs, total, page, limit })
  } catch (err) {
    return handlePrismaError(err)
  }
}
