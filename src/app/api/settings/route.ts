import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  handlePrismaError,
  logActivity
} from '@/lib/api'

/**
 * GET /api/settings - Get tenant settings
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_VIEW', 'VIEW')
    if (error) return error

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId }
    })

    if (!settings) {
      // Return default settings if not created yet
      return successResponse({
        tenantId: user.tenantId,
        defaultLanguage: 'en',
        currency: 'INR',
        fiscalYearStart: 4,
        lowStockAlertDays: 7,
        expiryAlertDays: 7,
        invoicePrefix: 'INV',
        decimalPlaces: 2,
        roundOffEnabled: true
      })
    }

    return successResponse(settings)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * POST /api/settings - Create or update tenant settings
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const {
      defaultLanguage,
      currency,
      fiscalYearStart,
      lowStockAlertDays,
      expiryAlertDays,
      invoicePrefix,
      decimalPlaces,
      roundOffEnabled
    } = body

    // Check if settings exist
    const existing = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId }
    })

    let settings
    if (existing) {
      // Update existing settings
      settings = await prisma.tenantSettings.update({
        where: { tenantId: user.tenantId },
        data: {
          defaultLanguage: defaultLanguage ?? undefined,
          currency: currency ?? undefined,
          fiscalYearStart: fiscalYearStart ?? undefined,
          lowStockAlertDays: lowStockAlertDays ?? undefined,
          expiryAlertDays: expiryAlertDays ?? undefined,
          invoicePrefix: invoicePrefix ?? undefined,
          decimalPlaces: decimalPlaces ?? undefined,
          roundOffEnabled: roundOffEnabled ?? undefined
        }
      })
    } else {
      // Create new settings
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId: user.tenantId,
          defaultLanguage: defaultLanguage || 'en',
          currency: currency || 'INR',
          fiscalYearStart: fiscalYearStart || 4,
          lowStockAlertDays: lowStockAlertDays || 7,
          expiryAlertDays: expiryAlertDays || 7,
          invoicePrefix: invoicePrefix || 'INV',
          decimalPlaces: decimalPlaces || 2,
          roundOffEnabled: roundOffEnabled ?? true
        }
      })
    }

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: existing ? 'SETTINGS_UPDATE' : 'SETTINGS_CREATE',
      module: 'SETTINGS_EDIT',
      entityType: 'TenantSettings',
      entityId: settings.id,
      metadata: { currency, invoicePrefix }
    })

    return successResponse(settings)
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * PATCH /api/settings - Partial update of tenant settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()

    // Upsert settings
    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: body,
      create: {
        tenantId: user.tenantId,
        ...body
      }
    })

    // Log activity
    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'SETTINGS_UPDATE',
      module: 'SETTINGS_EDIT',
      entityType: 'TenantSettings',
      entityId: settings.id
    })

    return successResponse(settings)
  } catch (error) {
    return handlePrismaError(error)
  }
}
