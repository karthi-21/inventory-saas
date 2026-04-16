import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  notFoundResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/billing/[id]/items - Get items for a specific invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const invoice = await prisma.salesInvoice.findFirst({
      where: { id, tenantId: user.tenantId },
      select: { id: true }
    })

    if (!invoice) {
      return notFoundResponse('Invoice')
    }

    const items = await prisma.salesInvoiceItem.findMany({
      where: { invoiceId: id },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true } }
      }
    })

    return successResponse(items)
  } catch (err) {
    return handlePrismaError(err)
  }
}