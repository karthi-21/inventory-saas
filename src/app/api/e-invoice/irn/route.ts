import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  handlePrismaError
} from '@/lib/api'
import { isGSPConfigured, getIRNDetails } from '@/lib/gsp-client'

/**
 * GET /api/e-invoice/irn?irn=xxx - Get IRN details
 * GET /api/e-invoice/irn?invoiceId=xxx - Get IRN status for an invoice
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const irn = searchParams.get('irn')
    const invoiceId = searchParams.get('invoiceId')

    // Get IRN status for a local invoice
    if (invoiceId) {
      const invoice = await prisma.salesInvoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          invoiceNumber: true,
          irn: true,
          irnStatus: true,
          irnAckNo: true,
          irnAckDate: true,
          irnError: true,
          irnRetriedAt: true,
        },
      })

      if (!invoice) {
        return errorResponse('Invoice not found', 404)
      }

      return successResponse({ invoice })
    }

    // Fetch IRN details from GSTN
    if (irn) {
      if (!isGSPConfigured()) {
        return errorResponse('E-Invoicing is not configured', 400)
      }

      try {
        const irnData = await getIRNDetails(irn)
        return successResponse({ irnData })
      } catch (gspError) {
        const errorMessage = gspError instanceof Error ? gspError.message : 'Unknown GSP error'
        return errorResponse(`Failed to fetch IRN details: ${errorMessage}`, 502)
      }
    }

    return errorResponse('Either irn or invoiceId parameter is required', 400)
  } catch (error) {
    return handlePrismaError(error)
  }
}