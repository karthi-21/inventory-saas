import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, notFoundResponse, handlePrismaError } from '@/lib/api'
import { isPhonePeConfigured, initiatePayment, generateUPIQrString } from '@/lib/phonepe'

/**
 * POST /api/payments/pos/initiate
 * Initiate a POS payment via PhonePe (UPI Intent or UPI QR)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_CREATE', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { invoiceId, amount, method } = body as {
      invoiceId: string
      amount: number
      method: 'UPI' | 'UPI_QR' | 'CASH'
      customerPhone?: string
      customerEmail?: string
    }

    if (!invoiceId || !amount || !method) {
      return errorResponse('invoiceId, amount, and method are required', 400)
    }

    if (!['UPI', 'UPI_QR', 'CASH'].includes(method)) {
      return errorResponse('method must be UPI, UPI_QR, or CASH', 400)
    }

    // Find the invoice
    const invoice = await prisma.salesInvoice.findFirst({
      where: { id: invoiceId, tenantId: user.tenantId },
      include: { store: true, customer: true },
    })

    if (!invoice) return notFoundResponse('Invoice')
    if (invoice.invoiceStatus === 'CANCELLED') return errorResponse('Invoice is cancelled', 400)

    // For CASH payments, no PhonePe integration needed
    if (method === 'CASH') {
      return NextResponse.json({
        transactionId: null,
        status: 'SUCCESS',
        message: 'Cash payment — no gateway interaction needed',
      })
    }

    // PhonePe integration for UPI payments
    if (!isPhonePeConfigured()) {
      // If PhonePe not configured, generate UPI QR from VPA for manual payment
      const _tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } })
      const storePaymentConfig = await prisma.storePaymentConfig.findUnique({
        where: { storeId: invoice.storeId },
      })

      const merchantVPA = storePaymentConfig?.merchantVPA || 'omnibiz@ybl'
      const merchantName = storePaymentConfig?.merchantName || invoice.store.name

      const qrData = generateUPIQrString({
        vpa: merchantVPA,
        name: merchantName,
        amount,
        transactionNote: `Payment for ${invoice.invoiceNumber}`,
      })

      return NextResponse.json({
        transactionId: null,
        status: 'PENDING',
        method: 'UPI_QR',
        qrData,
        message: 'PhonePe not configured — showing UPI QR for manual payment',
      })
    }

    // Initiate PhonePe payment
    const paymentResult = await initiatePayment({
      amount,
      invoiceId: invoice.id,
      merchantUserId: user.id,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
      method: method === 'UPI' ? 'UPI_INTENT' : 'UPI_QR',
    })

    // Create a pending Payment record
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        method: method === 'UPI' ? 'UPI' : 'UPI',
        phonePeTransactionId: paymentResult.transactionId,
        phonePeMerchantTxnId: paymentResult.merchantTransactionId,
        paymentStatus: 'PENDING',
      },
    })

    return NextResponse.json({
      transactionId: paymentResult.transactionId,
      merchantTransactionId: paymentResult.merchantTransactionId,
      status: 'PENDING',
      method,
      redirectUrl: paymentResult.redirectUrl,
      upiDeepLink: paymentResult.upiDeepLink,
      qrData: paymentResult.qrData,
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}
