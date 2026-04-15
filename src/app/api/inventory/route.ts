import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
  validateRequired,
  handlePrismaError,
  logActivity
} from '@/lib/api'

/**
 * GET /api/inventory - Get stock levels with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('INVENTORY_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const storeId = searchParams.get('storeId')
    const locationId = searchParams.get('locationId')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') // 'low-stock', 'expiry', 'all'
    const search = searchParams.get('search')

    // Build where clause
    const where: Record<string, unknown> = {
      store: { tenantId: user.tenantId }
    }

    if (storeId) where.storeId = storeId
    if (locationId) where.locationId = locationId
    if (productId) where.productId = productId

    // Handle search
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { variant: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get stock records
    const [stocks, total] = await Promise.all([
      prisma.inventoryStock.findMany({
        where,
        include: {
          product: {
            include: { category: true }
          },
          variant: true,
          store: true,
          location: true
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.inventoryStock.count({ where })
    ])

    // Filter by type if specified
    let filteredStocks = stocks
    if (type === 'low-stock') {
      filteredStocks = stocks.filter(stock =>
        stock.product && stock.quantity <= stock.product.reorderLevel
      )
    }

    // Get recent movements for all stocks in a single query (avoids N+1)
    const allRecentMovements = await prisma.stockMovement.findMany({
      where: {
        storeId: storeId || undefined,
        OR: filteredStocks.map(s => ({
          productId: s.productId,
          variantId: s.variantId ?? null
        }))
      },
      orderBy: { createdAt: 'desc' },
      take: filteredStocks.length * 5
    })

    // Group movements by product/variant key, keeping at most 5 per stock
    const movementMap = new Map<string, typeof allRecentMovements>()
    for (const m of allRecentMovements) {
      const key = `${m.productId}-${m.variantId ?? 'null'}`
      if (!movementMap.has(key)) movementMap.set(key, [])
      const list = movementMap.get(key)!
      if (list.length < 5) list.push(m)
    }

    const stocksWithMovements = filteredStocks.map(stock => {
      const key = `${stock.productId}-${stock.variantId ?? 'null'}`
      return {
        ...stock,
        recentMovements: movementMap.get(key) || []
      }
    })

    return paginatedResponse(stocksWithMovements, type === 'low-stock' ? filteredStocks.length : total, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/inventory - Create stock adjustment
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('INVENTORY_ADJUST', 'ADJUST')
    if (error) return error

    const body = await request.json()
    const {
      productId,
      variantId,
      storeId,
      locationId,
      adjustmentType, // 'in', 'out', 'set'
      quantity,
      reason,
      notes
    } = body

    // Validate required fields
    const validationError = validateRequired(body, ['productId', 'storeId', 'adjustmentType', 'quantity'])
    if (validationError) return errorResponse(validationError, 400)

    // Validate store belongs to tenant
    const store = await prisma.store.findFirst({
      where: { id: storeId, tenantId: user.tenantId }
    })
    if (!store) return errorResponse('Store not found or access denied', 404)

    // Find or create stock record
    let stock = await prisma.inventoryStock.findFirst({
      where: {
        productId,
        variantId: variantId || null,
        storeId,
        locationId: locationId || null
      }
    })

    const quantityBefore = stock?.quantity || 0
    let quantityAfter: number

    // Calculate new quantity based on adjustment type
    switch (adjustmentType) {
      case 'in':
        quantityAfter = quantityBefore + quantity
        break
      case 'out':
        quantityAfter = quantityBefore - quantity
        if (quantityAfter < 0) {
          return errorResponse('Insufficient stock for adjustment', 400)
        }
        break
      case 'set':
        quantityAfter = quantity
        break
      default:
        return errorResponse('Invalid adjustment type. Use: in, out, or set', 400)
    }

    // Create or update stock record
    if (stock) {
      stock = await prisma.inventoryStock.update({
        where: { id: stock.id },
        data: {
          quantity: quantityAfter,
          lastStockUpdate: new Date()
        }
      })
    } else {
      stock = await prisma.inventoryStock.create({
        data: {
          productId,
          variantId: variantId || null,
          storeId,
          locationId: locationId || null,
          quantity: quantityAfter
        }
      })
    }

    // Create stock adjustment record
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        productId,
        variantId: variantId || null,
        storeId,
        locationId: locationId || null,
        reason: mapReasonToEnum(reason),
        quantityBefore,
        quantityAfter,
        notes,
        createdById: user.id
      }
    })

    // Create stock movement
    const movementType = mapAdjustmentToMovementType(adjustmentType, reason)
    await prisma.stockMovement.create({
      data: {
        productId,
        variantId: variantId || null,
        storeId,
        locationId: locationId || null,
        movementType,
        quantity: adjustmentType === 'out' ? -quantity : quantity,
        reason,
        notes,
        inventoryStockId: stock.id
      }
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STOCK_ADJUSTMENT',
      module: 'INVENTORY_ADJUST',
      entityType: 'InventoryStock',
      entityId: stock.id,
      metadata: {
        productId,
        variantId,
        quantityBefore,
        quantityAfter,
        adjustmentType,
        reason
      }
    })

    return createdResponse({
      stock,
      adjustment,
      message: 'Stock adjusted successfully'
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

function mapReasonToEnum(reason: string): 'DAMAGE' | 'THEFT' | 'EXPIRY' | 'FOUND' | 'CORRECTION' | 'SYSTEM_ADJUSTMENT' {
  const reasonMap: Record<string, 'DAMAGE' | 'THEFT' | 'EXPIRY' | 'FOUND' | 'CORRECTION' | 'SYSTEM_ADJUSTMENT'> = {
    damage: 'DAMAGE',
    theft: 'THEFT',
    expiry: 'EXPIRY',
    found: 'FOUND',
    correction: 'CORRECTION',
    system: 'SYSTEM_ADJUSTMENT'
  }
  return reasonMap[reason] || 'CORRECTION'
}

function mapAdjustmentToMovementType(adjustmentType: string, reason?: string) {
  if (adjustmentType === 'in') {
    switch (reason) {
      case 'found':
        return 'ADJUSTMENT_IN'
      case 'purchase_return':
        return 'SALES_RETURN'
      default:
        return 'ADJUSTMENT_IN'
    }
  } else {
    switch (reason) {
      case 'damage':
        return 'DAMAGE'
      case 'theft':
        return 'THEFT'
      case 'expiry':
        return 'EXPIRY'
      default:
        return 'ADJUSTMENT_OUT'
    }
  }
}
