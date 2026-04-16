import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/reports/gstr1 - Generate GSTR-1 data (outward supplies)
 *
 * Query params: period (YYYY-MM), storeId
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('REPORT_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') // YYYY-MM format
    const storeId = searchParams.get('storeId')

    if (!period) {
      return errorResponse('Period parameter is required (YYYY-MM format)', 400)
    }

    // Parse period
    const [year, month] = period.split('-').map(Number)
    if (!year || !month || month < 1 || month > 12) {
      return errorResponse('Invalid period format. Use YYYY-MM', 400)
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Build where clause for active invoices
    const where: Record<string, unknown> = {
      invoiceStatus: 'ACTIVE',
      invoiceDate: { gte: startDate, lte: endDate }
    }

    // Filter by tenant through store
    const stores = await prisma.store.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true }
    })
    const storeIds = stores.map(s => s.id)

    if (storeId) {
      where.storeId = storeId
    } else {
      where.storeId = { in: storeIds }
    }

    // Get all invoices with items for the period
    const invoices = await prisma.salesInvoice.findMany({
      where,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, gstin: true, state: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, hsnCode: true, gstRate: true } },
            variant: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { invoiceDate: 'asc' }
    })

    // Get tenant GSTIN for determining intra/inter-state
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { id: true, name: true, gstin: true, state: true }
    })

    const tenantState = tenant?.state || ''
    const tenantGstin = tenant?.gstin || ''

    // B2B Invoices (customer has GSTIN)
    const b2bInvoices = invoices.filter(inv => inv.customer?.gstin)

    // B2C Invoices (no customer GSTIN)
    const b2cInvoices = invoices.filter(inv => !inv.customer?.gstin)

    // HSN Summary
    const hsnMap = new Map<string, {
      hsnCode: string
      description: string
      quantity: number
      taxableValue: number
      cgst: number
      sgst: number
      igst: number
      totalTax: number
    }>()

    for (const inv of invoices) {
      for (const item of inv.items) {
        const hsn = item.hsnCode || item.product?.hsnCode || 'N/A'
        const taxableValue = Number(item.totalAmount) - Number(item.gstAmount)
        const gstRate = item.gstRate || item.product?.gstRate || 18
        const isInterState = inv.customer?.state && inv.customer.state !== tenantState

        const gstAmount = Number(item.gstAmount)
        let cgst = 0, sgst = 0, igst = 0

        if (isInterState) {
          igst = gstAmount
        } else {
          cgst = gstAmount / 2
          sgst = gstAmount / 2
        }

        const existing = hsnMap.get(hsn) || {
          hsnCode: hsn,
          description: item.description || item.product?.name || 'Unknown',
          quantity: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalTax: 0
        }

        existing.quantity += item.quantity
        existing.taxableValue += taxableValue
        existing.cgst += cgst
        existing.sgst += sgst
        existing.igst += igst
        existing.totalTax += gstAmount

        hsnMap.set(hsn, existing)
      }
    }

    // Document Summary
    const documentSummary = {
      totalInvoices: invoices.length,
      totalB2b: b2bInvoices.length,
      totalB2c: b2cInvoices.length,
      totalTaxableValue: invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0),
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalTax: invoices.reduce((sum, inv) => sum + Number(inv.totalGst), 0),
      totalAmount: invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
    }

    return successResponse({
      period,
      tenant: { name: tenant?.name, gstin: tenantGstin, state: tenantState },
      b2b: b2bInvoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customerGstin: inv.customer?.gstin,
        customerName: inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName || ''}`.trim() : 'Walk-in Customer',
        taxableValue: Number(inv.subtotal) - Number(inv.totalDiscount),
        cgst: Number(inv.totalGst) / 2,
        sgst: Number(inv.totalGst) / 2,
        igst: 0,
        totalTax: Number(inv.totalGst),
        totalAmount: Number(inv.totalAmount)
      })),
      b2c: {
        large: [], // > 2.5L inter-state
        small: b2cInvoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          taxableValue: Number(inv.subtotal) - Number(inv.totalDiscount),
          cgst: Number(inv.totalGst) / 2,
          sgst: Number(inv.totalGst) / 2,
          igst: 0,
          totalTax: Number(inv.totalGst),
          totalAmount: Number(inv.totalAmount)
        }))
      },
      hsnSummary: Array.from(hsnMap.values()),
      documentSummary
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}