import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/loyalty/dashboard - Loyalty dashboard stats
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('CUSTOMER_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    // Get loyalty settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    if (!settings?.loyaltyEnabled) {
      return successResponse({
        loyaltyEnabled: false,
        totalActivePoints: 0,
        pointsEarnedThisMonth: 0,
        pointsRedeemedThisMonth: 0,
        topCustomers: [],
      })
    }

    // Calculate date ranges
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Build customer filter
    const customerWhere: Record<string, unknown> = {
      tenantId: user.tenantId,
      loyaltyPoints: { gt: 0 },
    }
    if (storeId) customerWhere.storeId = storeId

    // Total active points
    const totalActivePoints = await prisma.customer.aggregate({
      where: customerWhere,
      _sum: { loyaltyPoints: true },
    })

    // Points earned this month
    const pointsEarned = await prisma.loyaltyPointsLog.aggregate({
      where: {
        customer: { tenantId: user.tenantId },
        points: { gt: 0 },
        createdAt: { gte: monthStart },
      },
      _sum: { points: true },
    })

    // Points redeemed this month
    const pointsRedeemed = await prisma.loyaltyPointsLog.aggregate({
      where: {
        customer: { tenantId: user.tenantId },
        points: { lt: 0 },
        createdAt: { gte: monthStart },
      },
      _sum: { points: true },
    })

    // Top loyal customers
    const topCustomers = await prisma.customer.findMany({
      where: {
        ...customerWhere,
      },
      orderBy: { loyaltyPoints: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        loyaltyPoints: true,
      },
    })

    return successResponse({
      loyaltyEnabled: settings.loyaltyEnabled,
      pointsPerRupee: Number(settings.pointsPerRupee),
      rupeePerPoint: Number(settings.rupeePerPoint),
      totalActivePoints: totalActivePoints._sum.loyaltyPoints || 0,
      pointsEarnedThisMonth: pointsEarned._sum.points || 0,
      pointsRedeemedThisMonth: Math.abs(pointsRedeemed._sum.points || 0),
      topCustomers: topCustomers.map(c => ({
        id: c.id,
        name: `${c.firstName}${c.lastName ? ' ' + c.lastName : ''}`,
        phone: c.phone,
        points: c.loyaltyPoints,
        value: Number((c.loyaltyPoints * Number(settings.rupeePerPoint)).toFixed(2)),
      })),
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}