import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, notFoundResponse, handlePrismaError } from '@/lib/api'
import { sendEmail, invoiceReceiptEmail } from '@/lib/emails'

/**
 * POST /api/emails/send-invoice
 * Send invoice receipt email to customer
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const body = await request.json()
    const { invoiceId, emailTo } = body as { invoiceId: string; emailTo?: string }

    if (!invoiceId) return errorResponse('invoiceId is required', 400)

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } },
        customer: true,
        store: { select: { tenantId: true, name: true } },
      },
    })

    if (!invoice) return notFoundResponse('Invoice')
    if (invoice.store.tenantId !== user.tenantId) return errorResponse('Access denied', 403)

    const recipientEmail = emailTo || invoice.customer?.email
    if (!recipientEmail) {
      return errorResponse('No email address available for this customer', 400)
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    if (settings && !settings.invoiceAutoSend) {
      return errorResponse('Invoice auto-send is disabled in settings', 400)
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Receipt - ${invoice.invoiceNumber} from ${invoice.store.name}`,
      html: invoiceReceiptEmail({
        customerName: invoice.customer?.firstName || 'Customer',
        invoiceNumber: invoice.invoiceNumber,
        storeName: invoice.store.name,
        invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-IN'),
        items: invoice.items.map(item => ({
          description: item.description || (item.product?.name || '') + (item.variant ? ` (${item.variant.name})` : ''),
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          gstRate: item.gstRate,
          totalAmount: Number(item.totalAmount),
        })),
        subtotal: Number(invoice.subtotal),
        totalGst: Number(invoice.totalGst),
        totalAmount: Number(invoice.totalAmount),
        paymentMethod: invoice.billingType,
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/${invoice.id}/pdf`,
      }),
      tags: { type: 'invoice_receipt', invoiceId: invoice.id },
    })

    await prisma.emailLog.create({
      data: {
        tenantId: user.tenantId,
        to: recipientEmail,
        template: 'invoice_receipt',
        subject: `Receipt - ${invoice.invoiceNumber}`,
        status: result.error ? 'FAILED' : 'SENT',
        resendId: result.id || null,
        error: result.error || null,
      },
    })

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.id })
  } catch (err) {
    return handlePrismaError(err)
  }
}