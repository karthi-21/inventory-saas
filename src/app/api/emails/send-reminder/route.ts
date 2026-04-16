import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, notFoundResponse, handlePrismaError } from '@/lib/api'
import { sendEmail, paymentReminderEmail } from '@/lib/emails'

/**
 * POST /api/emails/send-reminder
 * Send payment reminder email to a customer with outstanding balance
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('CUSTOMER_VIEW', 'VIEW')
    if (error) return error

    const body = await request.json()
    const { customerId } = body as { customerId: string }

    if (!customerId) return errorResponse('customerId is required', 400)

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId: user.tenantId },
    })

    if (!customer) return notFoundResponse('Customer')
    if (!customer.email) return errorResponse('Customer has no email address', 400)

    // Get outstanding invoices
    const outstandingInvoices = await prisma.salesInvoice.findMany({
      where: {
        customerId,
        tenantId: user.tenantId,
        invoiceStatus: 'ACTIVE',
        paymentStatus: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
      },
      orderBy: { invoiceDate: 'asc' },
    })

    if (outstandingInvoices.length === 0) {
      return NextResponse.json({ success: true, message: 'No outstanding invoices' })
    }

    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0)

    // Check tenant notification settings
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: user.tenantId } })
    if (settings && !settings.emailNotificationsEnabled) {
      return errorResponse('Email notifications are disabled in settings', 400)
    }

    const store = await prisma.store.findFirst({
      where: { tenantId: user.tenantId, id: user.tenantId },
    })

    const result = await sendEmail({
      to: customer.email,
      subject: `Payment Reminder - Outstanding ₹${totalOutstanding.toLocaleString('en-IN')} at ${store?.name || 'Ezvento'}`,
      html: paymentReminderEmail({
        customerName: customer.firstName,
        storeName: store?.name || 'Ezvento Store',
        totalOutstanding,
        invoiceCount: outstandingInvoices.length,
        invoiceBreakdown: outstandingInvoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          date: new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
          amount: Number(inv.amountDue),
        })),
      }),
      tags: { type: 'payment_reminder', customerId: customer.id },
    })

    // Log follow-up
    await prisma.followUp.create({
      data: {
        customerId: customer.id,
        type: 'EMAIL_SENT',
        notes: `Payment reminder sent for ₹${totalOutstanding.toLocaleString('en-IN')} across ${outstandingInvoices.length} invoices`,
      },
    })

    // Log email
    await prisma.emailLog.create({
      data: {
        tenantId: user.tenantId,
        to: customer.email,
        template: 'payment_reminder',
        subject: `Payment Reminder - Outstanding ₹${totalOutstanding.toLocaleString('en-IN')}`,
        status: result.error ? 'FAILED' : 'SENT',
        resendId: result.id || null,
        error: result.error || null,
      },
    })

    return NextResponse.json({ success: !result.error, emailId: result.id, error: result.error })
  } catch (err) {
    return handlePrismaError(err)
  }
}
