import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  logActivity,
  handlePrismaError
} from '@/lib/api'

/**
 * POST /api/customers/[id]/settle - Record a payment against customer credit
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
    const { amount, paymentMode, date, reference, allocations } = body as {
      amount: number
      paymentMode: string
      date?: string
      reference?: string
      allocations?: Array<{ invoiceId: string; amount: number }>
    }

    if (!amount || amount <= 0) {
      return errorResponse('Payment amount must be greater than zero', 400)
    }

    if (!paymentMode) {
      return errorResponse('Payment mode is required', 400)
    }

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: user.tenantId },
      select: { id: true, creditBalance: true, firstName: true, lastName: true }
    })

    if (!customer) {
      return notFoundResponse('Customer')
    }

    const creditBalance = Number(customer.creditBalance)
    if (amount > creditBalance) {
      return errorResponse(
        `Payment amount (₹${amount.toLocaleString('en-IN')}) exceeds outstanding credit balance (₹${creditBalance.toLocaleString('en-IN')})`,
        400
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Reduce customer credit balance
      await tx.customer.update({
        where: { id },
        data: { creditBalance: { decrement: amount } }
      })

      // If allocations provided, reduce specific invoices' amountDue
      if (allocations && allocations.length > 0) {
        for (const alloc of allocations) {
          const invoice = await tx.salesInvoice.findFirst({
            where: { id: alloc.invoiceId, customerId: id, tenantId: user.tenantId },
            select: { id: true, amountDue: true, amountPaid: true, totalAmount: true }
          })

          if (invoice) {
            const newAmountPaid = Number(invoice.amountPaid) + alloc.amount
            const newAmountDue = Math.max(0, Number(invoice.totalAmount) - newAmountPaid)
            let newStatus: PaymentStatus
            if (newAmountDue <= 0) newStatus = 'PAID'
            else if (newAmountPaid > 0) newStatus = 'PARTIAL'
            else newStatus = 'DUE'

            await tx.salesInvoice.update({
              where: { id: alloc.invoiceId },
              data: {
                amountPaid: newAmountPaid,
                amountDue: newAmountDue,
                paymentStatus: newStatus
              }
            })
          }
        }
      }

      // Create payment records for allocated invoices or a general payment
      if (allocations && allocations.length > 0) {
        for (const alloc of allocations) {
          await tx.payment.create({
            data: {
              invoiceId: alloc.invoiceId,
              amount: alloc.amount,
              method: paymentMode as 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER',
              reference: reference || null
            }
          })
        }
      }

      return { amount, creditBalance: creditBalance - amount }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PAYMENT_SETTLE',
      module: 'CUSTOMER_EDIT',
      entityType: 'Customer',
      entityId: id,
      metadata: {
        amount,
        paymentMode,
        reference,
        customerName: `${customer.firstName} ${customer.lastName || ''}`,
        allocations: allocations || 'none'
      }
    })

    return createdResponse(result)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * GET /api/customers/[id]/settle - Get payment history for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('CUSTOMER_VIEW', 'VIEW')
    if (error) return error

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!customer) {
      return notFoundResponse('Customer')
    }

    // Get all outstanding invoices for this customer
    const outstandingInvoices = await prisma.salesInvoice.findMany({
      where: {
        customerId: id,
        paymentStatus: { in: ['DUE', 'PARTIAL'] },
        invoiceStatus: 'ACTIVE'
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        totalAmount: true,
        amountPaid: true,
        amountDue: true,
        paymentStatus: true
      },
      orderBy: { invoiceDate: 'asc' }
    })

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        invoice: { customerId: id }
      },
      include: {
        invoice: { select: { invoiceNumber: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return successResponse({
      creditBalance: Number(customer.creditBalance),
      creditLimit: Number(customer.creditLimit),
      outstandingInvoices,
      recentPayments
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}