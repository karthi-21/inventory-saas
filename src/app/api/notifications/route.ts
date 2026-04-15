import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api'
import { prisma } from '@/lib/db'

// GET /api/notifications - Get notifications for the current tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant settings for alert thresholds
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    // Collect notifications from various sources
    const notifications: Array<{
      id: string
      type: string
      title: string
      message: string
      severity: 'info' | 'warning' | 'error'
      createdAt: string
      read: boolean
      actionUrl?: string
    }> = []

    // Low stock alerts
    const lowStockItems = await prisma.inventoryStock.findMany({
      where: {
        product: { tenantId: user.tenantId },
        quantity: { lte: 5 },
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, reorderLevel: true },
        },
      },
      take: 10,
    })

    if (lowStockItems.length > 0) {
      notifications.push({
        id: `low-stock-${Date.now()}`,
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${lowStockItems.length} products are running low on stock`,
        severity: 'warning',
        createdAt: new Date().toISOString(),
        read: false,
        actionUrl: '/dashboard/inventory?tab=low',
      })
    }

    // Pending payments
    const pendingInvoices = await prisma.salesInvoice.findMany({
      where: {
        tenantId: user.tenantId,
        paymentStatus: 'DUE',
      },
      select: { id: true, invoiceNumber: true },
      take: 10,
    })

    if (pendingInvoices.length > 0) {
      notifications.push({
        id: `pending-payments-${Date.now()}`,
        type: 'PENDING_PAYMENTS',
        title: 'Pending Payments',
        message: `${pendingInvoices.length} invoices have pending payments`,
        severity: 'info',
        createdAt: new Date().toISOString(),
        read: false,
        actionUrl: '/dashboard/billing?status=DUE',
      })
    }

    // New customers (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const newCustomers = await prisma.customer.count({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: weekAgo },
      },
    })

    if (newCustomers > 0) {
      notifications.push({
        id: `new-customers-${Date.now()}`,
        type: 'NEW_CUSTOMERS',
        title: 'New Customers',
        message: `${newCustomers} new customers registered this week`,
        severity: 'info',
        createdAt: new Date().toISOString(),
        read: false,
      })
    }

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}