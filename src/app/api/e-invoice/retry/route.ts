import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  logActivity,
  handlePrismaError
} from '@/lib/api'
import { isGSPConfigured, generateIRN } from '@/lib/gsp-client'
import { buildEInvoiceJson, isEInvoiceEligible } from '@/lib/e-invoice'

/**
 * POST /api/e-invoice/retry - Retry failed IRN generation
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_CREATE', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { invoiceId } = body as { invoiceId: string }

    if (!invoiceId) {
      return errorResponse('Invoice ID is required', 400)
    }

    if (!isGSPConfigured()) {
      return errorResponse('E-Invoicing is not configured', 400)
    }

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        customer: true,
        store: { include: { tenant: true } },
      },
    })

    if (!invoice) {
      return errorResponse('Invoice not found', 404)
    }

    if (invoice.store.tenant.id !== user.tenantId) {
      return errorResponse('Invoice not found', 404)
    }

    // Can only retry if IRN status is FAILED
    if (invoice.irnStatus !== 'FAILED') {
      return errorResponse('Can only retry invoices with failed IRN generation', 400)
    }

    // Check eligibility
    const { eligible, reason } = isEInvoiceEligible({
      invoice: { gstin: invoice.gstin, invoiceStatus: invoice.invoiceStatus },
      customer: invoice.customer,
      tenantGstin: invoice.store.tenant.gstin,
    })

    if (!eligible) {
      return errorResponse(`Not eligible for e-invoicing: ${reason}`, 400)
    }

    // Build and submit e-invoice
    const sellerState = invoice.store.tenant.state || invoice.store.state || ''
    const eInvoiceJson = buildEInvoiceJson({
      invoice,
      customer: invoice.customer,
      store: invoice.store,
      sellerState,
    })

    await prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: { irnStatus: 'PENDING', irnError: null },
    })

    try {
      const irnResponse = await generateIRN(eInvoiceJson)

      const updated = await prisma.salesInvoice.update({
        where: { id: invoiceId },
        data: {
          irn: irnResponse.Irn,
          irnStatus: 'GENERATED',
          irnAckNo: String(irnResponse.AckNo),
          irnAckDate: irnResponse.AckDt,
          irnSignedInvoice: irnResponse.SignedInvoice,
          irnSignedQRCode: irnResponse.SignedQRCode,
          irnError: null,
          irnRetriedAt: new Date(),
        },
      })

      await logActivity({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'IRN_RETRY_SUCCESS',
        module: 'BILLING_CREATE',
        entityType: 'SalesInvoice',
        entityId: invoiceId,
        metadata: {
          irn: irnResponse.Irn,
          ackNo: irnResponse.AckNo,
          invoiceNumber: invoice.invoiceNumber,
        },
      })

      return successResponse({
        message: 'IRN generated successfully on retry',
        irn: irnResponse.Irn,
        ackNo: irnResponse.AckNo,
        invoice: updated,
      })
    } catch (gspError) {
      const errorMessage = gspError instanceof Error ? gspError.message : 'Unknown GSP error'
      await prisma.salesInvoice.update({
        where: { id: invoiceId },
        data: {
          irnStatus: 'FAILED',
          irnError: errorMessage,
          irnRetriedAt: new Date(),
        },
      })

      return errorResponse(`IRN generation failed: ${errorMessage}`, 502)
    }
  } catch (error) {
    return handlePrismaError(error)
  }
}