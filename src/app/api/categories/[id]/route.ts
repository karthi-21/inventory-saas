import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

/**
 * GET /api/categories/[id] - Get single category with details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('PRODUCT_VIEW', 'VIEW')
    if (error) return error

    const { id } = await params

    const category = await prisma.category.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, imageUrl: true }
        },
        products: {
          where: { isActive: true },
          select: { id: true, name: true, sku: true },
          take: 10
        },
        _count: { select: { products: true, children: true } }
      }
    })

    if (!category) {
      return errorResponse('Category not found', 404)
    }

    return successResponse({
      ...category,
      productCount: category._count.products,
      childrenCount: category._count.children
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/categories/[id] - Update category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('PRODUCT_EDIT', 'EDIT')
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Check category exists
    const existing = await prisma.category.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!existing) {
      return errorResponse('Category not found', 404)
    }

    const {
      name,
      description,
      parentId,
      hsnCode,
      imageUrl,
      isActive
    } = body

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          tenantId: user.tenantId,
          name: { equals: name.trim(), mode: 'insensitive' },
          parentId: parentId || null,
          id: { not: id }
        }
      })
      if (duplicate) {
        return errorResponse('Category with this name already exists', 409)
      }
    }

    // Validate parent exists and is not self or descendant
    if (parentId) {
      if (parentId === id) {
        return errorResponse('Category cannot be its own parent', 400)
      }

      // Check for circular reference
      const isCircular = await checkCircularReference(id, parentId)
      if (isCircular) {
        return errorResponse('Cannot create circular category hierarchy', 400)
      }

      const parent = await prisma.category.findFirst({
        where: { id: parentId, tenantId: user.tenantId }
      })
      if (!parent) {
        return errorResponse('Parent category not found', 404)
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name?.trim() ?? undefined,
        description,
        parentId: parentId === null ? null : parentId ?? undefined,
        hsnCode,
        imageUrl,
        isActive
      },
      include: {
        parent: { select: { id: true, name: true } }
      }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CATEGORY_UPDATE',
      module: 'PRODUCT_SETUP',
      entityType: 'Category',
      entityId: category.id,
      metadata: { name: category.name }
    })

    return successResponse(category)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/categories/[id] - Delete category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('PRODUCT_DELETE', 'DELETE')
    if (error) return error

    const { id } = await params

    // Check category exists
    const existing = await prisma.category.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        _count: { select: { products: true, children: true } }
      }
    })

    if (!existing) {
      return errorResponse('Category not found', 404)
    }

    // Check for products in category
    if (existing._count.products > 0) {
      return errorResponse(
        `Cannot delete category with ${existing._count.products} products. Move or delete products first.`,
        400
      )
    }

    // Check for child categories
    if (existing._count.children > 0) {
      return errorResponse(
        `Cannot delete category with ${existing._count.children} sub-categories. Delete or move sub-categories first.`,
        400
      )
    }

    await prisma.category.delete({ where: { id } })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CATEGORY_DELETE',
      module: 'PRODUCT_SETUP',
      entityType: 'Category',
      entityId: id,
      metadata: { name: existing.name }
    })

    return successResponse({ deleted: true })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * Check if setting parentId would create a circular reference
 */
async function checkCircularReference(categoryId: string, newParentId: string): Promise<boolean> {
  let currentParentId: string | null = newParentId

  while (currentParentId) {
    if (currentParentId === categoryId) {
      return true
    }

    const parent: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true }
    })

    currentParentId = parent?.parentId || null
  }

  return false
}