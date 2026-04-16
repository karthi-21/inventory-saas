import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  getPagination,
  logActivity,
  handlePrismaError
} from '@/lib/api'

/**
 * POST /api/inventory/transfer - Create a stock transfer between locations
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('INVENTORY_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { fromLocationId, toLocationId, items, notes } = body as {
      fromLocationId: string
      toLocationId: string
      items: Array<{ productId: string; variantId?: string; quantity: number }>
      notes?: string
    }

    if (!fromLocationId || !toLocationId) {
      return errorResponse('Source and destination locations are required', 400)
    }

    if (fromLocationId === toLocationId) {
      return errorResponse('Source and destination cannot be the same', 400)
    }

    if (!items || items.length === 0) {
      return errorResponse('At least one item is required for transfer', 400)
    }

    // Verify source location
    const fromStocks = await prisma.inventoryStock.findMany({
      where: {
        locationId: fromLocationId,
        productId: { in: items.map(i => i.productId) }
      }
    })

    // Verify destination location
    const toLocation = await prisma.location.findUnique({
      where: { id: toLocationId },
      include: { store: { select: { id: true, name: true, tenantId: true } } }
    })

    if (!toLocation || toLocation.store.tenantId !== user.tenantId) {
      return errorResponse('Destination location not found', 404)
    }

    // Validate stock availability
    for (const item of items) {
      const stock = fromStocks.find(
        s => s.productId === item.productId && (s.variantId || null) === (item.variantId || null)
      )
      if (!stock) {
        return errorResponse(`Product ${item.productId} not found at source location`, 400)
      }
      if (stock.quantity < item.quantity) {
        return errorResponse(
          `Insufficient stock for transfer. Available: ${stock.quantity}, Requested: ${item.quantity}`,
          400
        )
      }
    }

    // Execute transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      const transferResults = []

      for (const item of items) {
        const fromStock = fromStocks.find(
          s => s.productId === item.productId && (s.variantId || null) === (item.variantId || null)
        )!

        // Find or create destination stock
        let toStock = await tx.inventoryStock.findFirst({
          where: {
            productId: item.productId,
            variantId: item.variantId || null,
            storeId: toLocation.storeId,
            locationId: toLocationId
          }
        })

        if (!toStock) {
          // Create stock at destination
          toStock = await tx.inventoryStock.create({
            data: {
              productId: item.productId,
              variantId: item.variantId || null,
              storeId: toLocation.storeId,
              locationId: toLocationId,
              quantity: 0,
              reservedQty: 0
            }
          })
        }

        // Deduct from source
        await tx.inventoryStock.update({
          where: { id: fromStock.id },
          data: {
            quantity: { decrement: item.quantity },
            lastStockUpdate: new Date()
          }
        })

        // Add to destination
        await tx.inventoryStock.update({
          where: { id: toStock.id },
          data: {
            quantity: { increment: item.quantity },
            lastStockUpdate: new Date()
          }
        })

        // Create TRANSFER_OUT movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            storeId: fromStock.storeId,
            locationId: fromLocationId,
            movementType: 'TRANSFER_OUT',
            quantity: -item.quantity,
            referenceType: 'StockTransfer',
            reason: `Transfer to ${toLocation.name}`,
            notes: notes || 'Stock transfer',
            createdById: user.id,
            inventoryStockId: fromStock.id
          }
        })

        // Create TRANSFER_IN movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            storeId: toLocation.storeId,
            locationId: toLocationId,
            movementType: 'TRANSFER_IN',
            quantity: item.quantity,
            referenceType: 'StockTransfer',
            reason: `Transfer from location`,
            notes: notes || 'Stock transfer',
            createdById: user.id,
            inventoryStockId: toStock.id
          }
        })

        transferResults.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          fromStock: fromStock.quantity,
          toStock: toStock.quantity + item.quantity
        })
      }

      return transferResults
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STOCK_TRANSFER',
      module: 'INVENTORY_EDIT',
      entityType: 'InventoryStock',
      metadata: {
        fromLocationId,
        toLocationId,
        itemCount: items.length,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        notes
      }
    })

    return createdResponse(result)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * GET /api/inventory/transfer - List stock transfer movements
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('INVENTORY_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const storeId = searchParams.get('storeId')
    const movementType = searchParams.get('type') // 'TRANSFER_IN' or 'TRANSFER_OUT'

    const where: Record<string, unknown> = {
      movementType: movementType ? movementType : { in: ['TRANSFER_IN', 'TRANSFER_OUT'] }
    }

    // Get store IDs for tenant
    if (storeId) {
      where.storeId = storeId
    } else {
      const stores = await prisma.store.findMany({
        where: { tenantId: user.tenantId },
        select: { id: true }
      })
      where.storeId = { in: stores.map(s => s.id) }
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.count({ where })
    ])

    return successResponse({
      data: movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}