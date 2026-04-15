import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
  successResponse,
  createdResponse,
  paginatedResponse,
  errorResponse,
  getPagination,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

/**
 * GET /api/purchase-invoices - List all purchase invoices
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const storeId = searchParams.get('storeId')
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (storeId) where.storeId = storeId
    if (vendorId) where.vendorId = vendorId
    if (status) where.status = status
    if (fromDate || toDate) {
      where.invoiceDate = {}
      if (fromDate) (where.invoiceDate as Record<string, Date>).gte = new Date(fromDate)
      if (toDate) (where.invoiceDate as Record<string, Date>).lte = new Date(toDate)
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, phone: true, gstin: true } },
          Store: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              variant: { select: { id: true, name: true } }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchaseInvoice.count({ where })
    ])

    return paginatedResponse(invoices, total, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/purchase-invoices - Create a new purchase invoice
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const {
      vendorId,
      storeId,
      invoiceNumber,
      invoiceDate,
      items,
      notes
    } = body

    // Validate
    if (!vendorId || !storeId || !items || items.length === 0) {
      return errorResponse('Vendor, store, and items are required', 400)
    }

    // Verify vendor and store belong to tenant
    const [vendor, store] = await Promise.all([
      prisma.vendor.findFirst({ where: { id: vendorId, tenantId: user.tenantId } }),
      prisma.store.findFirst({ where: { id: storeId, tenantId: user.tenantId } })
    ])

    if (!vendor) return errorResponse('Vendor not found', 404)
    if (!store) return errorResponse('Store not found', 404)

    // Calculate totals
    let subtotal = 0
    let totalGst = 0
    for (const item of items) {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      const gstRate = Number(item.gstRate) || 0
      const amount = qty * price
      const gst = (amount * gstRate) / 100
      subtotal += amount
      totalGst += gst
    }
    const totalAmount = subtotal + totalGst

    // Generate invoice number if not provided
    const finalInvoiceNumber = invoiceNumber || `PUR-${Date.now().toString(36).toUpperCase()}`

    // Create invoice with items
    const invoice = await prisma.purchaseInvoice.create({
      data: {
        tenantId: user.tenantId,
        vendorId,
        storeId,
        invoiceNumber: finalInvoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        subtotal,
        totalGst,
        totalAmount,
        amountPaid: 0,
        status: 'PENDING',
        notes,
        items: {
          create: items.map((item: Record<string, unknown>) => ({
            productId: item.productId as string | null,
            variantId: item.variantId as string | null,
            description: item.description as string | null,
            batchNumber: item.batchNumber as string | null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate as string) : null,
            quantity: Number(item.quantity) || 0,
            receivedQty: 0,
            unitPrice: Number(item.unitPrice) || 0,
            gstRate: Number(item.gstRate) || 0,
            gstAmount: Number(item.gstAmount) || 0,
            totalAmount: Number(item.totalAmount) || 0
          }))
        }
      },
      include: {
        vendor: true,
        Store: true,
        items: { include: { product: true, variant: true } }
      }
    })

    // Update stock for each item (if received immediately)
    for (const item of items) {
      if (item.productId && item.receiveNow) {
        const stock = await prisma.inventoryStock.findFirst({
          where: {
            productId: item.productId as string,
            variantId: (item.variantId as string) || null,
            storeId
          }
        })

        if (stock) {
          await prisma.inventoryStock.update({
            where: { id: stock.id },
            data: {
              quantity: { increment: Number(item.quantity) || 0 },
              lastStockUpdate: new Date()
            }
          })
        } else {
          await prisma.inventoryStock.create({
            data: {
              productId: item.productId as string,
              variantId: (item.variantId as string) || null,
              storeId,
              quantity: Number(item.quantity) || 0,
              reservedQty: 0
            }
          })
        }

        // Create stock movement
        await prisma.stockMovement.create({
          data: {
            productId: item.productId as string,
            variantId: (item.variantId as string) || null,
            storeId,
            movementType: 'PURCHASE',
            quantity: Number(item.quantity) || 0,
            referenceType: 'PurchaseInvoice',
            referenceId: invoice.id,
            notes: `Purchase from ${vendor.name}`
          }
        })
      }
    }

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PURCHASE_CREATE',
      module: 'PURCHASE_CREATE',
      entityType: 'PurchaseInvoice',
      entityId: invoice.id,
      metadata: { invoiceNumber: finalInvoiceNumber, vendor: vendor.name, totalAmount }
    })

    return createdResponse(invoice)
  } catch (error) {
    return handlePrismaError(error)
  }
}