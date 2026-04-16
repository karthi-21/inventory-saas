import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requirePermission,
  successResponse,
  errorResponse,
  handlePrismaError
} from '@/lib/api'

/**
 * GET /api/reports/profitability - Profitability / margin analysis report
 *
 * Uses costPrice on Product/Variant to calculate profit margins.
 * Query params: from, to, storeId, categoryId
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('REPORT_VIEW', 'VIEW')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const storeId = searchParams.get('storeId')
    const categoryId = searchParams.get('categoryId')

    // Build where for invoice items
    const invoiceWhere: Record<string, unknown> = {
      invoice: {
        tenantId: user.tenantId,
        invoiceStatus: 'ACTIVE',
      }
    }

    if (storeId) (invoiceWhere.invoice as Record<string, unknown>).storeId = storeId
    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) dateFilter.lte = new Date(to)
      ;(invoiceWhere.invoice as Record<string, unknown>).invoiceDate = dateFilter
    }

    // Get all invoice items with product info for margin calculation
    const items = await prisma.salesInvoiceItem.findMany({
      where: invoiceWhere,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
            category: { select: { id: true, name: true } }
          }
        },
        variant: {
          select: { id: true, name: true, costPrice: true }
        }
      }
    })

    // Calculate per-product profitability
    const productMap = new Map<string, {
      productId: string
      productName: string
      sku: string
      category: string
      categoryId: string
      quantity: number
      revenue: number
      cost: number
      profit: number
      margin: number
      hasCostPrice: boolean
    }>()

    for (const item of items) {
      const key = item.productId || `${item.description || 'unknown'}_${item.variantId || ''}`
      const costPrice = item.variant?.costPrice
        ? Number(item.variant.costPrice)
        : item.product?.costPrice
          ? Number(item.product.costPrice)
          : null

      const revenue = Number(item.totalAmount) - Number(item.gstAmount) // Net revenue (excl GST)
      const cost = costPrice ? costPrice * item.quantity : 0

      const existing = productMap.get(key) || {
        productId: item.productId || '',
        productName: item.product?.name || item.description || 'Unknown',
        sku: item.product?.sku || '',
        category: item.product?.category?.name || 'Uncategorized',
        categoryId: item.product?.category?.id || '',
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        hasCostPrice: costPrice !== null,
      }

      existing.quantity += item.quantity
      existing.revenue += revenue
      existing.cost += cost
      existing.profit = existing.revenue - existing.cost
      existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0

      productMap.set(key, existing)
    }

    const products = Array.from(productMap.values()).sort((a, b) => b.profit - a.profit)

    // Calculate per-category profitability
    const categoryMap = new Map<string, {
      categoryId: string
      categoryName: string
      quantity: number
      revenue: number
      cost: number
      profit: number
      margin: number
      productCount: number
      noCostPriceCount: number
    }>()

    for (const product of products) {
      const key = product.categoryId || 'uncategorized'
      const existing = categoryMap.get(key) || {
        categoryId: product.categoryId,
        categoryName: product.category,
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        productCount: 0,
        noCostPriceCount: 0,
      }

      existing.quantity += product.quantity
      existing.revenue += product.revenue
      existing.cost += product.cost
      existing.profit += product.profit
      existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0
      existing.productCount++
      if (!product.hasCostPrice) existing.noCostPriceCount++

      categoryMap.set(key, existing)
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) => b.profit - a.profit)

    // Filter by category if specified
    const filteredProducts = categoryId
      ? products.filter(p => p.categoryId === categoryId)
      : products

    // Summary
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
    const totalCost = products.reduce((sum, p) => sum + p.cost, 0)
    const totalProfit = totalRevenue - totalCost
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    const noCostPriceCount = products.filter(p => !p.hasCostPrice).length

    // Top and bottom performers
    const topPerformers = products.slice(0, 10)
    const bottomPerformers = products.filter(p => p.hasCostPrice).slice(-10).reverse()

    // Margin distribution
    const marginBuckets = {
      below10: products.filter(p => p.hasCostPrice && p.margin < 10).length,
      range10to20: products.filter(p => p.hasCostPrice && p.margin >= 10 && p.margin < 20).length,
      range20to30: products.filter(p => p.hasCostPrice && p.margin >= 20 && p.margin < 30).length,
      above30: products.filter(p => p.hasCostPrice && p.margin >= 30).length,
      noData: noCostPriceCount,
    }

    return successResponse({
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        averageMargin: Math.round(averageMargin * 100) / 100,
        totalProducts: products.length,
        noCostPriceCount,
      },
      products: filteredProducts,
      categories,
      topPerformers,
      bottomPerformers,
      marginBuckets,
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}