import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  logActivity,
  handlePrismaError,
  getPagination
} from '@/lib/api'

/**
 * GET /api/customers/[id]/loyalty - Get loyalty points history for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('CUSTOMER_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const type = searchParams.get('type') // 'EARN', 'REDEEM', 'ADJUST', 'EXPIRY'

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer || customer.tenantId !== user.tenantId) {
      return errorResponse('Customer not found', 404)
    }

    const where: Record<string, unknown> = { customerId: id }
    if (type) {
      // Filter by point type (positive = earn, negative = redeem, etc.)
      if (type === 'EARN') where.points = { gt: 0 }
      else if (type === 'REDEEM') where.points = { lt: 0 }
    }

    const [logs, total] = await Promise.all([
      prisma.loyaltyPointsLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loyaltyPointsLog.count({ where }),
    ])

    return successResponse({
      customer: {
        id: customer.id,
        name: `${customer.firstName}${customer.lastName ? ' ' + customer.lastName : ''}`,
        loyaltyPoints: customer.loyaltyPoints,
        creditBalance: Number(customer.creditBalance),
      },
      pointsHistory: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/customers/[id]/loyalty - Manual points adjustment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('CUSTOMER_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { points, reason, referenceType, referenceId } = body as {
      points: number
      reason: string
      referenceType?: string
      referenceId?: string
    }

    if (!points || points === 0) {
      return errorResponse('Points must be non-zero', 400)
    }

    if (!reason || reason.trim().length === 0) {
      return errorResponse('Reason is required for manual adjustment', 400)
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer || customer.tenantId !== user.tenantId) {
      return errorResponse('Customer not found', 404)
    }

    // Check if customer would go negative (for redemptions)
    if (customer.loyaltyPoints + points < 0) {
      return errorResponse(
        `Cannot deduct ${Math.abs(points)} points. Customer only has ${customer.loyaltyPoints} points.`,
        400
      )
    }

    // Check minimum redemption for deductions
    if (points < 0) {
      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId: user.tenantId },
      })
      if (settings && Math.abs(points) < settings.minimumRedemption) {
        return errorResponse(
          `Minimum redemption is ${settings.minimumRedemption} points. Attempted: ${Math.abs(points)}`,
          400
        )
      }
    }

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create points log
      const log = await tx.loyaltyPointsLog.create({
        data: {
          customerId: id,
          points,
          referenceType: referenceType || 'MANUAL_ADJUSTMENT',
          referenceId: referenceId || null,
          notes: reason,
        },
      })

      // Update customer points
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: {
          loyaltyPoints: { increment: points },
        },
      })

      return { log, customer: updatedCustomer }
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: points > 0 ? 'LOYALTY_POINTS_ADDED' : 'LOYALTY_POINTS_DEDUCTED',
      module: 'CUSTOMER_EDIT',
      entityType: 'Customer',
      entityId: id,
      metadata: {
        points,
        reason,
        previousBalance: customer.loyaltyPoints,
        newBalance: result.customer.loyaltyPoints,
      },
    })

    return successResponse({
      message: points > 0
        ? `Added ${points} loyalty points`
        : `Deducted ${Math.abs(points)} loyalty points`,
      points: result.customer.loyaltyPoints,
      log: result.log,
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}