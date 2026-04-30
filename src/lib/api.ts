import { NextResponse } from 'next/server'
import { prisma } from './db'
import { createServerSupabaseClient } from './supabase/server'
import { Prisma, PermissionModule, PermissionAction } from '@prisma/client'

/**
 * Get the current authenticated user and their tenant info
 */
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Find user in database with tenant info
  const dbUser = await prisma.user.findFirst({
    where: { email: user.email },
    include: { tenant: true }
  })

  return dbUser
}

/**
 * Get user with store access info
 */
export async function getAuthUserWithAccess() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const dbUser = await prisma.user.findFirst({
    where: { email: user.email },
    include: {
      tenant: true,
      storeAccess: { include: { store: true } },
      userPersonas: { include: { persona: { include: { permissions: true } } } }
    }
  })

  return dbUser
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Standard error response
 */
export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Standard not found response
 */
export function notFoundResponse(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

/**
 * Standard success response
 */
export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Standard created response
 */
export function createdResponse(data: unknown) {
  return NextResponse.json(data, { status: 201 })
}

/**
 * Parse pagination from search params
 */
export function getPagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Generate invoice number
 */
type PrismaTx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function generateInvoiceNumber(tenantId: string, storeId: string, prefix = 'INV', tx?: PrismaTx) {
  const client = tx || prisma
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const datePrefix = `${prefix}${year}${month}${day}`

  // Advisory lock serializes invoice number generation per-store.
  const lockKey = `invoice:${tenantId}:${storeId}:${datePrefix}`
  const lockHash = Array.from(lockKey).reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0x7fffffff, 0)

  if (tx) {
    // Transaction-scoped lock: auto-released on commit/rollback.
    await client.$executeRaw`SELECT pg_advisory_xact_lock(${lockHash})`
  } else {
    // Session-scoped lock: must be released manually.
    await client.$executeRaw`SELECT pg_advisory_lock(${lockHash})`
  }

  const lastInvoice = await client.salesInvoice.findFirst({
    where: { tenantId, storeId },
    orderBy: { createdAt: 'desc' }
  })

  let sequence = 1
  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/(\d+)$/)
    if (match) {
      sequence = parseInt(match[1]) + 1
    }
  }

  const invoiceNumber = `${datePrefix}-${String(sequence).padStart(4, '0')}`

  if (!tx) {
    await client.$executeRaw`SELECT pg_advisory_unlock(${lockHash})`
  }

  return invoiceNumber
}

/**
 * Generate store code
 */
export async function generateStoreCode(tenantId: string) {
  const count = await prisma.store.count({ where: { tenantId } })
  return `STR-${String(count + 1).padStart(3, '0')}`
}

/**
 * Generate SKU
 */
export function generateSKU(name: string, tenantCode?: string) {
  const prefix = tenantCode ? `${tenantCode}-` : ''
  const namePart = name.slice(0, 3).toUpperCase()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${namePart}-${random}`
}

/**
 * Calculate GST
 */
export function calculateGST(amount: number, rate: number, state?: string, billingState?: string) {
  const taxableAmount = amount
  const gstAmount = (taxableAmount * rate) / 100

  let cgst = 0, sgst = 0, igst = 0

  if (state && billingState) {
    if (state === billingState) {
      // Intra-state: CGST + SGST
      cgst = gstAmount / 2
      sgst = gstAmount / 2
    } else {
      // Inter-state: IGST
      igst = gstAmount
    }
  } else {
    // Default to CGST + SGST
    cgst = gstAmount / 2
    sgst = gstAmount / 2
  }

  return {
    taxableAmount,
    gstAmount,
    cgst,
    sgst,
    igst
  }
}

/**
 * Validate required fields
 */
export function validateRequired(body: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Missing required field: ${field}`
    }
  }
  return null
}

/**
 * Log activity
 */
export async function logActivity(params: {
  tenantId: string
  userId?: string
  action: string
  module: string
  entityType?: string
  entityId?: string
  metadata?: Prisma.InputJsonValue
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await prisma.activityLog.create({
      data: params
    })
  } catch {
    // Silently fail - activity logging should not break main operations
  }
}

/**
 * Check if user has permission
 */
export function hasPermission(
  userPersonas: { persona: { permissions: { module: PermissionModule; action: PermissionAction }[] } }[],
  module: PermissionModule,
  action: PermissionAction
): boolean {
  return userPersonas.some(up =>
    up.persona.permissions.some(p =>
      p.module === module && p.action === action
    )
  )
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(message = 'Forbidden: insufficient permissions') {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Require permission for an API route.
 * Owner users (isOwner: true) bypass all permission checks.
 * Returns the authenticated user with access info, or an error response.
 */
export async function requirePermission(
  module: PermissionModule,
  action: PermissionAction
): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getAuthUserWithAccess>>>; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getAuthUserWithAccess()
  if (!user) {
    return { error: unauthorizedResponse() }
  }
  // Owner users bypass permission checks
  if (user.isOwner) {
    // But owners still need an active subscription for mutation endpoints
    if (action !== 'VIEW') {
      const subCheck = await requireActiveSubscription({ tenantId: user.tenantId, isOwner: user.isOwner })
      if ('error' in subCheck) return { error: subCheck.error }
    }
    return { user }
  }
  // Check assigned permissions
  if (!hasPermission(user.userPersonas, module, action)) {
    return { error: forbiddenResponse() }
  }
  // Non-owners need subscription for mutation endpoints
  if (action !== 'VIEW') {
    const subCheck = await requireActiveSubscription({ tenantId: user.tenantId, isOwner: user.isOwner })
    if ('error' in subCheck) return { error: subCheck.error }
  }
  return { user }
}

/**
 * Require an active (paid or non-expired trial) subscription.
 * Returns the user or a 402 Payment Required response.
 */
export async function requireActiveSubscription(user: { tenantId: string; isOwner: boolean }): Promise<{ subscription: unknown } | { error: NextResponse }> {
  // Owner/users always need a valid subscription for mutation endpoints
  const now = new Date()
  const sub = await prisma.subscription.findFirst({
    where: {
      tenantId: user.tenantId,
      OR: [
        { status: 'ACTIVE' },
        { status: 'TRIALING', currentPeriodEnd: { gt: now } },
      ],
    },
  })

  if (!sub) {
    return {
      error: NextResponse.json(
        { error: 'Subscription required. Please subscribe to continue.' },
        { status: 402 }
      ),
    }
  }

  return { subscription: sub }
}

/**
 * Create pagination response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  })
}

/**
 * Handle Prisma errors
 */
export function handlePrismaError(error: unknown): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return errorResponse('Unique constraint violation', 409)
      case 'P2003':
        return errorResponse('Foreign key constraint violation', 409)
      case 'P2025':
        return notFoundResponse()
      default:
        return errorResponse(`Database error: ${error.message}`, 500)
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return errorResponse('Invalid data provided', 400)
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500)
  }

  return errorResponse('An unknown error occurred', 500)
}
