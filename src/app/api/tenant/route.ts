import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
  successResponse,
  errorResponse,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

/**
 * GET /api/tenant - Get current tenant details
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        name: true,
        pan: true,
        gstin: true,
        fssaiNumber: true,
        address: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
        subdomain: true,
        logoUrl: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!tenant) {
      return errorResponse('Tenant not found', 404)
    }

    return successResponse({ tenant })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * PATCH /api/tenant - Update tenant business details
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const {
      name,
      gstin,
      pan,
      fssaiNumber,
      phone,
      email,
      address,
      state,
      pincode,
    } = body

    // Validate PAN format if provided
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      return errorResponse('Invalid PAN format (should be 10 characters like ABCDE1234F)', 400)
    }

    // Validate GSTIN format if provided
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/.test(gstin)) {
      return errorResponse('Invalid GSTIN format', 400)
    }

    // Validate FSSAI format if provided (14 digits)
    if (fssaiNumber && !/^\d{14}$/.test(fssaiNumber)) {
      return errorResponse('FSSAI number should be 14 digits', 400)
    }

    // Validate pincode if provided
    if (pincode && !/^\d{6}$/.test(pincode)) {
      return errorResponse('PIN code should be 6 digits', 400)
    }

    // Update tenant
    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        name: name ?? undefined,
        gstin: gstin?.toUpperCase() ?? undefined,
        pan: pan?.toUpperCase() ?? undefined,
        fssaiNumber: fssaiNumber ?? undefined,
        phone: phone ?? undefined,
        email: email?.toLowerCase() ?? undefined,
        address: address ?? undefined,
        state: state ?? undefined,
        pincode: pincode ?? undefined,
      },
      select: {
        id: true,
        name: true,
        pan: true,
        gstin: true,
        fssaiNumber: true,
        address: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
      }
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'TENANT_UPDATE',
      module: 'SETTINGS_EDIT',
      entityType: 'Tenant',
      entityId: tenant.id,
      metadata: { name, gstin: gstin ? 'updated' : undefined }
    })

    return successResponse({ tenant })
  } catch (error) {
    return handlePrismaError(error)
  }
}