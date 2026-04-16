import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/reports/gstr3b - Generate GSTR-3B summary
 *
 * Query params: period (YYYY-MM), storeId
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('REPORT_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const storeId = searchParams.get('storeId')

    if (!period) {
      return errorResponse('Period parameter is required (YYYY-MM format)', 400)
    }

    const [year, month] = period.split('-').map(Number)
    if (!year || !month || month < 1 || month > 12) {
      return errorResponse('Invalid period format. Use YYYY-MM', 400)
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const stores = await prisma.store.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true }
    })
    const storeIds = stores.map(s => s.id)

    const where: Record<string, unknown> = {
      invoiceStatus: 'ACTIVE',
      invoiceDate: { gte: startDate, lte: endDate }
    }

    if (storeId) {
      where.storeId = storeId
    } else {
      where.storeId = { in: storeIds }
    }

    const invoices = await prisma.salesInvoice.findMany({
      where,
      include: {
        customer: { select: { state: true, gstin: true } },
        items: {
          include: {
            product: { select: { gstRate: true } }
          }
        }
      }
    })

    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { state: true, gstin: true }
    })

    const tenantState = tenant?.state || ''

    // Table 3.1: Outward supplies and inward supplies (liable to reverse charge)
    const rateWiseSummary = new Map<number, {
      gstRate: number
      intraState: { taxableValue: number; cgst: number; sgst: number }
      interState: { taxableValue: number; igst: number }
    }>()

    for (const inv of invoices) {
      const isInterState = inv.customer?.state && inv.customer.state !== tenantState

      for (const item of inv.items) {
        const rate = item.gstRate || item.product?.gstRate || 18
        const taxableValue = Number(item.totalAmount) - Number(item.gstAmount)
        const gstAmount = Number(item.gstAmount)

        const existing = rateWiseSummary.get(rate) || {
          gstRate: rate,
          intraState: { taxableValue: 0, cgst: 0, sgst: 0 },
          interState: { taxableValue: 0, igst: 0 }
        }

        if (isInterState) {
          existing.interState.taxableValue += taxableValue
          existing.interState.igst += gstAmount
        } else {
          existing.intraState.taxableValue += taxableValue
          existing.intraState.cgst += gstAmount / 2
          existing.intraState.sgst += gstAmount / 2
        }

        rateWiseSummary.set(rate, existing)
      }
    }

    // Totals
    const totalTaxableValue = invoices.reduce((sum, inv) => sum + Number(inv.subtotal) - Number(inv.totalDiscount), 0)
    const totalCgst = Array.from(rateWiseSummary.values()).reduce((sum, r) => sum + r.intraState.cgst, 0)
    const totalSgst = Array.from(rateWiseSummary.values()).reduce((sum, r) => sum + r.intraState.sgst, 0)
    const totalIgst = Array.from(rateWiseSummary.values()).reduce((sum, r) => sum + r.interState.igst, 0)

    return successResponse({
      period,
      gstin: tenant?.gstin || '',
      state: tenantState,
      table31: Array.from(rateWiseSummary.values()),
      summary: {
        totalInvoices: invoices.length,
        totalTaxableValue,
        totalCgst: Math.round(totalCgst * 100) / 100,
        totalSgst: Math.round(totalSgst * 100) / 100,
        totalIgst: Math.round(totalIgst * 100) / 100,
        totalTax: Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100,
        totalAmount: invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
      }
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}