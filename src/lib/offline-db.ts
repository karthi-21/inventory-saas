/**
 * Offline Database using Dexie.js (IndexedDB wrapper)
 * Stores products, categories, customers for offline POS access
 */

import Dexie, { type Table } from 'dexie'

export interface OfflineProduct {
  id: string
  tenantId: string
  storeId: string
  name: string
  sku: string
  barcode?: string
  sellingPrice: number
  mrp?: number
  costPrice?: number
  gstRate: number
  hsnCode?: string
  category?: { id: string; name: string }
  variants?: Array<{
    id: string; name: string; sku: string; barcode?: string
    sellingPrice: number; mrp?: number; inventoryStocks: Array<{ quantity: number }>
  }>
  inventoryStocks: Array<{ quantity: number; storeId: string }>
  updatedAt: number
}

export interface OfflineCustomer {
  id: string; tenantId: string; storeId: string; firstName: string; lastName?: string
  phone: string; email?: string; creditBalance: number; creditLimit?: number; gstin?: string; updatedAt: number
}

export interface OfflineCategory { id: string; tenantId: string; name: string; updatedAt: number }

export interface OfflineInvoice {
  id: string; localId: string; status: 'PENDING_SYNC' | 'SYNCED' | 'CONFLICT'
  tenantId: string; storeId: string; data: Record<string, unknown>
  createdAt: number; syncedAt?: number; realInvoiceNumber?: string
}

export interface OfflineStoreConfig {
  id: string; storeId: string; storeName: string; merchantVPA?: string; merchantName?: string
  phonepeEnabled: boolean; cashEnabled: boolean; upiQrEnabled: boolean; updatedAt: number
}

class OmniBIZOfflineDB extends Dexie {
  products!: Table<OfflineProduct>
  customers!: Table<OfflineCustomer>
  categories!: Table<OfflineCategory>
  invoices!: Table<OfflineInvoice>
  storeConfigs!: Table<OfflineStoreConfig>

  constructor() {
    super('omnibiz_offline')
    this.version(1).stores({
      products: 'id, tenantId, storeId, sku, barcode, name, updatedAt',
      customers: 'id, tenantId, storeId, phone, updatedAt',
      categories: 'id, tenantId, updatedAt',
      invoices: 'localId, status, tenantId, storeId, createdAt',
      storeConfigs: 'storeId',
    })
  }
}

export const offlineDB = new OmniBIZOfflineDB()

export async function clearOfflineData(): Promise<void> {
  await offlineDB.products.clear()
  await offlineDB.customers.clear()
  await offlineDB.categories.clear()
  await offlineDB.invoices.clear()
  await offlineDB.storeConfigs.clear()
}

export async function getPendingInvoiceCount(): Promise<number> {
  return offlineDB.invoices.where('status').equals('PENDING_SYNC').count()
}

export async function getPendingInvoices(): Promise<OfflineInvoice[]> {
  return offlineDB.invoices.where('status').equals('PENDING_SYNC').toArray()
}

export async function markInvoiceSynced(localId: string, realInvoiceNumber: string): Promise<void> {
  await offlineDB.invoices.update(localId, { status: 'SYNCED', syncedAt: Date.now(), realInvoiceNumber })
}

export async function markInvoiceConflict(localId: string): Promise<void> {
  await offlineDB.invoices.update(localId, { status: 'CONFLICT' })
}
