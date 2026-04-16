import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPhonePeWebhook } from '@/lib/phonepe'
import { sendEmail, invoiceReceiptEmail } from '@/lib/emails'

/**
 * POST /api/payments/pos/webhook
 * PhonePe server-to-server callback for payment status updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-verify') || ''
    const eventType = request.headers.get('x-phonepe-event') || ''

    if (!verifyPhonePeWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const data = event.data || event.payload || event

    const merchantTransactionId = data.merchantTransactionId || data.transactionId
    if (!merchantTransactionId) {
      return NextResponse.json({ received: true })
    }

    const payment = await prisma.payment.findFirst({
      where: { phonePeMerchantTxnId: merchantTransactionId },
      include: {
        invoice: {
          include: {
            items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } },
            customer: true,
            store: { include: { tenant: true } },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ received: true })
    }

    if (payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'REFUNDED') {
      return NextResponse.json({ received: true })
    }

    if (eventType === 'PAYMENT_SUCCESS' || data.transactionStatus === 'COMPLETED' || data.status === 'SUCCESS') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'SUCCESS',
          reference: data.upiTransactionId || data.transactionId || payment.reference,
          paymentCompletedAt: new Date(),
        },
      })

      const invoice = payment.invoice
      const totalPaid = Number(invoice.amountPaid) + Number(payment.amount)
      await prisma.salesInvoice.update({
        where: { id: invoice.id },
        data: {
          paymentStatus: totalPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL',
          amountPaid: totalPaid,
          amountDue: Number(invoice.totalAmount) - totalPaid,
        },
      })

      if (invoice.customer?.email) {
        try {
          await sendEmail({
            to: invoice.customer.email,
            subject: `Receipt - ${invoice.invoiceNumber} from ${invoice.store.name}`,
            html: invoiceReceiptEmail({
              customerName: invoice.customer.firstName,
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
              paymentMethod: payment.method,
              invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/${invoice.id}/pdf`,
            }),
            tags: { type: 'invoice_receipt', invoiceId: invoice.id },
          })
        } catch (emailErr) {
          console.error('Failed to send receipt email:', emailErr)
        }
      }
    } else if (eventType === 'PAYMENT_FAILED' || data.transactionStatus === 'FAILED' || data.status === 'FAILED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: 'FAILED' },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('PhonePe webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}