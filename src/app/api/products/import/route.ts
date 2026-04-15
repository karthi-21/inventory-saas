import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, errorResponse, handlePrismaError } from '@/lib/api'
import { generateSKU } from '@/lib/api'

interface CSVRow {
  name: string
  sku?: string
  barcode?: string
  category?: string
  brand?: string
  hsnCode?: string
  gstRate?: string | number
  mrp?: string | number
  costPrice?: string | number
  sellingPrice?: string | number
  reorderLevel?: string | number
  hasVariants?: string | boolean
  variantName?: string
  variantSku?: string
  variantBarcode?: string
  variantPrice?: string | number
}

interface ImportResult {
  imported: number
  updated: number
  failed: number
  errors: Array<{ row: number; message: string }>
}

/**
 * POST /api/products/import - Bulk import products from CSV
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('PRODUCT_CREATE', 'CREATE')
    if (error) return error

    const body = await request.json()
    const { rows } = body as { rows: CSVRow[] }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return errorResponse('No rows provided', 400)
    }

    const result: ImportResult = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [],
    }

    // Get all categories for this tenant
    const categories = await prisma.category.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, name: true }
    })
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]))

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // 1-indexed + header row

      try {
        // Validate required fields
        if (!row.name || !row.name.trim()) {
          result.failed++
          result.errors.push({ row: rowNum, message: 'Product name is required' })
          continue
        }

        const name = row.name.trim()
        const sku = row.sku?.trim() || generateSKU(name, user.tenantId.slice(0, 4).toUpperCase())
        const gstRate = row.gstRate ? Number(row.gstRate) : 18

        // Find category
        let categoryId: string | undefined
        if (row.category) {
          categoryId = categoryMap.get(row.category.toLowerCase())
        }

        // Find or create product by SKU
        const existing = await prisma.product.findFirst({
          where: { sku, tenantId: user.tenantId }
        })

        if (existing) {
          // Update existing product
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name,
              barcode: row.barcode?.trim() || null,
              categoryId: categoryId || existing.categoryId,
              brand: row.brand?.trim() || null,
              hsnCode: row.hsnCode?.trim() || null,
              gstRate,
              mrp: row.mrp ? Number(row.mrp) : existing.mrp,
              costPrice: row.costPrice ? Number(row.costPrice) : existing.costPrice,
              sellingPrice: row.sellingPrice ? Number(row.sellingPrice) : existing.sellingPrice,
              reorderLevel: row.reorderLevel ? Number(row.reorderLevel) : existing.reorderLevel,
            }
          })
          result.updated++
        } else {
          // Create new product
          const product = await prisma.product.create({
            data: {
              tenantId: user.tenantId,
              name,
              sku,
              barcode: row.barcode?.trim() || null,
              categoryId: categoryId || null,
              brand: row.brand?.trim() || null,
              hsnCode: row.hsnCode?.trim() || null,
              gstRate,
              mrp: row.mrp ? Number(row.mrp) : 0,
              costPrice: row.costPrice ? Number(row.costPrice) : 0,
              sellingPrice: row.sellingPrice ? Number(row.sellingPrice) : 0,
              reorderLevel: row.reorderLevel ? Number(row.reorderLevel) : 10,
              hasVariants: row.hasVariants === true || row.hasVariants === 'true',
              isActive: true,
            }
          })
          result.imported++
        }
      } catch {
        result.failed++
        result.errors.push({ row: rowNum, message: 'Failed to process row' })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${result.imported} products, updated ${result.updated}, ${result.failed} failed`,
      data: result
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}
