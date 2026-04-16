import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/api'

/**
 * GET /api/payment-config
 * Get payment config for the current store
 */
export async function GET() {
  try {
    const { user, error } = await requirePermission('SETTINGS_VIEW', 'VIEW')
    if (error) return error

    const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 })
    }

    const config = await prisma.storePaymentConfig.findUnique({
      where: { storeId: store.id },
    })

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Failed to get payment config:', error)
    return NextResponse.json({ error: 'Failed to get payment config' }, { status: 500 })
  }
}

/**
 * POST /api/payment-config
 * Create payment config for the current store
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 })
    }

    const body = await request.json()

    const config = await prisma.storePaymentConfig.create({
      data: {
        storeId: store.id,
        merchantVPA: body.merchantVPA || '',
        merchantName: body.merchantName || store.name,
        phonepeEnabled: body.phonepeEnabled ?? true,
        cashEnabled: body.cashEnabled ?? true,
        cardEnabled: body.cardEnabled ?? false,
        upiQrEnabled: body.upiQrEnabled ?? true,
        autoSendReceipt: body.autoSendReceipt ?? true,
      },
    })

    return NextResponse.json({ data: config }, { status: 201 })
  } catch (error) {
    console.error('Failed to create payment config:', error)
    return NextResponse.json({ error: 'Failed to create payment config' }, { status: 500 })
  }
}

/**
 * PATCH /api/payment-config
 * Update payment config
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
    if (!store) {
      return NextResponse.json({ error: 'No store found' }, { status: 404 })
    }

    const body = await request.json()

    const config = await prisma.storePaymentConfig.update({
      where: { storeId: store.id },
      data: {
        ...(body.merchantVPA !== undefined && { merchantVPA: body.merchantVPA }),
        ...(body.merchantName !== undefined && { merchantName: body.merchantName }),
        ...(body.phonepeEnabled !== undefined && { phonepeEnabled: body.phonepeEnabled }),
        ...(body.cashEnabled !== undefined && { cashEnabled: body.cashEnabled }),
        ...(body.cardEnabled !== undefined && { cardEnabled: body.cardEnabled }),
        ...(body.upiQrEnabled !== undefined && { upiQrEnabled: body.upiQrEnabled }),
        ...(body.autoSendReceipt !== undefined && { autoSendReceipt: body.autoSendReceipt }),
      },
    })

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('Failed to update payment config:', error)
    return NextResponse.json({ error: 'Failed to update payment config' }, { status: 500 })
  }
}