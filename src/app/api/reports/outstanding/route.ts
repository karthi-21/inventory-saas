import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, successResponse, handlePrismaError } from '@/lib/api'

/**
 * GET /api/reports/outstanding — Outstanding customers with aging buckets
 * Query params: storeId, sortBy (oldest|balance|name), search
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('CUSTOMER_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const sortBy = searchParams.get('sortBy') || 'oldest'
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {
      tenantId: user.tenantId,
      creditBalance: { gt: 0 },
    }
    if (storeId) where.storeId = storeId
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        store: { select: { id: true, name: true } },
        salesInvoices: {
          where: {
            invoiceStatus: 'ACTIVE',
            paymentStatus: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
          },
          select: {
            invoiceNumber: true,
            invoiceDate: true,
            totalAmount: true,
            amountDue: true,
            paymentStatus: true,
          },
          orderBy: { invoiceDate: 'asc' },
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, type: true, notes: true },
        },
      },
    })

    const now = new Date()
    const agingBuckets = {
      current: { label: '0–30 days', color: 'green', total: 0, customers: 0 },
      aging31_60: { label: '31–60 days', color: 'yellow', total: 0, customers: 0 },
      aging61_90: { label: '61–90 days', color: 'orange', total: 0, customers: 0 },
      overdue: { label: '90+ days', color: 'red', total: 0, customers: 0 },
    }

    const outstanding = customers
      .map((c) => {
        const outstandingInvoices = c.salesInvoices
        const totalOutstanding = outstandingInvoices.reduce((s, i) => s + Number(i.amountDue), 0)
        if (totalOutstanding === 0) return null

        const oldestInvoice = outstandingInvoices[0]
        const oldestDate = oldestInvoice ? new Date(oldestInvoice.invoiceDate) : null
        const daysOverdue = oldestDate
          ? Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        let agingBucket = 'current'
        if (daysOverdue > 90) agingBucket = 'overdue'
        else if (daysOverdue > 60) agingBucket = 'aging61_90'
        else if (daysOverdue > 30) agingBucket = 'aging31_60'

        return {
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          email: c.email,
          creditBalance: Number(c.creditBalance),
          totalOutstanding,
          oldestInvoiceDate: oldestDate?.toISOString() ?? null,
          daysOverdue,
          invoiceCount: outstandingInvoices.length,
          agingBucket,
          store: c.store,
          lastFollowUp: c.followUps[0] ? { createdAt: c.followUps[0].createdAt.toISOString(), type: c.followUps[0].type, notes: c.followUps[0].notes } : null,
          invoices: outstandingInvoices.map((i) => ({
            invoiceNumber: i.invoiceNumber,
            date: new Date(i.invoiceDate).toLocaleDateString('en-IN'),
            amount: Number(i.amountDue),
            totalAmount: Number(i.totalAmount),
            status: i.paymentStatus,
          })),
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)

    // Calculate aging bucket totals
    for (const c of outstanding) {
      const bucket = agingBuckets[c.agingBucket as keyof typeof agingBuckets]
      if (bucket) {
        bucket.total += c.totalOutstanding
        bucket.customers++
      }
    }

    // Sort
    if (sortBy === 'balance') {
      outstanding.sort((a, b) => b.totalOutstanding - a.totalOutstanding)
    } else if (sortBy === 'name') {
      outstanding.sort((a, b) => a.firstName.localeCompare(b.firstName))
    } else {
      outstanding.sort((a, b) => b.daysOverdue - a.daysOverdue)
    }

    return successResponse({
      outstanding,
      agingBuckets,
      totalOutstanding: outstanding.reduce((s, c) => s + c.totalOutstanding, 0),
      totalCustomers: outstanding.length,
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}