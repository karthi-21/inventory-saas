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
 * GET /api/customers - List all customers with filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = getPagination(searchParams)
    const storeId = searchParams.get('storeId')
    const search = searchParams.get('search')
    const type = searchParams.get('type') // 'RETAIL', 'WHOLESALE'
    const hasDue = searchParams.get('hasDue') === 'true'

    // Build where clause
    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (storeId) where.storeId = storeId
    if (type) where.customerType = type
    if (hasDue) {
      where.creditBalance = { gt: 0 }
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search } }
      ]
    }

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          store: {
            select: { id: true, name: true }
          },
          _count: {
            select: { salesInvoices: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ])

    // Calculate outstanding amount
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const invoices = await prisma.salesInvoice.findMany({
          where: { customerId: customer.id },
          select: { amountDue: true }
        })
        const outstandingAmount = invoices.reduce((sum, inv) =>
          sum + Number(inv.amountDue), 0
        )

        return {
          ...customer,
          outstandingAmount
        }
      })
    )

    return paginatedResponse(customersWithBalance, total, page, limit)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/customers - Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const {
      firstName,
      lastName,
      phone,
      email,
      customerType = 'RETAIL',
      gstin,
      address,
      city,
      state,
      pincode,
      storeId,
      creditLimit = 0,
      loyaltyPoints = 0
    } = body

    // Validate required fields
    const validationError = validateRequired(body, ['firstName', 'phone'])
    if (validationError) return errorResponse(validationError, 400)

    // Check if phone already exists for this tenant
    const existingPhone = await prisma.customer.findFirst({
      where: {
        tenantId: user.tenantId,
        phone
      }
    })
    if (existingPhone) {
      return errorResponse('Customer with this phone number already exists', 409)
    }

    // Check if GSTIN exists (if provided)
    if (gstin) {
      const existingGstin = await prisma.customer.findFirst({
        where: {
          tenantId: user.tenantId,
          gstin
        }
      })
      if (existingGstin) {
        return errorResponse('Customer with this GSTIN already exists', 409)
      }
    }

    // Validate store if provided
    if (storeId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, tenantId: user.tenantId }
      })
      if (!store) {
        return errorResponse('Store not found or access denied', 404)
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        tenantId: user.tenantId,
        storeId: storeId || null,
        customerType,
        firstName,
        lastName,
        phone,
        email,
        gstin,
        address,
        city,
        state,
        pincode,
        creditLimit: Number(creditLimit),
        creditBalance: 0,
        loyaltyPoints,
        loyaltyMultiplier: 1.0,
        isActive: true
      },
      include: {
        store: {
          select: { id: true, name: true }
        }
      }
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CUSTOMER_CREATE',
      module: 'CUSTOMER_CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      metadata: { firstName, lastName, phone, customerType }
    })

    return createdResponse(customer)
  } catch (error) {
    return handlePrismaError(error)
  }
}
