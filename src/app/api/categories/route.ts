import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

/**
 * GET /api/categories - List all categories with optional hierarchy
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('PRODUCT_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const search = searchParams.get('search')
    const parentId = searchParams.get('parentId')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const flat = searchParams.get('flat') === 'true'

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    if (parentId !== null) {
      where.parentId = parentId === 'null' ? null : parentId
    }
    if (!includeInactive) {
      where.isActive = true
    }

    // If flat is requested, return paginated flat list
    if (flat) {
      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          include: {
            parent: { select: { id: true, name: true } },
            _count: { select: { products: true, children: true } }
          },
          skip,
          take: limit,
          orderBy: [{ name: 'asc' }]
        }),
        prisma.category.count({ where })
      ])

      return paginatedResponse(
        categories.map(cat => ({
          ...cat,
          productCount: cat._count.products,
          childrenCount: cat._count.children
        })),
        total,
        page,
        limit
      )
    }

    // Otherwise return hierarchical structure
    const categories = await prisma.category.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      include: {
        children: {
          include: {
            children: {
              include: {
                _count: { select: { products: true } }
              }
            },
            _count: { select: { products: true } }
          }
        },
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    })

    // Only return root categories (no parent)
    const rootCategories = categories.filter(cat => !cat.parentId)

    return successResponse({ data: rootCategories })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/categories - Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('PRODUCT_CREATE', 'CREATE')
    if (error) return error

    const body = await request.json()
    const {
      name,
      description,
      parentId,
      hsnCode,
      imageUrl
    } = body

    if (!name || name.trim().length === 0) {
      return errorResponse('Category name is required', 400)
    }

    // Check for duplicate name within same parent
    const existing = await prisma.category.findFirst({
      where: {
        tenantId: user.tenantId,
        name: { equals: name.trim(), mode: 'insensitive' },
        parentId: parentId || null
      }
    })

    if (existing) {
      return errorResponse('Category with this name already exists in this level', 409)
    }

    // Validate parent exists if provided
    if (parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: parentId, tenantId: user.tenantId }
      })
      if (!parent) {
        return errorResponse('Parent category not found', 404)
      }
    }

    const category = await prisma.category.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        description,
        parentId: parentId || null,
        hsnCode,
        imageUrl,
        isActive: true
      },
      include: {
        parent: { select: { id: true, name: true } }
      }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CATEGORY_CREATE',
      module: 'PRODUCT_SETUP',
      entityType: 'Category',
      entityId: category.id,
      metadata: { name: category.name, parentId }
    })

    return createdResponse(category)
  } catch (error) {
    return handlePrismaError(error)
  }
}