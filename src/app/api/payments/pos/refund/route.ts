import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, notFoundResponse, logActivity, handlePrismaError } from '@/lib/api'
import { isPhonePeConfigured, initiateRefund } from '@/lib/phonepe'

/**
 * POST /api/payments/pos/refund
 * Process a refund for a PhonePe payment (used when invoice is cancelled)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_DELETE', 'DELETE')
    if (error) return error

    const body = await request.json()
    const { transactionId, amount, reason } = body as {
      transactionId: string
      amount: number
      reason: string
    }

    if (!transactionId || !amount) {
      return errorResponse('transactionId and amount are required', 400)
    }

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: { phonePeTransactionId: transactionId, invoice: { tenantId: user.tenantId } },
    })

    if (!payment) return notFoundResponse('Payment')

    // If PhonePe configured, initiate refund through gateway
    if (isPhonePeConfigured() && payment.phonePeMerchantTxnId) {
      try {
        await initiateRefund({
          merchantTransactionId: payment.phonePeMerchantTxnId,
          originalTransactionId: payment.phonePeTransactionId || '',
          amount,
          reason: reason || 'Invoice cancelled',
        })

        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: 'REFUNDED' },
        })
      } catch (refundErr) {
        console.error('PhonePe refund failed:', refundErr)
        // Mark as partially refunded if full refund fails
        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: 'PARTIALLY_REFUNDED' },
        })
      }
    } else {
      // No PhonePe — just mark as refunded (cash/card refund is manual)
      await prisma.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: 'REFUNDED' },
      })
    }

    await logActivity({ tenantId: user.tenantId, userId: user.id, action: 'REFUND_PROCESSED', module: 'Payment', entityId: payment.id, metadata: { amount, reason } })

    return NextResponse.json({ success: true, status: 'REFUNDED' })
  } catch (err) {
    return handlePrismaError(err)
  }
}
