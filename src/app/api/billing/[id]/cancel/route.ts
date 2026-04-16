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
 * PATCH /api/billing/[id]/cancel - Cancel/void an invoice
 *
 * Cancels an invoice, restores stock, and reverses credit balance changes.
 * Only invoices with no payments or fully refunded payments can be cancelled.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('BILLING_DELETE', 'DELETE')
    if (error) return error

    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return errorResponse('Cancellation reason is required', 400)
    }

    // Fetch invoice with items and payments
    const invoice = await prisma.salesInvoice.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        items: true,
        payments: true,
        customer: true
      }
    })

    if (!invoice) {
      return notFoundResponse('Invoice')
    }

    if (invoice.invoiceStatus === 'CANCELLED') {
      return errorResponse('Invoice is already cancelled', 400)
    }

    // Check if any payments were made (for credit invoices)
    const totalPayments = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    if (totalPayments > 0) {
      return errorResponse(
        'Cannot cancel invoice with payments. Process a return/refund first.',
        400
      )
    }

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update invoice status
      const cancelledInvoice = await tx.salesInvoice.update({
        where: { id },
        data: {
          invoiceStatus: 'CANCELLED',
          paymentStatus: 'CANCELLED',
          cancelReason: reason,
          cancelledAt: new Date(),
          cancelledById: user.id,
          amountPaid: 0,
          amountDue: 0
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          store: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              variant: { select: { id: true, name: true } }
            }
          },
          payments: true
        }
      })

      // 2. Restore stock for each item
      for (const item of invoice.items) {
        if (item.productId) {
          const stock = await tx.inventoryStock.findFirst({
            where: {
              productId: item.productId,
              variantId: item.variantId || null,
              storeId: invoice.storeId
            }
          })

          if (stock) {
            // Restore stock quantity
            await tx.inventoryStock.update({
              where: { id: stock.id },
              data: {
                quantity: { increment: item.quantity },
                lastStockUpdate: new Date()
              }
            })

            // Create stock movement for the return
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                variantId: item.variantId || null,
                storeId: invoice.storeId,
                locationId: stock.locationId,
                movementType: 'SALES_RETURN',
                quantity: item.quantity,
                referenceType: 'SalesInvoice',
                referenceId: invoice.id,
                reason: `Invoice cancelled: ${invoice.invoiceNumber}`,
                notes: `Stock restored from cancelled invoice ${invoice.invoiceNumber}`,
                createdById: user.id,
                inventoryStockId: stock.id
              }
            })
          }
        }
      }

      // 3. Reverse customer credit balance if it was a credit sale
      if (invoice.customerId && invoice.billingType === 'CREDIT') {
        const creditAmount = Number(invoice.totalAmount) - Number(invoice.amountPaid)
        if (creditAmount > 0) {
          await tx.customer.update({
            where: { id: invoice.customerId },
            data: {
              creditBalance: { decrement: creditAmount }
            }
          })
        }
      }

      // 4. Reverse loyalty points if they were earned
      if (invoice.customerId) {
        const loyaltyLog = await tx.loyaltyPointsLog.findFirst({
          where: {
            customerId: invoice.customerId,
            referenceType: 'SalesInvoice',
            referenceId: invoice.id,
            points: { gt: 0 }
          }
        })

        if (loyaltyLog) {
          await tx.customer.update({
            where: { id: invoice.customerId },
            data: {
              loyaltyPoints: { decrement: loyaltyLog.points }
            }
          })
          await tx.loyaltyPointsLog.create({
            data: {
              customerId: invoice.customerId,
              points: -loyaltyLog.points,
              referenceType: 'SalesInvoice',
              referenceId: invoice.id,
              notes: `Points reversed due to cancelled invoice ${invoice.invoiceNumber}`
            }
          })
        }
      }

      return cancelledInvoice
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'INVOICE_CANCEL',
      module: 'BILLING_DELETE',
      entityType: 'SalesInvoice',
      entityId: id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        reason,
        itemsCount: invoice.items.length
      }
    })

    return successResponse(result)
  } catch (error) {
    return handlePrismaError(error)
  }
}