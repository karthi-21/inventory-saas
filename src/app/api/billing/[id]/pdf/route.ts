import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, handlePrismaError } from '@/lib/api'
import { generateInvoicePDF, generateReceiptHTML } from '@/lib/pdf-generator'

/**
 * GET /api/billing/[id]/pdf - Generate invoice PDF
 * Query params:
 *   format: 'invoice' (default, A4) or 'receipt' (80mm thermal)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { name: true, hsnCode: true } },
            variant: { select: { name: true } },
          },
        },
        customer: true,
        store: { include: { tenant: true } },
        payments: true,
      },
    })

    if (!invoice) {
      return errorResponse('Invoice not found', 404)
    }

    if (invoice.store.tenant.id !== user.tenantId) {
      return errorResponse('Invoice not found', 404)
    }

    const format = request.nextUrl.searchParams.get('format') || 'invoice'
    const tenant = invoice.store.tenant

    // Build invoice data for PDF
    const invoiceData = {
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        subtotal: Number(invoice.subtotal),
        totalDiscount: Number(invoice.totalDiscount),
        totalGst: Number(invoice.totalGst),
        roundOff: Number(invoice.roundOff),
        totalAmount: Number(invoice.totalAmount),
        amountPaid: Number(invoice.amountPaid),
        amountDue: Number(invoice.amountDue),
        billingType: invoice.billingType,
        notes: invoice.notes,
        irn: invoice.irn,
        irnStatus: invoice.irnStatus,
      },
      items: invoice.items.map(item => ({
        description: item.description || (item.product?.name || '') + (item.variant ? ` (${item.variant.name})` : ''),
        hsnCode: item.hsnCode || item.product?.hsnCode || null,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountPercent: Number(item.discountPercent),
        gstRate: item.gstRate,
        gstAmount: Number(item.gstAmount),
        totalAmount: Number(item.totalAmount),
      })),
      seller: {
        name: tenant.name,
        gstin: tenant.gstin,
        address: tenant.address,
        state: tenant.state,
        pincode: tenant.pincode,
        phone: tenant.phone,
        email: tenant.email,
      },
      buyer: invoice.customer ? {
        name: `${invoice.customer.firstName}${invoice.customer.lastName ? ' ' + invoice.customer.lastName : ''}`,
        gstin: invoice.gstin || invoice.customer.gstin,
        address: invoice.customer.address,
        state: invoice.customer.state,
        pincode: invoice.customer.pincode,
        phone: invoice.customer.phone,
      } : null,
      store: {
        name: invoice.store.name,
        address: invoice.store.address,
        state: invoice.store.state,
        phone: invoice.store.phone,
      },
    }

    if (format === 'receipt') {
      // Thermal receipt format
      const html = generateReceiptHTML(invoiceData)
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="receipt-${invoice.invoiceNumber}.html"`,
        },
      })
    }

    // A4 invoice format
    const htmlContent = generateInvoicePDF(invoiceData)
    const filename = `invoice-${invoice.invoiceNumber}.html`

    return new Response(htmlContent.toString('utf-8'), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}