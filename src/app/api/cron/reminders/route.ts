import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, paymentReminderEmail, lowStockAlertEmail } from '@/lib/emails'

/**
 * POST /api/cron/reminders
 * Daily cron: auto payment reminders + low stock alerts
 * Called by Vercel Cron at 9 AM IST
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const results = { tenantsProcessed: 0, remindersSent: 0, stockAlertsSent: 0, errors: 0 }

  try {
    const tenants = await prisma.tenant.findMany({
      where: { settings: { emailNotificationsEnabled: true } },
      include: { settings: true, stores: { where: { isActive: true } } },
    })

    for (const tenant of tenants) {
      if (!tenant.settings) continue
      const freq = tenant.settings.paymentReminderFrequency
      const now = new Date()
      const shouldSendToday = freq === 'DAILY' || (freq === 'WEEKLY' && now.getDay() === 1) || (freq === 'MONTHLY' && now.getDate() === 1)
      const reminderDays = tenant.settings.lowStockAlertDays || 7

      for (const store of tenant.stores) {
        // Payment reminders
        if (shouldSendToday) {
          const customers = await prisma.customer.findMany({
            where: { tenantId: tenant.id, storeId: store.id, creditBalance: { gt: 0 }, email: { not: null } },
          })
          for (const customer of customers) {
            try {
              const recentReminder = await prisma.followUp.findFirst({
                where: { customerId: customer.id, type: 'EMAIL_SENT', createdAt: { gte: new Date(now.getTime() - 86400000) } },
              })
              if (recentReminder) continue

              const invoices = await prisma.salesInvoice.findMany({
                where: { customerId: customer.id, tenantId: tenant.id, invoiceStatus: 'ACTIVE', paymentStatus: { in: ['DUE', 'OVERDUE', 'PARTIAL'] }, invoiceDate: { lte: new Date(now.getTime() - reminderDays * 86400000) } },
                orderBy: { invoiceDate: 'asc' },
              })
              if (invoices.length === 0) continue

              const totalOutstanding = invoices.reduce((s, i) => s + Number(i.amountDue), 0)
              if (!customer.email) continue
              await sendEmail({
                to: customer.email,
                subject: `Payment Reminder - Outstanding ₹${totalOutstanding.toLocaleString('en-IN')} at ${store.name}`,
                html: paymentReminderEmail({ customerName: customer.firstName, storeName: store.name, totalOutstanding, invoiceCount: invoices.length, invoiceBreakdown: invoices.map(i => ({ invoiceNumber: i.invoiceNumber, date: new Date(i.invoiceDate).toLocaleDateString('en-IN'), amount: Number(i.amountDue) })) }),
                tags: { type: 'auto_reminder', customerId: customer.id },
              })
              await prisma.followUp.create({ data: { customerId: customer.id, type: 'EMAIL_SENT', notes: `Auto reminder: ₹${totalOutstanding.toLocaleString('en-IN')}` } })
              await prisma.emailLog.create({ data: { tenantId: tenant.id, to: customer.email, template: 'payment_reminder', subject: 'Payment Reminder', status: 'SENT' } })
              results.remindersSent++
            } catch (e) { console.error('Reminder error:', e); results.errors++ }
          }
        }

        // Low stock alerts
        if (tenant.settings.lowStockEmailAlerts) {
          const lowStockItems = await prisma.inventoryStock.findMany({
            where: { product: { tenantId: tenant.id }, quantity: { lte: 10 } },
            include: { product: { select: { name: true, sku: true, reorderLevel: true } } },
            take: 20,
          })
          if (lowStockItems.length > 0) {
            const owner = await prisma.user.findFirst({ where: { tenantId: tenant.id } })
            if (owner?.email) {
              try {
                await sendEmail({
                  to: owner.email,
                  subject: `⚠️ Low Stock Alert - ${lowStockItems.length} items at ${store.name}`,
                  html: lowStockAlertEmail({ storeName: store.name, items: lowStockItems.map(i => ({ name: i.product?.name || 'Unknown', sku: i.product?.sku || '-', currentStock: i.quantity, reorderLevel: i.product?.reorderLevel || 10 })), inventoryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/inventory` }),
                  tags: { type: 'low_stock_alert', storeId: store.id },
                })
                await prisma.emailLog.create({ data: { tenantId: tenant.id, to: owner.email, template: 'low_stock_alert', subject: 'Low Stock Alert', status: 'SENT' } })
                results.stockAlertsSent++
              } catch (e) { console.error('Stock alert error:', e); results.errors++ }
            }
          }
        }
      }
      results.tenantsProcessed++
    }
  } catch (err) { console.error('Cron error:', err); results.errors++ }

  return NextResponse.json(results)
}
