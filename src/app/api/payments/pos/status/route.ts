import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, handlePrismaError } from '@/lib/api'
import { isPhonePeConfigured, checkPaymentStatus } from '@/lib/phonepe'

/**
 * GET /api/payments/pos/status?transactionId=xxx
 * Poll payment status for POS payment
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const merchantTransactionId = searchParams.get('merchantTransactionId')

    if (!transactionId && !merchantTransactionId) {
      return errorResponse('transactionId or merchantTransactionId is required', 400)
    }

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: {
        invoice: { tenantId: user.tenantId },
        ...(transactionId ? { phonePeTransactionId: transactionId } : {}),
        ...(merchantTransactionId ? { phonePeMerchantTxnId: merchantTransactionId } : {}),
      },
    })

    if (!payment) {
      return errorResponse('Payment not found', 404)
    }

    // If already completed, return from DB
    if (payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'FAILED' || payment.paymentStatus === 'REFUNDED') {
      return NextResponse.json({
        transactionId: payment.phonePeTransactionId,
        status: payment.paymentStatus,
        amount: Number(payment.amount),
        method: payment.method,
        completedAt: payment.paymentCompletedAt,
      })
    }

    // If PhonePe configured and still pending, poll for status
    if (payment.phonePeMerchantTxnId && isPhonePeConfigured()) {
      try {
        const phonePeStatus = await checkPaymentStatus(payment.phonePeMerchantTxnId)

        // Update payment status in DB
        if (phonePeStatus.status === 'SUCCESS') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              paymentStatus: 'SUCCESS',
              reference: phonePeStatus.upiTransactionId,
              paymentCompletedAt: phonePeStatus.completedAt ? new Date(phonePeStatus.completedAt) : new Date(),
            },
          })

          // Also update invoice payment status
          const invoice = await prisma.salesInvoice.findUnique({
            where: { id: payment.invoiceId },
          })
          if (invoice) {
            const totalPaid = Number(invoice.amountPaid) + Number(payment.amount)
            await prisma.salesInvoice.update({
              where: { id: payment.invoiceId },
              data: {
                paymentStatus: totalPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL',
                amountPaid: totalPaid,
                amountDue: Number(invoice.totalAmount) - totalPaid,
              },
            })
          }
        } else if (phonePeStatus.status === 'FAILED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { paymentStatus: 'FAILED' },
          })
        }

        return NextResponse.json({
          transactionId: payment.phonePeTransactionId,
          status: phonePeStatus.status,
          amount: phonePeStatus.amount,
          method: phonePeStatus.paymentMethod || payment.method,
          completedAt: phonePeStatus.completedAt,
        })
      } catch (err) {
        // PhonePe poll failed, return current status
        console.error('PhonePe status poll failed:', err)
      }
    }

    return NextResponse.json({
      transactionId: payment.phonePeTransactionId,
      status: payment.paymentStatus,
      amount: Number(payment.amount),
      method: payment.method,
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}
