import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  getAuthUser,
  unauthorizedResponse,
  successResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/reports - Get sales summary and stock reports
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'sales-summary'
    const storeId = searchParams.get('storeId')
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (fromDate) dateFilter.gte = new Date(fromDate)
    if (toDate) dateFilter.lte = new Date(toDate)

    switch (reportType) {
      case 'sales-summary':
        return getSalesSummary(user.tenantId, storeId, dateFilter)
      case 'sales-by-product':
        return getSalesByProduct(user.tenantId, storeId, dateFilter)
      case 'sales-by-category':
        return getSalesByCategory(user.tenantId, storeId, dateFilter)
      case 'stock-report':
        return getStockReport(user.tenantId, storeId)
      case 'stock-movement':
        return getStockMovement(user.tenantId, storeId, dateFilter)
      case 'gst-summary':
        return getGstSummary(user.tenantId, storeId, dateFilter)
      case 'customer-outstanding':
        return getCustomerOutstanding(user.tenantId)
      case 'daily-sales':
        return getDailySales(user.tenantId, storeId, dateFilter)
      default:
        return successResponse({ error: 'Invalid report type' }, 400)
    }
  } catch (error) {
    return handlePrismaError(error)
  }
}

async function getSalesSummary(
  tenantId: string,
  storeId: string | null,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = { tenantId }
  if (storeId) where.storeId = storeId
  if (Object.keys(dateFilter).length > 0) {
    where.invoiceDate = dateFilter
  }

  const [invoices, aggregates] = await Promise.all([
    prisma.salesInvoice.findMany({
      where,
      select: {
        totalAmount: true,
        amountPaid: true,
        amountDue: true,
        totalGst: true,
        totalDiscount: true,
        billingType: true,
        paymentStatus: true
      }
    }),
    prisma.salesInvoice.aggregate({
      where,
      _sum: {
        totalAmount: true,
        amountPaid: true,
        amountDue: true,
        totalGst: true,
        totalDiscount: true
      },
      _count: {
        id: true
      }
    })
  ])

  // Group by payment status
  const byStatus = invoices.reduce((acc, inv) => {
    acc[inv.paymentStatus] = (acc[inv.paymentStatus] || 0) + Number(inv.totalAmount)
    return acc
  }, {} as Record<string, number>)

  // Group by billing type
  const byBillingType = invoices.reduce((acc, inv) => {
    acc[inv.billingType] = (acc[inv.billingType] || 0) + Number(inv.totalAmount)
    return acc
  }, {} as Record<string, number>)

  return successResponse({
    summary: {
      totalInvoices: aggregates._count.id,
      totalRevenue: Number(aggregates._sum.totalAmount || 0),
      totalPaid: Number(aggregates._sum.amountPaid || 0),
      totalDue: Number(aggregates._sum.amountDue || 0),
      totalGst: Number(aggregates._sum.totalGst || 0),
      totalDiscount: Number(aggregates._sum.totalDiscount || 0)
    },
    byStatus,
    byBillingType
  })
}

async function getSalesByProduct(
  tenantId: string,
  storeId: string | null,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = {
    invoice: { tenantId }
  }
  if (storeId) where.invoice = { ...where.invoice as Record<string, unknown>, storeId }
  if (Object.keys(dateFilter).length > 0) {
    where.invoice = { ...where.invoice as Record<string, unknown>, invoiceDate: dateFilter }
  }

  const items = await prisma.salesInvoiceItem.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true, sku: true, category: { select: { name: true } } }
      },
      variant: {
        select: { id: true, name: true }
      }
    }
  })

  // Aggregate by product
  const productMap = new Map<string, {
    productId: string
    productName: string
    sku: string
    category: string
    quantity: number
    revenue: number
    gstAmount: number
  }>()

  for (const item of items) {
    const key = item.productId || 'unknown'
    const existing = productMap.get(key) || {
      productId: item.productId || '',
      productName: item.product?.name || item.description || 'Unknown',
      sku: item.product?.sku || '',
      category: item.product?.category?.name || '',
      quantity: 0,
      revenue: 0,
      gstAmount: 0
    }

    existing.quantity += item.quantity
    existing.revenue += Number(item.totalAmount)
    existing.gstAmount += Number(item.gstAmount)
    productMap.set(key, existing)
  }

  return successResponse({
    products: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)
  })
}

async function getSalesByCategory(
  tenantId: string,
  storeId: string | null,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const items = await prisma.salesInvoiceItem.findMany({
    where: {
      invoice: {
        tenantId,
        ...(storeId && { storeId }),
        ...(Object.keys(dateFilter).length > 0 && { invoiceDate: dateFilter })
      }
    },
    include: {
      product: {
        include: { category: true }
      }
    }
  })

  const categoryMap = new Map<string, {
    categoryId: string
    categoryName: string
    quantity: number
    revenue: number
  }>()

  for (const item of items) {
    const category = item.product?.category
    const key = category?.id || 'uncategorized'
    const existing = categoryMap.get(key) || {
      categoryId: category?.id || '',
      categoryName: category?.name || 'Uncategorized',
      quantity: 0,
      revenue: 0
    }

    existing.quantity += item.quantity
    existing.revenue += Number(item.totalAmount)
    categoryMap.set(key, existing)
  }

  return successResponse({
    categories: Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue)
  })
}

async function getStockReport(tenantId: string, storeId: string | null) {
  const where: Record<string, unknown> = {
    store: { tenantId }
  }
  if (storeId) where.storeId = storeId

  const stocks = await prisma.inventoryStock.findMany({
    where,
    include: {
      product: {
        include: { category: true }
      },
      variant: true,
      store: { select: { name: true } },
      location: { select: { name: true } }
    }
  })

  const stockValue = stocks.reduce((sum, stock) => {
    const price = stock.variant?.costPrice
      ? Number(stock.variant.costPrice)
      : stock.product?.costPrice
        ? Number(stock.product.costPrice)
        : 0
    return sum + (price * stock.quantity)
  }, 0)

  const lowStock = stocks.filter(s =>
    s.product && s.quantity <= s.product.reorderLevel
  )

  const outOfStock = stocks.filter(s => s.quantity === 0)

  return successResponse({
    totalProducts: stocks.length,
    stockValue,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    stocks: stocks.map(s => ({
      productId: s.productId,
      productName: s.product?.name || 'Unknown',
      sku: s.product?.sku || '',
      variant: s.variant?.name,
      store: s.store?.name,
      location: s.location?.name,
      quantity: s.quantity,
      reorderLevel: s.product?.reorderLevel || 0,
      isLowStock: s.product ? s.quantity <= s.product.reorderLevel : false
    }))
  })
}

async function getStockMovement(
  tenantId: string,
  storeId: string | null,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const movements = await prisma.stockMovement.findMany({
    where: {
      storeId: tenantId,
      ...(storeId && { storeId }),
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  // Group by movement type
  const byType = movements.reduce((acc, mov) => {
    acc[mov.movementType] = (acc[mov.movementType] || 0) + Math.abs(mov.quantity)
    return acc
  }, {} as Record<string, number>)

  return successResponse({
    movements,
    summary: { byType }
  })
}

async function getGstSummary(
  tenantId: string,
  storeId: string | null,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const items = await prisma.salesInvoiceItem.findMany({
    where: {
      invoice: {
        tenantId,
        ...(storeId && { storeId }),
        ...(Object.keys(dateFilter).length > 0 && { invoiceDate: dateFilter })
      }
    },
    include: {
      product: { select: { hsnCode: true } }
    }
  })

  // Group by HSN code
  const hsnMap = new Map<string, {
    hsnCode: string
    taxableAmount: number
    cgst: number
    sgst: number
    igst: number
    totalGst: number
    totalAmount: number
    quantity: number
  }>()

  for (const item of items) {
    const hsn = item.hsnCode || item.product?.hsnCode || 'N/A'
    const existing = hsnMap.get(hsn) || {
      hsnCode: hsn,
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGst: 0,
      totalAmount: 0,
      quantity: 0
    }

    const taxableAmount = Number(item.totalAmount) - Number(item.gstAmount)
    existing.taxableAmount += taxableAmount
    existing.totalGst += Number(item.gstAmount)
    existing.totalAmount += Number(item.totalAmount)
    existing.quantity += item.quantity

    // Split GST into CGST/SGST (assuming intra-state for now)
    existing.cgst += Number(item.gstAmount) / 2
    existing.sgst += Number(item.gstAmount) / 2

    hsnMap.set(hsn, existing)
  }

  const summary = Array.from(hsnMap.values())
  const totals = summary.reduce((acc, s) => ({
    taxableAmount: acc.taxableAmount + s.taxableAmount,
    cgst: acc.cgst + s.cgst,
    sgst: acc.sgst + s.sgst,
    igst: acc.igst + s.igst,
    totalGst: acc.totalGst + s.totalGst,
    totalAmount: acc.totalAmount + s.totalAmount
  }), { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, totalAmount: 0 })

  return successResponse({
    summary,
    totals
  })
}

async function getCustomerOutstanding(tenantId: string) {
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    include: {
      _count: { select: { salesInvoices: true } }
    }
  })

  const withOutstanding = await Promise.all(
    customers.map(async (customer) => {
      const invoiceSummary = await prisma.salesInvoice.aggregate({
        where: { customerId: customer.id },
        _sum: { amountDue: true, totalAmount: true }
      })

      return {
        ...customer,
        totalDue: Number(invoiceSummary._sum.amountDue || 0),
        totalPurchases: Number(invoiceSummary._sum.totalAmount || 0)
      }
    })
  )

  const withDue = withOutstanding.filter(c => c.totalDue > 0)

  return successResponse({
    customers: withDue.sort((a, b) => b.totalDue - a.totalDue),
    totalOutstanding: withDue.reduce((sum, c) => sum + c.totalDue, 0)
  })
}

async function getDailySales(
  tenantId: string,
  storeId: string | null,
  dateFilter: { gte?: Date; lte?: Date }
) {
  const where: Record<string, unknown> = { tenantId }
  if (storeId) where.storeId = storeId
  if (Object.keys(dateFilter).length > 0) {
    where.invoiceDate = dateFilter
  }

  const invoices = await prisma.salesInvoice.findMany({
    where,
    select: {
      invoiceDate: true,
      totalAmount: true,
      amountPaid: true,
      amountDue: true,
      totalGst: true
    }
  })

  // Group by date
  const dailyMap = new Map<string, {
    date: string
    invoices: number
    revenue: number
    paid: number
    due: number
    gst: number
  }>()

  for (const inv of invoices) {
    const dateKey = inv.invoiceDate.toISOString().split('T')[0]
    const existing = dailyMap.get(dateKey) || {
      date: dateKey,
      invoices: 0,
      revenue: 0,
      paid: 0,
      due: 0,
      gst: 0
    }

    existing.invoices++
    existing.revenue += Number(inv.totalAmount)
    existing.paid += Number(inv.amountPaid)
    existing.due += Number(inv.amountDue)
    existing.gst += Number(inv.totalGst)

    dailyMap.set(dateKey, existing)
  }

  const dailySales = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))

  return successResponse({
    dailySales,
    totals: dailySales.reduce((acc, day) => ({
      revenue: acc.revenue + day.revenue,
      paid: acc.paid + day.paid,
      due: acc.due + day.due,
      gst: acc.gst + day.gst
    }), { revenue: 0, paid: 0, due: 0, gst: 0 })
  })
}
