/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Global state keys (shared with vi.mock factories via globalThis)
// ---------------------------------------------------------------------------

export const AUTH_KEY = '__EZVENTO_TEST_AUTH_USER__' as const
export const PRISMA_DATA_KEY = '__EZVENTO_TEST_PRISMA_DATA__' as const

export function setAuthUser(user: any) { (globalThis as any)[AUTH_KEY] = user }
export function setPrismaData(data: any) { (globalThis as any)[PRISMA_DATA_KEY] = data }

// ---------------------------------------------------------------------------
// Mock users — DB records that prisma.user.findFirst returns.
// Must include nested relations expected by requirePermission().
// ---------------------------------------------------------------------------

export function makeDbUser(overrides: {
  id: string
  email: string
  firstName: string
  lastName: string
  tenantId: string
  isOwner: boolean
  userPersonas?: { persona: { permissions: { module: string; action: string }[] } }[]
  storeAccess?: any[]
}) {
  return {
    id: overrides.id,
    email: overrides.email,
    firstName: overrides.firstName,
    lastName: overrides.lastName,
    tenantId: overrides.tenantId,
    isOwner: overrides.isOwner,
    tenant: { id: overrides.tenantId, name: `Tenant ${overrides.tenantId}` },
    storeAccess: overrides.storeAccess || [],
    userPersonas: (overrides.userPersonas || []).map((up) => ({
      persona: {
        permissions: up.persona.permissions.map((p) => ({
          module: p.module,
          action: p.action,
        })),
      },
    })),
  }
}

export const TENANT_A_DB = makeDbUser({
  id: 'user-a1',
  email: 'alice@tenant-a.com',
  firstName: 'Alice',
  lastName: 'Anderson',
  tenantId: 'tenant-a',
  isOwner: true,
})

export const TENANT_B_DB = makeDbUser({
  id: 'user-b1',
  email: 'bob@tenant-b.com',
  firstName: 'Bob',
  lastName: 'Baker',
  tenantId: 'tenant-b',
  isOwner: true,
})

export const TENANT_A_EMPLOYEE_DB = makeDbUser({
  id: 'user-a2',
  email: 'carol@tenant-a.com',
  firstName: 'Carol',
  lastName: 'Clark',
  tenantId: 'tenant-a',
  isOwner: false,
  userPersonas: [
    {
      persona: {
        permissions: [
          { module: 'STORE_VIEW', action: 'VIEW' },
          { module: 'STORE_EDIT', action: 'CREATE' },
          { module: 'PRODUCT_VIEW', action: 'VIEW' },
          { module: 'PRODUCT_CREATE', action: 'CREATE' },
          { module: 'PRODUCT_EDIT', action: 'EDIT' },
          { module: 'PRODUCT_DELETE', action: 'DELETE' },
          { module: 'BILLING_VIEW', action: 'VIEW' },
          { module: 'BILLING_CREATE', action: 'CREATE' },
          { module: 'CUSTOMER_VIEW', action: 'VIEW' },
          { module: 'CUSTOMER_CREATE', action: 'CREATE' },
        ],
      },
    },
  ],
})

// Supabase-level auth users (just email + id)
export const TENANT_A_AUTH = { id: 'user-a1', email: 'alice@tenant-a.com' }
export const TENANT_B_AUTH = { id: 'user-b1', email: 'bob@tenant-b.com' }
export const TENANT_A_EMPLOYEE_AUTH = { id: 'user-a2', email: 'carol@tenant-a.com' }

// ---------------------------------------------------------------------------
// Seed data helpers
// ---------------------------------------------------------------------------

export function seedStores(tenantId: string, count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    id: `store-${tenantId}-${i + 1}`,
    tenantId,
    name: `Store ${i + 1} (${tenantId})`,
    code: `STR-${String(i + 1).padStart(3, '0')}`,
    storeType: i === 0 ? 'ELECTRONICS' : 'RESTAURANT',
    address: '123 Test St',
    state: 'Tamil Nadu',
    pincode: '600001',
    phone: '9876543210',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    locations: [{ id: `loc-${i + 1}`, name: 'Main Location', type: 'SHOWROOM', isActive: true }],
    _count: { users: 1 },
  }))
}

export function seedProducts(tenantId: string, count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `product-${tenantId}-${i + 1}`,
    tenantId,
    name: `Product ${i + 1} (${tenantId})`,
    sku: `SKU-${tenantId}-${i + 1}`,
    barcode: `BC-${i + 1}`,
    mrp: 1000 + i * 100,
    costPrice: 600 + i * 50,
    sellingPrice: 800 + i * 75,
    gstRate: 18,
    reorderLevel: 10,
    productType: 'STANDARD',
    hasVariants: false,
    hasSerialNumber: false,
    hasBatchNumber: false,
    hasExpiry: false,
    isActive: true,
    categoryId: `cat-${i + 1}`,
    category: { id: `cat-${i + 1}`, name: `Category ${i + 1}` },
    variants: [],
    inventoryStocks: [{ quantity: 50 + i * 10, reservedQty: 0, storeId: `store-${tenantId}-1` }],
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}

export function seedInvoices(tenantId: string, count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    id: `invoice-${tenantId}-${i + 1}`,
    tenantId,
    storeId: `store-${tenantId}-1`,
    invoiceNumber: `INV-20260415-${String(i + 1).padStart(4, '0')}`,
    invoiceType: 'RETAIL_INVOICE',
    subtotal: 1000 + i * 500,
    totalDiscount: 0,
    totalGst: 180 + i * 90,
    totalAmount: 1180 + i * 590,
    amountPaid: 1180 + i * 590,
    amountDue: 0,
    paymentStatus: 'PAID',
    billingType: 'CASH',
    customerId: `customer-${tenantId}-1`,
    createdById: `user-${tenantId}-1`,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: `customer-${tenantId}-1`,
      firstName: 'Test',
      lastName: 'Customer',
      phone: '9876543210',
      gstin: null,
    },
    store: { id: `store-${tenantId}-1`, name: `Store 1 (${tenantId})` },
    createdBy: { id: `user-${tenantId}-1`, firstName: 'Test', lastName: 'User' },
    items: [],
    payments: [],
  }))
}

export function seedCustomers(tenantId: string, count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    id: `customer-${tenantId}-${i + 1}`,
    tenantId,
    firstName: `Customer${i + 1}`,
    lastName: `Tenant${tenantId}`,
    phone: `98765432${i}${tenantId.slice(-1)}`,
    email: `cust${i + 1}@${tenantId}.com`,
    customerType: i === 0 ? 'RETAIL' : 'WHOLESALE',
    gstin: null,
    creditBalance: 0,
    creditLimit: 10000,
    loyaltyPoints: i * 100,
    isActive: true,
    storeId: `store-${tenantId}-1`,
    store: { id: `store-${tenantId}-1`, name: `Store 1 (${tenantId})` },
    _count: { salesInvoices: i },
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}

// ---------------------------------------------------------------------------
// Request / response helpers
// ---------------------------------------------------------------------------

export function createApiRequest({
  url = 'http://localhost:3000/api/test',
  method = 'GET',
  body,
}: {
  url?: string
  method?: string
  body?: unknown
} = {}): NextRequest {
  const urlObj = new URL(url)
  if (body !== undefined) {
    return new NextRequest(urlObj, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  return new NextRequest(urlObj, {
    method,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function parseResponse(response: Response) {
  const status = response.status
  const body = await response.json()
  return { status, body }
}