import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/reports/staff-performance - Staff performance metrics
 *
 * Query params: from, to, storeId, userId
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('REPORT_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const storeId = searchParams.get('storeId')
    const userId = searchParams.get('userId')

    const stores = await prisma.store.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true }
    })
    const storeIds = stores.map(s => s.id)

    // Build invoice where clause
    const invoiceWhere: Record<string, unknown> = {
      invoiceStatus: 'ACTIVE',
    }

    if (storeId) {
      invoiceWhere.storeId = storeId
    } else {
      invoiceWhere.storeId = { in: storeIds }
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) dateFilter.lte = new Date(to)
      invoiceWhere.invoiceDate = dateFilter
    }

    if (userId) {
      invoiceWhere.createdById = userId
    }

    // Get per-user sales data
    const userSales = await prisma.salesInvoice.groupBy({
      by: ['createdById'],
      where: invoiceWhere,
      _sum: {
        totalAmount: true,
        amountPaid: true,
      },
      _count: {
        id: true,
      },
    })

    // Get per-user credit vs cash split
    const userBillingTypes = await prisma.salesInvoice.groupBy({
      by: ['createdById', 'billingType'],
      where: invoiceWhere,
      _count: { id: true },
      _sum: { totalAmount: true },
    })

    // Get user details
    const userIds = userSales.map(s => s.createdById).filter(Boolean) as string[]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    // Assemble results
    const staffMetrics = userSales.map(sale => {
      const userInfo = userMap.get(sale.createdById!)
      const billingByType = userBillingTypes
        .filter(bt => bt.createdById === sale.createdById)
        .reduce((acc, bt) => {
          acc[bt.billingType] = {
            count: bt._count.id,
            total: Number(bt._sum.totalAmount || 0)
          }
          return acc
        }, {} as Record<string, { count: number; total: number }>)

      const totalSales = Number(sale._sum.totalAmount || 0)
      const totalTransactions = sale._count.id
      const avgTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0

      return {
        userId: sale.createdById,
        name: userInfo ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim() : 'Unknown',
        email: userInfo?.email,
        totalSales,
        totalTransactions,
        avgTransactionValue: Math.round(avgTransactionValue * 100) / 100,
        billingByType,
      }
    }).sort((a, b) => b.totalSales - a.totalSales)

    // Summary stats
    const totalRevenue = staffMetrics.reduce((sum, s) => sum + s.totalSales, 0)
    const totalTransactions = staffMetrics.reduce((sum, s) => sum + s.totalTransactions, 0)
    const avgPerStaff = staffMetrics.length > 0 ? totalRevenue / staffMetrics.length : 0

    return successResponse({
      staff: staffMetrics,
      summary: {
        totalRevenue,
        totalTransactions,
        avgPerStaff: Math.round(avgPerStaff * 100) / 100,
        staffCount: staffMetrics.length,
      }
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}