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
 * POST /api/e-invoice/generate - Generate IRN for an invoice
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

    // Check GSP configuration
    if (!isGSPConfigured()) {
      return errorResponse('E-Invoicing is not configured. Please set GSP credentials in environment variables.', 400)
    }

    // Fetch invoice with all relations
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

    // Check tenant ownership
    if (invoice.store.tenant.id !== user.tenantId) {
      return errorResponse('Invoice not found', 404)
    }

    // Check if IRN already exists
    if (invoice.irn) {
      return errorResponse('IRN already generated for this invoice', 400)
    }

    // Check e-invoice eligibility
    const { eligible, reason } = isEInvoiceEligible({
      invoice: { gstin: invoice.gstin, invoiceStatus: invoice.invoiceStatus },
      customer: invoice.customer,
      tenantGstin: invoice.store.tenant.gstin,
    })

    if (!eligible) {
      return errorResponse(`Not eligible for e-invoicing: ${reason}`, 400)
    }

    // Build e-invoice JSON
    const sellerState = invoice.store.tenant.state || invoice.store.state || ''
    const eInvoiceJson = buildEInvoiceJson({
      invoice,
      customer: invoice.customer,
      store: invoice.store,
      sellerState,
    })

    // Mark as PENDING before calling GSP
    await prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: { irnStatus: 'PENDING' },
    })

    try {
      // Call GSP to generate IRN
      const irnResponse = await generateIRN(eInvoiceJson)

      // Store IRN data on the invoice
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
        },
      })

      // Log activity
      await logActivity({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'IRN_GENERATED',
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
        message: 'IRN generated successfully',
        irn: irnResponse.Irn,
        ackNo: irnResponse.AckNo,
        ackDt: irnResponse.AckDt,
        invoice: updated,
      })
    } catch (gspError) {
      // Store error on invoice but don't fail
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