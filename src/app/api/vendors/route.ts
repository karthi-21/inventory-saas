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
 * GET /api/vendors - List all vendors with filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

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

    // Calculate total purchases and outstanding
    const vendorsWithStats = await Promise.all(
      vendors.map(async (vendor) => {
        const purchaseStats = await prisma.purchaseInvoice.aggregate({
          where: { vendorId: vendor.id },
          _sum: { totalAmount: true, amountPaid: true }
        })

        const totalPurchases = Number(purchaseStats._sum.totalAmount || 0)
        const amountPaid = Number(purchaseStats._sum.amountPaid || 0)
        const outstandingAmount = totalPurchases - amountPaid

        return {
          ...vendor,
          totalPurchases,
          outstandingAmount
        }
      })
    )

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
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

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
