import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { BillingType, PaymentMethod, PaymentStatus } from '@prisma/client'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
  validateRequired,
  generateInvoiceNumber,
  handlePrismaError,
  logActivity
} from '@/lib/api'

/**
 * GET /api/billing - List invoices with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const storeId = searchParams.get('storeId')
    const status = searchParams.get('status') as PaymentStatus | null
    const billingType = searchParams.get('billingType') as BillingType | null
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    // Build where clause
    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (storeId) where.storeId = storeId
    if (status && status !== 'CANCELLED') {
      where.paymentStatus = status
      where.invoiceStatus = 'ACTIVE'
    } else if (status === 'CANCELLED') {
      where.invoiceStatus = 'CANCELLED'
    } else {
      // Default: show all active invoices
      where.invoiceStatus = 'ACTIVE'
    }
    if (billingType) where.billingType = billingType
    if (customerId) where.customerId = customerId
    if (fromDate || toDate) {
      where.invoiceDate = {}
      if (fromDate) (where.invoiceDate as Record<string, Date>).gte = new Date(fromDate)
      if (toDate) (where.invoiceDate as Record<string, Date>).lte = new Date(toDate)
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } }
      ]
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true, gstin: true }
          },
          store: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true }
              },
              variant: {
                select: { id: true, name: true }
              }
            }
          },
          payments: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesInvoice.count({ where })
    ])

    return paginatedResponse(invoices, total, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/billing - Create a new invoice with items and payments
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_CREATE', 'CREATE')
    if (error) return error

    const body = await request.json()
    const {
      storeId,
      locationId,
      customerId,
      customerName,
      invoiceType = 'RETAIL_INVOICE',
      items,
      subtotal,
      totalDiscount = 0,
      totalGst,
      roundOff = 0,
      totalAmount,
      amountPaid,
      billingType = 'CASH',
      notes,
      parkingSlipNo,
      payments = []
    } = body

    // Validate required fields
    const validationError = validateRequired(body, ['storeId', 'items', 'totalAmount'])
    if (validationError) return errorResponse(validationError, 400)

    if (!items || items.length === 0) {
      return errorResponse('At least one item is required', 400)
    }

    // Validate store belongs to tenant
    const store = await prisma.store.findFirst({
      where: { id: storeId, tenantId: user.tenantId }
    })
    if (!store) return errorResponse('Store not found or access denied', 404)

    // Validate location belongs to store if provided
    if (locationId) {
      const location = await prisma.location.findFirst({
        where: { id: locationId, storeId }
      })
      if (!location) return errorResponse('Location not found in this store', 404)
    }

    // Credit limit check for credit/partial sales
    if (customerId && (billingType === 'CREDIT' || billingType === 'MIXED')) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId: user.tenantId },
        select: { creditLimit: true, creditBalance: true }
      })
      if (customer) {
        const creditLimit = Number(customer.creditLimit)
        const currentBalance = Number(customer.creditBalance)
        const newDueAmount = Number(totalAmount) - Number(amountPaid || 0)

        if (creditLimit > 0 && (currentBalance + newDueAmount) > creditLimit) {
          const overAmount = currentBalance + newDueAmount - creditLimit
          return errorResponse(
            `Credit limit exceeded. Customer limit: ₹${creditLimit.toLocaleString('en-IN')}, Current outstanding: ₹${currentBalance.toLocaleString('en-IN')}, This sale would bring total to ₹${(currentBalance + newDueAmount).toLocaleString('en-IN')} (exceeds limit by ₹${overAmount.toLocaleString('en-IN')}).`,
            400
          )
        }
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(user.tenantId, storeId)

    // Calculate amounts
    const paidAmount = amountPaid || totalAmount
    const dueAmount = Number(totalAmount) - Number(paidAmount)
    const paymentStatus: PaymentStatus = dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE'

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create invoice
      const invoice = await tx.salesInvoice.create({
        data: {
          tenantId: user.tenantId,
          storeId,
          locationId: locationId || null,
          invoiceNumber,
          invoiceType,
          customerId: customerId || null,
          createdById: user.id,
          subtotal: Number(subtotal),
          totalDiscount: Number(totalDiscount),
          totalGst: Number(totalGst),
          roundOff: Number(roundOff),
          totalAmount: Number(totalAmount),
          amountPaid: Number(paidAmount),
          amountDue: dueAmount,
          paymentStatus,
          billingType: billingType as BillingType,
          notes: notes || null,
          parkingSlipNo: parkingSlipNo || null,
          items: {
            create: items.map((item: InvoiceItemInput) => ({
              productId: item.productId || null,
              variantId: item.variantId || null,
              description: item.description || item.name,
              hsnCode: item.hsnCode || null,
              batchNumber: item.batchNumber || null,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              serialNumbers: item.serialNumbers || [],
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              discountPercent: Number(item.discountPercent || 0),
              discountAmount: Number(item.discountAmount || 0),
              gstRate: item.gstRate || 0,
              gstAmount: Number(item.gstAmount || 0),
              totalAmount: Number(item.totalAmount)
            }))
          }
        },
        include: {
          items: true
        }
      })

      // Create payments
      if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map((payment: PaymentInput) => ({
            invoiceId: invoice.id,
            amount: Number(payment.amount),
            method: payment.method as PaymentMethod,
            reference: payment.reference || null
          }))
        })
      } else if (paidAmount > 0) {
        // Create single payment if no payment breakdown provided
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: Number(paidAmount),
            method: mapBillingTypeToPaymentMethod(billingType),
            reference: null
          }
        })
      }

      // Update stock and create stock movements
      for (const item of items) {
        if (item.productId) {
          // Find stock record
          const stock = await tx.inventoryStock.findFirst({
            where: {
              productId: item.productId,
              variantId: item.variantId || null,
              storeId
            }
          })

          if (stock) {
            // Update stock quantity
            await tx.inventoryStock.update({
              where: { id: stock.id },
              data: {
                quantity: { decrement: item.quantity },
                lastStockUpdate: new Date()
              }
            })

            // Create stock movement
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                variantId: item.variantId || null,
                storeId,
                locationId: stock.locationId,
                movementType: 'SALES',
                quantity: -item.quantity,
                referenceType: 'SalesInvoice',
                referenceId: invoice.id,
                notes: `Sold in invoice ${invoiceNumber}`,
                createdById: user.id,
                inventoryStockId: stock.id
              }
            })
          }
        }
      }

      // Update customer credit balance if credit sale
      if (billingType === 'CREDIT' && customerId && dueAmount > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            creditBalance: { increment: dueAmount }
          }
        })
      }

      // Update customer loyalty points (if applicable)
      if (customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { loyaltyMultiplier: true, loyaltyPoints: true }
        })

        if (customer) {
          // Handle loyalty points redemption
          const loyaltyPointsUsed = body.loyaltyPointsUsed || 0
          if (loyaltyPointsUsed > 0) {
            await tx.customer.update({
              where: { id: customerId },
              data: {
                loyaltyPoints: { decrement: loyaltyPointsUsed }
              }
            })

            await tx.loyaltyPointsLog.create({
              data: {
                customerId,
                points: -loyaltyPointsUsed,
                referenceType: 'SalesInvoice',
                referenceId: invoice.id,
                notes: `Points redeemed on invoice ${invoiceNumber}`
              }
            })
          }

          // Award new loyalty points
          if (customer.loyaltyMultiplier > 0) {
            const pointsEarned = Math.floor(Number(totalAmount) * customer.loyaltyMultiplier / 100)
            if (pointsEarned > 0) {
              await tx.customer.update({
                where: { id: customerId },
                data: {
                  loyaltyPoints: { increment: pointsEarned }
                }
              })

              await tx.loyaltyPointsLog.create({
                data: {
                  customerId,
                  points: pointsEarned,
                  referenceType: 'SalesInvoice',
                  referenceId: invoice.id,
                  notes: `Points earned from invoice ${invoiceNumber}`
                }
              })
            }
          }
        }
      }

      return invoice
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'INVOICE_CREATE',
      module: 'BILLING_CREATE',
      entityType: 'SalesInvoice',
      entityId: result.id,
      metadata: {
        invoiceNumber,
        totalAmount,
        billingType,
        paymentStatus,
        itemCount: items.length
      }
    })

    // Return invoice with all related data
    const invoiceWithDetails = await prisma.salesInvoice.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        store: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true } }
          }
        },
        payments: true
      }
    })

    return createdResponse(invoiceWithDetails)
  } catch (error) {
    return handlePrismaError(error)
  }
}

interface InvoiceItemInput {
  productId?: string
  variantId?: string
  name?: string
  description?: string
  hsnCode?: string
  batchNumber?: string
  expiryDate?: string
  serialNumbers?: string[]
  quantity: number
  unitPrice: number
  discountPercent?: number
  discountAmount?: number
  gstRate?: number
  gstAmount?: number
  totalAmount: number
}

interface PaymentInput {
  amount: number
  method: string
  reference?: string
}

function mapBillingTypeToPaymentMethod(billingType: string): PaymentMethod {
  switch (billingType) {
    case 'CASH':
      return 'CASH'
    case 'CREDIT':
      return 'CREDIT'
    case 'CARD':
      return 'CARD'
    case 'UPI':
      return 'UPI'
    default:
      return 'CASH'
  }
}
