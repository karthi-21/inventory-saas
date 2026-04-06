import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
  notFoundResponse,
  successResponse,
  errorResponse,
  handlePrismaError,
  logActivity,
  validateRequired,
} from '@/lib/api'

/**
 * GET /api/products/[id] - Get single product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const product = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          include: {
            inventoryStocks: {
              select: { quantity: true, reservedQty: true, storeId: true }
            }
          }
        },
        inventoryStocks: {
          select: { quantity: true, reservedQty: true, storeId: true }
        }
      }
    })

    if (!product) return notFoundResponse('Product')

    return successResponse(product)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/products/[id] - Update product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()

    // Verify product belongs to tenant
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId }
    })
    if (!existing) return notFoundResponse('Product')

    const {
      name,
      sku,
      barcode,
      categoryId,
      description,
      brand,
      hsnCode,
      gstRate,
      mrp,
      costPrice,
      sellingPrice,
      reorderLevel,
      productType,
      hasVariants,
      hasSerialNumber,
      hasBatchNumber,
      hasExpiry,
      imageUrls,
      isActive,
    } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(categoryId !== undefined && { categoryId }),
        ...(description !== undefined && { description }),
        ...(brand !== undefined && { brand }),
        ...(hsnCode !== undefined && { hsnCode }),
        ...(gstRate !== undefined && { gstRate: Number(gstRate) }),
        ...(mrp !== undefined && { mrp: Number(mrp) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
        ...(reorderLevel !== undefined && { reorderLevel: Number(reorderLevel) }),
        ...(productType !== undefined && { productType }),
        ...(hasVariants !== undefined && { hasVariants }),
        ...(hasSerialNumber !== undefined && { hasSerialNumber }),
        ...(hasBatchNumber !== undefined && { hasBatchNumber }),
        ...(hasExpiry !== undefined && { hasExpiry }),
        ...(imageUrls !== undefined && { imageUrls }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        category: true,
        variants: { where: { isActive: true } }
      }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PRODUCT_UPDATE',
      module: 'PRODUCT_EDIT',
      entityType: 'Product',
      entityId: product.id,
      metadata: { name: product.name }
    })

    return successResponse(product)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/products/[id] - Soft delete product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    // Verify product belongs to tenant
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: user.tenantId }
    })
    if (!existing) return notFoundResponse('Product')

    // Soft delete: set isActive = false
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PRODUCT_DELETE',
      module: 'PRODUCT_DELETE',
      entityType: 'Product',
      entityId: product.id,
      metadata: { name: product.name }
    })

    return successResponse({ deleted: true, id: product.id })
  } catch (error) {
    return handlePrismaError(error)
  }
}
