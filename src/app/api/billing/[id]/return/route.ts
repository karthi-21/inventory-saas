import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  logActivity,
  handlePrismaError
} from '@/lib/api'

/**
 * POST /api/billing/[id]/return - Create a return for an invoice
 *
 * Creates a SalesReturn with items, restores stock, and adjusts credit balance.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('BILLING_RETURN', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { items, reason } = body as {
      items: Array<{
        productId?: string
        variantId?: string
        quantity: number
        unitPrice: number
        amount: number
        reason?: string
      }>
      reason?: string
    }

    if (!items || items.length === 0) {
      return errorResponse('At least one item is required for return', 400)
    }

    // Fetch the original invoice
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
      return errorResponse('Cannot return items from a cancelled invoice', 400)
    }

    // Validate return quantities don't exceed invoice quantities
    for (const returnItem of items) {
      const invoiceItem = invoice.items.find(
        i => i.productId === returnItem.productId && i.variantId === returnItem.variantId
      )
      if (!invoiceItem) {
        return errorResponse(`Product not found in invoice`, 400)
      }
      if (returnItem.quantity > invoiceItem.quantity) {
        return errorResponse(
          `Return quantity (${returnItem.quantity}) exceeds invoice quantity (${invoiceItem.quantity})`,
          400
        )
      }
    }

    // Check for existing returns on this invoice
    const existingReturns = await prisma.salesReturn.findMany({
      where: { invoiceId: id }
    })

    // Calculate total returned quantities per product
    const returnedQuantities = new Map<string, number>()
    for (const existingReturn of existingReturns) {
      const returnItems = await prisma.salesReturnItem.findMany({
        where: { returnId: existingReturn.id }
      })
      for (const ri of returnItems) {
        const key = `${ri.productId || ''}_${ri.variantId || ''}`
        returnedQuantities.set(key, (returnedQuantities.get(key) || 0) + ri.quantity)
      }
    }

    // Check return quantities including previous returns
    for (const returnItem of items) {
      const key = `${returnItem.productId || ''}_${returnItem.variantId || ''}`
      const alreadyReturned = returnedQuantities.get(key) || 0
      const invoiceItem = invoice.items.find(
        i => i.productId === returnItem.productId && i.variantId === returnItem.variantId
      )
      if (invoiceItem && (alreadyReturned + returnItem.quantity) > invoiceItem.quantity) {
        return errorResponse(
          `Total return quantity (${alreadyReturned + returnItem.quantity}) exceeds invoice quantity (${invoiceItem.quantity})`,
          400
        )
      }
    }

    // Calculate total return amount
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0)

    // Generate return number
    const returnCount = await prisma.salesReturn.count({
      where: { invoiceId: id }
    })
    const returnNumber = `${invoice.invoiceNumber}-RET-${String(returnCount + 1).padStart(3, '0')}`

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create the return
      const salesReturn = await tx.salesReturn.create({
        data: {
          invoiceId: id,
          returnNumber,
          totalAmount,
          reason: reason || null,
          createdById: user.id,
          items: {
            create: items.map(item => ({
              productId: item.productId || null,
              variantId: item.variantId || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              reason: item.reason || null
            }))
          }
        },
        include: {
          items: true
        }
      })

      // Restore stock and create stock movements
      for (const returnItem of items) {
        if (returnItem.productId) {
          const stock = await tx.inventoryStock.findFirst({
            where: {
              productId: returnItem.productId,
              variantId: returnItem.variantId || null,
              storeId: invoice.storeId
            }
          })

          if (stock) {
            await tx.inventoryStock.update({
              where: { id: stock.id },
              data: {
                quantity: { increment: returnItem.quantity },
                lastStockUpdate: new Date()
              }
            })

            await tx.stockMovement.create({
              data: {
                productId: returnItem.productId,
                variantId: returnItem.variantId || null,
                storeId: invoice.storeId,
                locationId: stock.locationId,
                movementType: 'SALES_RETURN',
                quantity: returnItem.quantity,
                referenceType: 'SalesReturn',
                referenceId: salesReturn.id,
                reason: `Return for invoice ${invoice.invoiceNumber}`,
                notes: `Return ${returnNumber}`,
                createdById: user.id,
                inventoryStockId: stock.id
              }
            })
          }
        }
      }

      // Adjust customer credit balance if credit sale
      if (invoice.customerId && invoice.billingType === 'CREDIT') {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            creditBalance: { decrement: totalAmount }
          }
        })
      }

      // Update invoice payment status
      const newAmountPaid = Number(invoice.amountPaid) - totalAmount
      const newAmountDue = Number(invoice.totalAmount) - newAmountPaid
      let newPaymentStatus: PaymentStatus
      if (newAmountPaid <= 0) {
        newPaymentStatus = 'DUE'
      } else if (newAmountDue > 0) {
        newPaymentStatus = 'PARTIAL'
      } else {
        newPaymentStatus = 'PAID'
      }

      await tx.salesInvoice.update({
        where: { id },
        data: {
          amountPaid: Math.max(0, newAmountPaid),
          amountDue: Math.max(0, newAmountDue),
          paymentStatus: newPaymentStatus
        }
      })

      return salesReturn
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'RETURN_CREATE',
      module: 'BILLING_RETURN',
      entityType: 'SalesReturn',
      entityId: result.id,
      metadata: {
        returnNumber,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount,
        itemCount: items.length,
        reason
      }
    })

    // Fetch return with full details
    const returnWithDetails = await prisma.salesReturn.findUnique({
      where: { id: result.id },
      include: {
        items: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      }
    })

    return createdResponse(returnWithDetails)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * GET /api/billing/[id]/return - List returns for an invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const returns = await prisma.salesReturn.findMany({
      where: { invoiceId: id },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Verify tenant access through invoice
    const invoice = await prisma.salesInvoice.findFirst({
      where: { id, tenantId: user.tenantId }
    })
    if (!invoice) {
      return notFoundResponse('Invoice')
    }

    return successResponse(returns)
  } catch (error) {
    return handlePrismaError(error)
  }
}