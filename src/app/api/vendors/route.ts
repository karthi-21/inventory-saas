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
 * GET /api/vendors - List all vendors with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('VENDOR_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const search = searchParams.get('search')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Build where clause
    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (!includeInactive) where.isActive = true

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get vendors with pagination
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          _count: {
            select: { purchaseInvoices: true }
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.vendor.count({ where })
    ])

    // Calculate total purchases and outstanding with a single groupBy query (avoids N+1)
    const vendorStats = await prisma.purchaseInvoice.groupBy({
      by: ['vendorId'],
      where: { vendorId: { in: vendors.map(v => v.id) } },
      _sum: { totalAmount: true, amountPaid: true }
    })
    const statsByVendor = new Map(
      vendorStats.map(s => [
        s.vendorId,
        {
          total: Number(s._sum.totalAmount || 0),
          paid: Number(s._sum.amountPaid || 0)
        }
      ])
    )

    const vendorsWithStats = vendors.map(vendor => {
      const stats = statsByVendor.get(vendor.id)
      const totalPurchases = stats?.total || 0
      const amountPaid = stats?.paid || 0
      return {
        ...vendor,
        totalPurchases,
        outstandingAmount: totalPurchases - amountPaid
      }
    })

    return paginatedResponse(vendorsWithStats, total, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/vendors - Create a new vendor
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('VENDOR_CREATE', 'CREATE')
    if (error) return error

    const body = await request.json()
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
      creditPeriodDays = 0
    } = body

    // Validate required fields
    const validationError = validateRequired(body, ['name'])
    if (validationError) return errorResponse(validationError, 400)

    // Check if GSTIN exists (if provided)
    if (gstin) {
      const existingGstin = await prisma.vendor.findFirst({
        where: {
          tenantId: user.tenantId,
          gstin
        }
      })
      if (existingGstin) {
        return errorResponse('Vendor with this GSTIN already exists', 409)
      }
    }

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        tenantId: user.tenantId,
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
        isActive: true
      }
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'VENDOR_CREATE',
      module: 'VENDOR_CREATE',
      entityType: 'Vendor',
      entityId: vendor.id,
      metadata: { name, phone, email, gstin }
    })

    return createdResponse(vendor)
  } catch (error) {
    return handlePrismaError(error)
  }
}
