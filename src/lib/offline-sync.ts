/**
 * Offline Sync Manager
 * Handles syncing pending invoices when connection is restored
 */

import { offlineDB, getPendingInvoices, markInvoiceSynced, markInvoiceConflict } from './offline-db'

export interface SyncResult {
  synced: number
  conflicts: number
  failed: number
  errors: string[]
}

/**
 * Sync all pending invoices to the server
 */
export async function syncPendingInvoices(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, conflicts: 0, failed: 0, errors: [] }
  const pending = await getPendingInvoices()

  if (pending.length === 0) return result

  for (const invoice of pending) {
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice.data),
      })

      if (res.ok) {
        const data = await res.json()
        await markInvoiceSynced(invoice.localId, data.invoiceNumber || data.id)
        result.synced++
      } else if (res.status === 409) {
        await markInvoiceConflict(invoice.localId)
        result.conflicts++
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        result.errors.push(`Invoice ${invoice.localId}: ${err.error || res.statusText}`)
        result.failed++
      }
    } catch (err) {
      result.errors.push(`Invoice ${invoice.localId}: ${String(err)}`)
      result.failed++
    }
  }

  return result
}

/**
 * Cache products from API into IndexedDB
 */
export async function cacheProducts(products: Array<{
  id: string; tenantId: string; storeId: string; name: string; sku: string
  barcode?: string; sellingPrice: number; mrp?: number; costPrice?: number
  gstRate: number; hsnCode?: string; category?: { id: string; name: string }
  variants?: Array<{ id: string; name: string; sku: string; barcode?: string; sellingPrice: number; mrp?: number; inventoryStocks: Array<{ quantity: number }> }>
  inventoryStocks: Array<{ quantity: number; storeId: string }>
}>): Promise<void> {
  await offlineDB.products.bulkPut(
    products.map(p => ({ ...p, updatedAt: Date.now() }))
  )
}

/**
 * Cache customers from API into IndexedDB
 */
export async function cacheCustomers(customers: Array<{
  id: string; tenantId: string; storeId: string; firstName: string; lastName?: string
  phone: string; email?: string; creditBalance: number | string; creditLimit?: number | string; gstin?: string
}>): Promise<void> {
  await offlineDB.customers.bulkPut(
    customers.map(c => ({
      ...c,
      creditBalance: Number(c.creditBalance) || 0,
      creditLimit: c.creditLimit ? Number(c.creditLimit) : undefined,
      updatedAt: Date.now(),
    }))
  )
}

/**
 * Cache categories from API into IndexedDB
 */
export async function cacheCategories(categories: Array<{ id: string; tenantId: string; name: string }>): Promise<void> {
  await offlineDB.categories.bulkPut(
    categories.map(c => ({ ...c, updatedAt: Date.now() }))
  )
}

/**
 * Search products from offline cache
 */
export async function searchOfflineProducts(query: string, storeId?: string): Promise<Array<{
  id: string; name: string; sku: string; barcode?: string; sellingPrice: number
  mrp?: number; gstRate: number; category?: { id: string; name: string }
  variants?: Array<{ id: string; name: string; sku: string; barcode?: string; sellingPrice: number; mrp?: number; inventoryStocks: Array<{ quantity: number }> }>
  inventoryStocks: Array<{ quantity: number; storeId: string }>
}>> {
  const q = query.toLowerCase()
  const products = await offlineDB.products
    .filter(p => {
      if (storeId && p.storeId !== storeId) return false
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || !!(p.barcode && p.barcode.toLowerCase().includes(q))
    })
    .limit(50)
    .toArray()

  return products.map(({ updatedAt: _updatedAt, ...rest }) => rest) // eslint-disable-line @typescript-eslint/no-unused-vars
}

/**
 * Search customers from offline cache
 */
export async function searchOfflineCustomers(query: string): Promise<Array<{
  id: string; firstName: string; lastName?: string; phone: string; email?: string; creditBalance: number; loyaltyPoints: number
}>> {
  const q = query.toLowerCase()
  const customers = await offlineDB.customers
    .filter(c => c.phone.toLowerCase().includes(q) || c.firstName.toLowerCase().includes(q) || !!(c.email && c.email.toLowerCase().includes(q)))
    .limit(20)
    .toArray()

  return customers.map(c => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    email: c.email,
    creditBalance: c.creditBalance,
    loyaltyPoints: 0,
  }))
}

/**
 * Save invoice to offline queue
 */
export async function queueOfflineInvoice(data: Record<string, unknown>, tenantId: string, storeId: string): Promise<string> {
  const localId = `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  await offlineDB.invoices.add({
    id: localId,
    localId,
    status: 'PENDING_SYNC',
    tenantId,
    storeId,
    data,
    createdAt: Date.now(),
  })
  return localId
}

/**
 * Get the count of pending sync invoices
 */
export async function getOfflinePendingCount(): Promise<number> {
  return offlineDB.invoices.where('status').equals('PENDING_SYNC').count()
}