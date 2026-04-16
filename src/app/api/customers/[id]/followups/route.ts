import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, successResponse, createdResponse, errorResponse, getPagination, handlePrismaError } from '@/lib/api'

/**
 * POST /api/customers/[id]/followups — Log a follow-up
 * GET /api/customers/[id]/followups — Get follow-up history
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('CUSTOMER_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)

    const customer = await prisma.customer.findFirst({ where: { id, tenantId: user.tenantId } })
    if (!customer) return errorResponse('Customer not found', 404)

    const [followups, total] = await Promise.all([
      prisma.followUp.findMany({ where: { customerId: id }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.followUp.count({ where: { customerId: id } }),
    ])

    return successResponse({ followups, total, page, limit })
  } catch (err) { return handlePrismaError(err) }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('CUSTOMER_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { type, notes, nextDate } = body as { type: string; notes?: string; nextDate?: string }

    if (!type) return errorResponse('type is required (EMAIL_SENT, CALL, VISIT, WHATSAPP_LINK, MANUAL)', 400)

    const customer = await prisma.customer.findFirst({ where: { id, tenantId: user.tenantId } })
    if (!customer) return errorResponse('Customer not found', 404)

    const followUp = await prisma.followUp.create({
      data: {
        customerId: id,
        type,
        notes,
        nextDate: nextDate ? new Date(nextDate) : null,
      },
    })

    return createdResponse(followUp)
  } catch (err) { return handlePrismaError(err) }
}
