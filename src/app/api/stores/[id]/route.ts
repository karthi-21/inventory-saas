import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  notFoundResponse,
  errorResponse,
  handlePrismaError,
  logActivity
} from '@/lib/api'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stores/[id] - Get a single store by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requirePermission('STORE_VIEW', 'VIEW')
    if (error) return error

    const { id } = await params

    const store = await prisma.store.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        locations: true,
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isActive: true
              }
            }
          }
        },
        _count: {
          select: {
            inventoryStocks: true,
            salesInvoices: true
          }
        }
      }
    })

    if (!store) return notFoundResponse('Store')

    return successResponse(store)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/stores/[id] - Update a store
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requirePermission('STORE_EDIT', 'EDIT')
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Check if store exists and belongs to tenant
    const existing = await prisma.store.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!existing) return notFoundResponse('Store')

    const { name, address, state, pincode, phone, isActive, locations } = body

    // Update store
    const store = await prisma.store.update({
      where: { id },
      data: {
        name: name ?? undefined,
        address: address ?? undefined,
        state: state ?? undefined,
        pincode: pincode ?? undefined,
        phone: phone ?? undefined,
        isActive: isActive ?? undefined,
        updatedAt: new Date()
      },
      include: { locations: true }
    })

    // Handle location updates if provided
    if (locations && Array.isArray(locations)) {
      for (const loc of locations) {
        if (loc.id) {
          // Update existing location
          await prisma.location.update({
            where: { id: loc.id },
            data: {
              name: loc.name,
              type: loc.type,
              isActive: loc.isActive
            }
          })
        } else {
          // Create new location
          await prisma.location.create({
            data: {
              storeId: id,
              name: loc.name,
              type: loc.type,
              isActive: true
            }
          })
        }
      }
    }

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STORE_UPDATE',
      module: 'STORE_EDIT',
      entityType: 'Store',
      entityId: id,
      metadata: { name, isActive }
    })

    return successResponse(store)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/stores/[id] - Archive/soft delete a store
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await requirePermission('STORE_EDIT', 'DELETE')
    if (error) return error

    const { id } = await params

    // Check if store exists and belongs to tenant
    const existing = await prisma.store.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!existing) return notFoundResponse('Store')

    // Archive the store (soft delete by setting isActive to false)
    const store = await prisma.store.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STORE_ARCHIVE',
      module: 'STORE_EDIT',
      entityType: 'Store',
      entityId: id,
      metadata: { name: existing.name }
    })

    return successResponse({
      message: 'Store archived successfully',
      store
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}
