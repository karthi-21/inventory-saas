import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/settings/loyalty - Get loyalty configuration
 */
export async function GET() {
  try {
    const { user, error } = await requirePermission('SETTINGS_VIEW', 'VIEW')
    if (error) return error

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    if (!settings) {
      return errorResponse('Settings not found', 404)
    }

    return successResponse({
      loyaltyEnabled: settings.loyaltyEnabled,
      pointsPerRupee: Number(settings.pointsPerRupee),
      rupeePerPoint: Number(settings.rupeePerPoint),
      minimumRedemption: settings.minimumRedemption,
      pointsExpiryDays: settings.pointsExpiryDays,
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/settings/loyalty - Update loyalty configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const {
      loyaltyEnabled,
      pointsPerRupee,
      rupeePerPoint,
      minimumRedemption,
      pointsExpiryDays,
    } = body as {
      loyaltyEnabled?: boolean
      pointsPerRupee?: number
      rupeePerPoint?: number
      minimumRedemption?: number
      pointsExpiryDays?: number
    }

    // Validate ranges
    if (pointsPerRupee !== undefined && pointsPerRupee < 0) {
      return errorResponse('Points per rupee must be >= 0', 400)
    }
    if (rupeePerPoint !== undefined && rupeePerPoint < 0) {
      return errorResponse('Rupee per point must be >= 0', 400)
    }
    if (minimumRedemption !== undefined && minimumRedemption < 0) {
      return errorResponse('Minimum redemption must be >= 0', 400)
    }
    if (pointsExpiryDays !== undefined && pointsExpiryDays < 0) {
      return errorResponse('Points expiry days must be >= 0', 400)
    }

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {
        ...(loyaltyEnabled !== undefined && { loyaltyEnabled }),
        ...(pointsPerRupee !== undefined && { pointsPerRupee: pointsPerRupee }),
        ...(rupeePerPoint !== undefined && { rupeePerPoint }),
        ...(minimumRedemption !== undefined && { minimumRedemption }),
        ...(pointsExpiryDays !== undefined && { pointsExpiryDays }),
      },
      create: {
        tenantId: user.tenantId,
        loyaltyEnabled: loyaltyEnabled ?? true,
        pointsPerRupee: pointsPerRupee ?? 1,
        rupeePerPoint: rupeePerPoint ?? 0.25,
        minimumRedemption: minimumRedemption ?? 100,
        pointsExpiryDays: pointsExpiryDays ?? 365,
      },
    })

    return successResponse({
      loyaltyEnabled: settings.loyaltyEnabled,
      pointsPerRupee: Number(settings.pointsPerRupee),
      rupeePerPoint: Number(settings.rupeePerPoint),
      minimumRedemption: settings.minimumRedemption,
      pointsExpiryDays: settings.pointsExpiryDays,
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}