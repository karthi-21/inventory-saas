import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, successResponse, errorResponse, handlePrismaError } from '@/lib/api'
import { sendEmail, paymentReminderEmail } from '@/lib/emails'

/**
 * POST /api/customers/[id]/send-reminder — Send a payment reminder email to a customer
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('CUSTOMER_EDIT', 'EDIT')
    if (error) return error

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        store: { select: { id: true, name: true } },
        salesInvoices: {
          where: {
            invoiceStatus: 'ACTIVE',
            paymentStatus: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
          },
          orderBy: { invoiceDate: 'asc' },
        },
      },
    })

    if (!customer) return errorResponse('Customer not found', 404)
    if (!customer.email) return errorResponse('Customer has no email address', 400)

    const totalOutstanding = customer.salesInvoices.reduce((s, i) => s + Number(i.amountDue), 0)
    if (totalOutstanding === 0) return errorResponse('Customer has no outstanding balance', 400)

    // Send reminder email
    const { id: emailId, error: emailError } = await sendEmail({
      to: customer.email,
      subject: `Payment Reminder - Outstanding ₹${totalOutstanding.toLocaleString('en-IN')} at ${customer.store?.name || 'our store'}`,
      html: paymentReminderEmail({
        customerName: customer.firstName,
        storeName: customer.store?.name || 'Ezvento Store',
        totalOutstanding,
        invoiceCount: customer.salesInvoices.length,
        invoiceBreakdown: customer.salesInvoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          date: new Date(i.invoiceDate).toLocaleDateString('en-IN'),
          amount: Number(i.amountDue),
        })),
      }),
      tags: { type: 'manual_reminder', customerId: customer.id },
    })

    // Log email
    await prisma.emailLog.create({
      data: {
        tenantId: user.tenantId,
        to: customer.email,
        template: 'payment_reminder',
        subject: `Payment Reminder - ₹${totalOutstanding.toLocaleString('en-IN')}`,
        status: emailError ? 'FAILED' : 'SENT',
      },
    })

    // Log follow-up
    await prisma.followUp.create({
      data: {
        customerId: id,
        type: 'EMAIL_SENT',
        notes: `Manual reminder: ₹${totalOutstanding.toLocaleString('en-IN')} outstanding${emailError ? ` (error: ${emailError})` : ''}`,
      },
    })

    if (emailError) {
      return NextResponse.json({ error: 'Failed to send email', details: emailError }, { status: 500 })
    }

    return successResponse({ sent: true, emailId, totalOutstanding })
  } catch (err) {
    return handlePrismaError(err)
  }
}