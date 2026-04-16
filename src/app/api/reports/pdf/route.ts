import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, handlePrismaError } from '@/lib/api'
import { generateReportPDF, formatINR, formatDate } from '@/lib/pdf-generator'

/**
 * GET /api/reports/sales/pdf - Sales report PDF
 * GET /api/reports/gst/pdf - GST report PDF
 * GET /api/reports/inventory/pdf - Inventory report PDF
 * GET /api/reports/outstanding/pdf - Outstanding payments PDF
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('REPORT_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'sales'
    const storeId = searchParams.get('storeId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Get store name for header
    const storeName = storeId
      ? (await prisma.store.findUnique({ where: { id: storeId } }))?.name || 'All Stores'
      : 'All Stores'

    let pdfBuffer: Buffer
    let filename: string

    switch (reportType) {
      case 'sales': {
        const where: Record<string, unknown> = { invoiceStatus: 'ACTIVE' }
        if (storeId) where.storeId = storeId
        if (from || to) {
          where.invoiceDate = {}
          if (from) (where.invoiceDate as Record<string, unknown>).gte = new Date(from)
          if (to) (where.invoiceDate as Record<string, unknown>).lte = new Date(to)
        }

        const [invoices, summary] = await Promise.all([
          prisma.salesInvoice.findMany({
            where,
            include: { customer: { select: { firstName: true, lastName: true } }, store: { select: { name: true } } },
            orderBy: { invoiceDate: 'desc' },
            take: 200,
          }),
          prisma.salesInvoice.aggregate({
            where,
            _sum: { totalAmount: true, totalGst: true, amountDue: true },
            _count: true,
          }),
        ])

        pdfBuffer = generateReportPDF({
          title: 'Sales Report',
          subtitle: from || to ? `From ${from || 'beginning'} to ${to || 'now'}` : undefined,
          storeName,
          headers: ['Bill #', 'Date', 'Customer', 'Type', 'Total', 'GST', 'Due'],
          rows: invoices.map(inv => [
            inv.invoiceNumber,
            formatDate(inv.invoiceDate),
            inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName || ''}`.trim() : 'Walk-in',
            inv.billingType,
            formatINR(Number(inv.totalAmount)),
            formatINR(Number(inv.totalGst)),
            formatINR(Number(inv.amountDue)),
          ]),
          summary: [
            { label: 'Total Revenue', value: formatINR(Number(summary._sum.totalAmount || 0)) },
            { label: 'Total GST', value: formatINR(Number(summary._sum.totalGst || 0)) },
            { label: 'Total Outstanding', value: formatINR(Number(summary._sum.amountDue || 0)) },
            { label: 'Bills', value: String(summary._count) },
          ],
        })
        filename = `sales-report-${from || 'all'}-${to || 'all'}.html`
        break
      }

      case 'gst': {
        const where: Record<string, unknown> = { invoiceStatus: 'ACTIVE' }
        if (storeId) where.storeId = storeId
        if (from || to) {
          where.invoiceDate = {}
          if (from) (where.invoiceDate as Record<string, unknown>).gte = new Date(from)
          if (to) (where.invoiceDate as Record<string, unknown>).lte = new Date(to)
        }

        const invoices = await prisma.salesInvoice.findMany({
          where,
          include: { items: true, customer: { select: { gstin: true, state: true } } },
          orderBy: { invoiceDate: 'desc' },
          take: 200,
        })

        // GST rate-wise summary
        const gstSummary = new Map<number, { taxable: number; cgst: number; sgst: number; igst: number }>()
        let totalCgst = 0, totalSgst = 0, totalIgst = 0, totalTaxable = 0

        for (const inv of invoices) {
          const sellerState = user.tenantId ? 'Tamil Nadu' : '' // Simplified
          for (const item of inv.items) {
            const taxable = Number(item.totalAmount) - Number(item.gstAmount)
            const rate = item.gstRate
            const gstAmt = Number(item.gstAmount)
            const isInterState = inv.customer?.state && inv.customer.state !== sellerState

            let entry = gstSummary.get(rate)
            if (!entry) {
              entry = { taxable: 0, cgst: 0, sgst: 0, igst: 0 }
              gstSummary.set(rate, entry)
            }
            entry.taxable += taxable

            if (isInterState) {
              entry.igst += gstAmt
              totalIgst += gstAmt
            } else {
              entry.cgst += gstAmt / 2
              entry.sgst += gstAmt / 2
              totalCgst += gstAmt / 2
              totalSgst += gstAmt / 2
            }
            totalTaxable += taxable
          }
        }

        pdfBuffer = generateReportPDF({
          title: 'GST Report',
          subtitle: from || to ? `From ${from || 'beginning'} to ${to || 'now'}` : undefined,
          storeName,
          headers: ['Rate %', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Tax'],
          rows: Array.from(gstSummary.entries()).sort((a, b) => a[0] - b[0]).map(([rate, data]) => [
            `${rate}%`,
            formatINR(data.taxable),
            formatINR(data.cgst),
            formatINR(data.sgst),
            formatINR(data.igst),
            formatINR(data.cgst + data.sgst + data.igst),
          ]),
          summary: [
            { label: 'Total Taxable', value: formatINR(totalTaxable) },
            { label: 'Total CGST', value: formatINR(totalCgst) },
            { label: 'Total SGST', value: formatINR(totalSgst) },
            { label: 'Total IGST', value: formatINR(totalIgst) },
          ],
        })
        filename = `gst-report-${from || 'all'}-${to || 'all'}.html`
        break
      }

      case 'inventory': {
        const where: Record<string, unknown> = {}
        if (storeId) where.storeId = storeId

        const stocks = await prisma.inventoryStock.findMany({
          where,
          include: {
            product: { select: { name: true, sku: true, hsnCode: true, gstRate: true, reorderLevel: true } },
            variant: { select: { name: true, sku: true } },
          },
          orderBy: { quantity: 'asc' },
          take: 200,
        })

        pdfBuffer = generateReportPDF({
          title: 'Stock Report',
          storeName,
          headers: ['Product', 'Product Code', 'Variant', 'Qty', 'Reorder Level', 'Status'],
          rows: stocks.map(s => {
            const product = s.product || { name: 'Unknown', sku: '-', reorderLevel: 10 }
            const reorderLevel = product.reorderLevel ?? 10
            return [
              product.name,
              product.sku,
              s.variant?.name || '-',
              String(s.quantity),
              String(reorderLevel),
              s.quantity <= 0 ? 'OUT OF STOCK' : s.quantity <= reorderLevel ? 'LOW' : 'OK',
            ]
          }),
          summary: [
            { label: 'Total Products', value: String(stocks.length) },
            { label: 'Out of Stock', value: String(stocks.filter(s => s.quantity <= 0).length) },
            { label: 'Low Stock', value: String(stocks.filter(s => s.quantity > 0 && s.quantity <= 10).length) },
          ],
        })
        filename = `inventory-report.html`
        break
      }

      case 'outstanding': {
        const where: Record<string, unknown> = {
          invoiceStatus: 'ACTIVE',
          paymentStatus: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
        }
        if (storeId) where.storeId = storeId

        const invoices = await prisma.salesInvoice.findMany({
          where,
          include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
          orderBy: { invoiceDate: 'asc' },
          take: 200,
        })

        const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0)

        pdfBuffer = generateReportPDF({
          title: 'Outstanding Payments Report',
          storeName,
          headers: ['Bill #', 'Date', 'Customer', 'Phone', 'Total', 'Paid', 'Due', 'Status'],
          rows: invoices.map(inv => [
            inv.invoiceNumber,
            formatDate(inv.invoiceDate),
            inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName || ''}`.trim() : 'Walk-in',
            inv.customer?.phone || '-',
            formatINR(Number(inv.totalAmount)),
            formatINR(Number(inv.amountPaid)),
            formatINR(Number(inv.amountDue)),
            inv.paymentStatus,
          ]),
          summary: [
            { label: 'Total Outstanding', value: formatINR(totalOutstanding) },
            { label: 'Bills', value: String(invoices.length) },
            { label: 'Overdue', value: String(invoices.filter(i => i.paymentStatus === 'OVERDUE').length) },
          ],
        })
        filename = `outstanding-payments-report.html`
        break
      }

      default:
        return errorResponse('Invalid report type. Use: sales, gst, inventory, outstanding', 400)
    }

    return new Response(pdfBuffer.toString('utf-8'), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}