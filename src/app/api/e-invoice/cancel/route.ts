import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  logActivity,
  handlePrismaError
} from '@/lib/api'
import { isGSPConfigured, cancelIRN } from '@/lib/gsp-client'

/**
 * POST /api/e-invoice/cancel - Cancel IRN for an invoice
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_DELETE', 'DELETE')
    if (error) return error

    const body = await request.json()
    const { invoiceId, reason, remark } = body as {
      invoiceId: string
      reason: 'DUPLICATE' | 'DATA_ENTRY_MISTAKE' | 'OTHER'
      remark?: string
    }

    if (!invoiceId) {
      return errorResponse('Invoice ID is required', 400)
    }

    if (!reason) {
      return errorResponse('Cancellation reason is required', 400)
    }

    if (!isGSPConfigured()) {
      return errorResponse('E-Invoicing is not configured', 400)
    }

    // Fetch invoice
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: { store: { include: { tenant: true } } },
    })

    if (!invoice) {
      return errorResponse('Invoice not found', 404)
    }

    if (invoice.store.tenant.id !== user.tenantId) {
      return errorResponse('Invoice not found', 404)
    }

    // Check if IRN exists
    if (!invoice.irn) {
      return errorResponse('No IRN found for this invoice', 400)
    }

    if (invoice.irnStatus === 'CANCELLED') {
      return errorResponse('IRN is already cancelled', 400)
    }

    // Cancel IRN on GSTN
    try {
      const cancelResponse = await cancelIRN(invoice.irn, reason, remark)

      // Update invoice
      const updated = await prisma.salesInvoice.update({
        where: { id: invoiceId },
        data: {
          irnStatus: 'CANCELLED',
          irnError: null,
        },
      })

      // Log activity
      await logActivity({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'IRN_CANCELLED',
        module: 'BILLING_DELETE',
        entityType: 'SalesInvoice',
        entityId: invoiceId,
        metadata: {
          irn: invoice.irn,
          reason,
          remark,
          cancelDate: cancelResponse.CancelDate,
        },
      })

      return successResponse({
        message: 'IRN cancelled successfully',
        irn: invoice.irn,
        cancelDate: cancelResponse.CancelDate,
        invoice: updated,
      })
    } catch (gspError) {
      const errorMessage = gspError instanceof Error ? gspError.message : 'Unknown GSP error'
      return errorResponse(`IRN cancellation failed: ${errorMessage}`, 502)
    }
  } catch (error) {
    return handlePrismaError(error)
  }
}