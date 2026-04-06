import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
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
 * GET /api/products - List all products with filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const categoryId = searchParams.get('category')
    const search = searchParams.get('search')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const lowStock = searchParams.get('lowStock') === 'true'

    // Build where clause
    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (categoryId) where.categoryId = categoryId
    if (!includeInactive) where.isActive = true

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            include: {
              inventoryStocks: {
                select: { quantity: true, reservedQty: true }
              }
            }
          },
          inventoryStocks: {
            select: { quantity: true, reservedQty: true, storeId: true }
          }
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    // Calculate total stock for each product
    const productsWithStock = products.map(product => {
      const totalStock = product.inventoryStocks.reduce((sum, stock) => sum + stock.quantity, 0)
      const totalReserved = product.inventoryStocks.reduce((sum, stock) => sum + stock.reservedQty, 0)
      const variantStock = product.variants.reduce((sum, variant) =>
        sum + variant.inventoryStocks.reduce((vSum, vStock) => vSum + vStock.quantity, 0), 0)

      const isLowStock = totalStock + variantStock < product.reorderLevel

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { inventoryStocks, ...productData } = product

      return {
        ...productData,
        totalStock: totalStock + variantStock,
        availableStock: totalStock + variantStock - totalReserved,
        isLowStock
      }
    })

    // Filter low stock if requested
    const filteredProducts = lowStock
      ? productsWithStock.filter(p => p.isLowStock)
      : productsWithStock

    const filteredTotal = lowStock ? filteredProducts.length : total

    return paginatedResponse(filteredProducts, filteredTotal, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/products - Create a new product with optional variants
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      brand,
      hsnCode,
      gstRate = 18,
      mrp,
      costPrice,
      sellingPrice,
      reorderLevel = 10,
      productType = 'STANDARD',
      hasVariants = false,
      hasSerialNumber = false,
      hasBatchNumber = false,
      hasExpiry = false,
      imageUrls = [],
      weight,
      weightUnit,
      variants = [],
      openingStock = []
    } = body

    // Validate required fields
    const validationError = validateRequired(body, ['name', 'mrp', 'costPrice', 'sellingPrice'])
    if (validationError) return errorResponse(validationError, 400)

    // Generate SKU if not provided
    const finalSku = sku || generateProductSKU(name, user.tenantId)

    // Check for duplicate SKU
    const existingSku = await prisma.product.findFirst({
      where: { tenantId: user.tenantId, sku: finalSku }
    })
    if (existingSku) return errorResponse('SKU already exists', 409)

    // Create product
    const product = await prisma.product.create({
      data: {
        tenantId: user.tenantId,
        name,
        sku: finalSku,
        barcode,
        description,
        categoryId,
        brand,
        hsnCode,
        gstRate,
        mrp: Number(mrp),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        reorderLevel,
        productType,
        hasVariants,
        hasSerialNumber,
        hasBatchNumber,
        hasExpiry,
        imageUrls,
        weight,
        weightUnit,
        isActive: true,
        variants: hasVariants && variants.length > 0
          ? {
              create: variants.map((variant: ProductVariantInput) => ({
                sku: variant.sku || `${finalSku}-${variant.name.slice(0, 5).toUpperCase()}`,
                barcode: variant.barcode,
                name: variant.name,
                mrp: Number(variant.mrp),
                costPrice: Number(variant.costPrice),
                sellingPrice: Number(variant.sellingPrice),
                attributes: variant.attributes || {},
                imageUrls: variant.imageUrls || [],
                isActive: true
              }))
            }
          : undefined
      },
      include: {
        category: true,
        variants: true
      }
    })

    // Create opening stock if provided
    if (openingStock.length > 0) {
      for (const stock of openingStock) {
        await prisma.inventoryStock.create({
          data: {
            productId: product.id,
            variantId: stock.variantId,
            storeId: stock.storeId,
            locationId: stock.locationId,
            quantity: stock.quantity,
            reservedQty: 0
          }
        })

        // Create stock movement
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            variantId: stock.variantId,
            storeId: stock.storeId,
            locationId: stock.locationId,
            movementType: 'OPENING_STOCK',
            quantity: stock.quantity,
            notes: stock.notes || 'Opening stock'
          }
        })
      }
    }

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PRODUCT_CREATE',
      module: 'PRODUCT_CREATE',
      entityType: 'Product',
      entityId: product.id,
      metadata: { name, sku: finalSku, hasVariants }
    })

    return createdResponse(product)
  } catch (error) {
    return handlePrismaError(error)
  }
}

interface ProductVariantInput {
  name: string
  sku?: string
  barcode?: string
  mrp: number
  costPrice: number
  sellingPrice: number
  attributes?: Record<string, string>
  imageUrls?: string[]
}

function generateProductSKU(name: string, tenantId: string): string {
  const prefix = name.slice(0, 3).toUpperCase()
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}
