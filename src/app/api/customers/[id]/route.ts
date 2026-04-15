import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  notFoundResponse,
  successResponse,
  errorResponse,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

/**
 * GET /api/customers/[id] - Get single customer with details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('CUSTOMER_VIEW', 'VIEW')
    if (error) return error

    const { id } = await params

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        store: { select: { id: true, name: true } },
        salesInvoices: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            store: { select: { id: true, name: true } },
            items: {
              take: 10,
              include: {
                product: { select: { id: true, name: true, sku: true } }
              }
            }
          }
        },
        loyaltyPointsLog: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) return notFoundResponse('Customer')

    // Calculate totals
    const totalPurchases = customer.salesInvoices.length
    const totalSpent = customer.salesInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    const outstandingAmount = customer.salesInvoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0)

    return successResponse({
      ...customer,
      totalPurchases,
      totalSpent,
      outstandingAmount
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/customers/[id] - Update customer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('CUSTOMER_EDIT', 'EDIT')
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Verify customer belongs to tenant
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId: user.tenantId }
    })
    if (!existing) return notFoundResponse('Customer')

    const {
      firstName,
      lastName,
      phone,
      email,
      customerType,
      gstin,
      address,
      city,
      state,
      pincode,
      creditLimit,
      loyaltyMultiplier,
      isActive
    } = body

    // Check if phone exists for another customer
    if (phone && phone !== existing.phone) {
      const existingPhone = await prisma.customer.findFirst({
        where: { tenantId: user.tenantId, phone, NOT: { id } }
      })
      if (existingPhone) {
        return errorResponse('Phone number already in use', 409)
      }
    }

    // Check if GSTIN exists for another customer
    if (gstin && gstin !== existing.gstin) {
      const existingGstin = await prisma.customer.findFirst({
        where: { tenantId: user.tenantId, gstin, NOT: { id } }
      })
      if (existingGstin) {
        return errorResponse('GSTIN already in use', 409)
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(customerType !== undefined && { customerType }),
        ...(gstin !== undefined && { gstin }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(creditLimit !== undefined && { creditLimit: Number(creditLimit) }),
        ...(loyaltyMultiplier !== undefined && { loyaltyMultiplier: Number(loyaltyMultiplier) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CUSTOMER_UPDATE',
      module: 'CUSTOMER_EDIT',
      entityType: 'Customer',
      entityId: customer.id,
      metadata: { firstName: customer.firstName, lastName: customer.lastName }
    })

    return successResponse(customer)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/customers/[id] - Soft delete customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requirePermission('CUSTOMER_DELETE', 'DELETE')
    if (error) return error

    const { id } = await params

    // Verify customer belongs to tenant
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId: user.tenantId }
    })
    if (!existing) return notFoundResponse('Customer')

    // Soft delete
    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: false }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CUSTOMER_DELETE',
      module: 'CUSTOMER_DELETE',
      entityType: 'Customer',
      entityId: customer.id,
      metadata: { firstName: customer.firstName, lastName: customer.lastName }
    })

    return successResponse({ deleted: true, id: customer.id })
  } catch (error) {
    return handlePrismaError(error)
  }
}