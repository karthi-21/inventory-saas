import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
  notFoundResponse,
  successResponse,
  errorResponse,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

/**
 * GET /api/vendors/[id] - Get single vendor with details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const vendor = await prisma.vendor.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        purchaseInvoices: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              take: 10,
              include: {
                product: { select: { id: true, name: true, sku: true } }
              }
            }
          }
        }
      }
    })

    if (!vendor) return notFoundResponse('Vendor')

    // Calculate totals
    const totalPurchases = vendor.purchaseInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    const totalPaid = vendor.purchaseInvoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0)
    const outstandingAmount = totalPurchases - totalPaid
    const invoiceCount = vendor.purchaseInvoices.length

    return successResponse({
      ...vendor,
      totalPurchases,
      totalPaid,
      outstandingAmount,
      invoiceCount
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/vendors/[id] - Update vendor
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

    // Verify vendor belongs to tenant
    const existing = await prisma.vendor.findFirst({
      where: { id, tenantId: user.tenantId }
    })
    if (!existing) return notFoundResponse('Vendor')

    const {
      name,
      phone,
      email,
      gstin,
      pan,
      address,
      city,
      state,
      pincode,
      bankName,
      bankAccount,
      bankIfsc,
      creditPeriodDays,
      isActive
    } = body

    // Check if GSTIN exists for another vendor
    if (gstin && gstin !== existing.gstin) {
      const existingGstin = await prisma.vendor.findFirst({
        where: { tenantId: user.tenantId, gstin, NOT: { id } }
      })
      if (existingGstin) {
        return errorResponse('GSTIN already in use', 409)
      }
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(gstin !== undefined && { gstin }),
        ...(pan !== undefined && { pan }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccount !== undefined && { bankAccount }),
        ...(bankIfsc !== undefined && { bankIfsc }),
        ...(creditPeriodDays !== undefined && { creditPeriodDays: Number(creditPeriodDays) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'VENDOR_UPDATE',
      module: 'VENDOR_EDIT',
      entityType: 'Vendor',
      entityId: vendor.id,
      metadata: { name: vendor.name }
    })

    return successResponse(vendor)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/vendors/[id] - Soft delete vendor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    // Verify vendor belongs to tenant
    const existing = await prisma.vendor.findFirst({
      where: { id, tenantId: user.tenantId }
    })
    if (!existing) return notFoundResponse('Vendor')

    // Soft delete
    const vendor = await prisma.vendor.update({
      where: { id },
      data: { isActive: false }
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'VENDOR_DELETE',
      module: 'VENDOR_DELETE',
      entityType: 'Vendor',
      entityId: vendor.id,
      metadata: { name: vendor.name }
    })

    return successResponse({ deleted: true, id: vendor.id })
  } catch (error) {
    return handlePrismaError(error)
  }
}