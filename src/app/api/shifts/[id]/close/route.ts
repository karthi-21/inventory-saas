import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  notFoundResponse,
  logActivity,
  handlePrismaError
} from '@/lib/api'

/**
 * PATCH /api/shifts/[id]/close - Close a shift
 *
 * Enters closing cash, calculates expected cash from cash sales, and computes variance.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('BILLING_CREATE', 'CREATE')
    if (error) return error

    const body = await request.json()
    const { closingCash } = body as { closingCash: number }

    if (closingCash === undefined || closingCash < 0) {
      return errorResponse('Closing cash amount is required', 400)
    }

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        cashier: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    if (!shift) {
      return notFoundResponse('Shift')
    }

    if (shift.status === 'CLOSED') {
      return errorResponse('Shift is already closed', 400)
    }

    // Calculate expected cash: opening cash + all cash sales during the shift
    const cashPayments = await prisma.payment.findMany({
      where: {
        method: 'CASH',
        createdAt: {
          gte: shift.openedAt,
          lte: new Date()
        },
        invoice: {
          storeId: shift.storeId,
          ...(shift.locationId && { locationId: shift.locationId })
        }
      },
      select: { amount: true }
    })

    const totalCashSales = cashPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const expectedCash = Number(shift.openingCash) + totalCashSales
    const variance = closingCash - expectedCash

    // Get all sales during shift for summary
    const shiftSales = await prisma.salesInvoice.findMany({
      where: {
        storeId: shift.storeId,
        ...(shift.locationId && { locationId: shift.locationId }),
        invoiceStatus: 'ACTIVE',
        createdAt: {
          gte: shift.openedAt,
          lte: new Date()
        }
      },
      select: {
        totalAmount: true,
        billingType: true,
        payments: { select: { method: true, amount: true } }
      }
    })

    const totalSales = shiftSales.reduce((sum, s) => sum + Number(s.totalAmount), 0)

    // Break down by payment method
    const allPayments = shiftSales.flatMap(s => s.payments)
    const cashTotal = allPayments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + Number(p.amount), 0)
    const upiTotal = allPayments.filter(p => p.method === 'UPI').reduce((sum, p) => sum + Number(p.amount), 0)
    const cardTotal = allPayments.filter(p => p.method === 'CARD').reduce((sum, p) => sum + Number(p.amount), 0)
    const creditTotal = allPayments.filter(p => p.method === 'CREDIT').reduce((sum, p) => sum + Number(p.amount), 0)

    const closedShift = await prisma.shift.update({
      where: { id },
      data: {
        closingCash,
        expectedCash,
        variance,
        closedAt: new Date(),
        status: 'CLOSED'
      },
      include: {
        cashier: { select: { id: true, firstName: true, lastName: true } },
        store: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } }
      }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'SHIFT_CLOSE',
      module: 'BILLING_CREATE',
      entityType: 'Shift',
      entityId: id,
      metadata: {
        openingCash: Number(shift.openingCash),
        closingCash,
        expectedCash,
        variance,
        totalSales,
        cashTotal,
        upiTotal,
        cardTotal,
        creditTotal
      }
    })

    return successResponse({
      shift: closedShift,
      summary: {
        totalSales,
        cashTotal,
        upiTotal,
        cardTotal,
        creditTotal,
        openingCash: Number(shift.openingCash),
        expectedCash,
        closingCash,
        variance
      }
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}