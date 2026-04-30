/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mutable global state
// ---------------------------------------------------------------------------

const AUTH_KEY = '__EZVENTO_TEST_AUTH_USER__' as const
const PRISMA_DATA_KEY = '__EZVENTO_TEST_PRISMA_DATA__' as const

function setAuthUser(user: any) { (globalThis as any)[AUTH_KEY] = user }
function setPrismaData(data: any) { (globalThis as any)[PRISMA_DATA_KEY] = data }

// ---------------------------------------------------------------------------
// Hoisted vi.mock calls
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() => {
          const user = (globalThis as any)['__EZVENTO_TEST_AUTH_USER__'] ?? null
          if (user) {
            return Promise.resolve({
              data: { user: { email: user.email, id: user.id } },
              error: null,
            })
          }
          return Promise.resolve({ data: { user: null }, error: null })
        }),
      },
    }),
  ),
}))

vi.mock('@/lib/db', () => {
  const _getData = () => (globalThis as any)['__EZVENTO_TEST_PRISMA_DATA__'] ?? {}

  const makeFindMany = (model: string) =>
    vi.fn(({ where, skip, take }: any) => {
      let items = ((_getData()[model] || []) as any[]).slice()
      if (where) {
        items = items.filter((item: any) => {
          for (const [key, val] of Object.entries(where)) {
            if (key === 'OR') {
              const orMatch = (val as any[]).some((cond: any) =>
                Object.entries(cond).every(([k, v]: any) => {
                  if (v && typeof v === 'object' && v.contains) {
                    const field = item[k]
                    return typeof field === 'string'
                      ? field.toLowerCase().includes(v.contains.toLowerCase())
                      : false
                  }
                  return item[k] === v
                }),
              )
              if (!orMatch) return false
            } else if (typeof val === 'object' && val !== null) {
              // skip complex matchers
            } else {
              if (item[key] !== val) return false
            }
          }
          return true
        })
      }
      if (skip !== undefined && take !== undefined) {
        items = items.slice(skip, skip + take)
      }
      return items
    })

  const makeCount = (model: string) =>
    vi.fn(({ where }: any) => {
      let items = ((_getData()[model] || []) as any[]).slice()
      if (where) {
        items = items.filter((item: any) => {
          for (const [key, val] of Object.entries(where)) {
            if (key === 'OR') continue
            if (typeof val === 'object' && val !== null) continue
            if (item[key] !== val) return false
          }
          return true
        })
      }
      return items.length
    })

  const makeFindFirst = (model: string) =>
    vi.fn(({ where }: any) => {
      const items = (_getData()[model] || []) as any[]
      return (
        items.find((item: any) => {
          for (const [key, val] of Object.entries(where)) {
            if (typeof val === 'object' && val !== null) continue
            if (item[key] !== val) return false
          }
          return true
        }) ?? null
      )
    })

  const makeCreate = (model: string) =>
    vi.fn(({ data }: any) => {
      const id = `mock-${model}-${Date.now()}`
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() }
      const d = _getData()
      if (!d[model]) d[model] = []
      d[model].push(record)
      return record
    })

  const makeUpdate = (model: string) =>
    vi.fn(({ where, data }: any) => {
      const items = (_getData()[model] || []) as any[]
      const idx = items.findIndex((item: any) => item.id === where.id)
      if (idx === -1) return null
      items[idx] = { ...items[idx], ...data }
      return items[idx]
    })

  const prisma: Record<string, any> = {
    user: { findFirst: makeFindFirst('users') },
    store: {
      findMany: makeFindMany('stores'),
      count: makeCount('stores'),
      findFirst: makeFindFirst('stores'),
      create: makeCreate('stores'),
      update: makeUpdate('stores'),
    },
    product: {
      findMany: makeFindMany('products'),
      count: makeCount('products'),
      findFirst: makeFindFirst('products'),
      create: makeCreate('products'),
      update: makeUpdate('products'),
    },
    customer: {
      findMany: makeFindMany('customers'),
      count: makeCount('customers'),
      findFirst: makeFindFirst('customers'),
      create: makeCreate('customers'),
      update: makeUpdate('customers'),
      findUnique: makeFindFirst('customers'),
    },
    salesInvoice: {
      findMany: makeFindMany('invoices'),
      count: makeCount('invoices'),
      findFirst: makeFindFirst('invoices'),
      findUnique: makeFindFirst('invoices'),
      create: makeCreate('invoices'),
      groupBy: vi.fn(() => []),
    },
    inventoryStock: {
      findFirst: makeFindFirst('inventoryStocks'),
      create: makeCreate('inventoryStocks'),
      update: makeUpdate('inventoryStocks'),
    },
    stockMovement: { create: makeCreate('stockMovements') },
    payment: { createMany: vi.fn(), create: vi.fn() },
    loyaltyPointsLog: { create: vi.fn() },
    subscription: { findFirst: vi.fn(() => ({ id: 'sub-test', status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) })) },
    activityLog: { create: vi.fn() },
    $transaction: vi.fn(async (fn: any) => fn(prisma)),
  }

  return { prisma }
})

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import {
  TENANT_A_DB,
  TENANT_B_DB,
  TENANT_A_AUTH,
  TENANT_B_AUTH,
  seedStores,
  seedProducts,
  seedCustomers,
  seedInvoices,
  createApiRequest,
  parseResponse,
} from './helpers'

import { GET as getStores } from '@/app/api/stores/route'
import { GET as getProducts } from '@/app/api/products/route'
import { GET as getCustomers } from '@/app/api/customers/route'
import { GET as getBilling } from '@/app/api/billing/route'
import { GET as getProduct, PUT as putProduct, DELETE as deleteProduct } from '@/app/api/products/[id]/route'

// ---------------------------------------------------------------------------
// Tenant isolation integration tests
// ---------------------------------------------------------------------------

describe('Tenant Isolation', () => {
  const sharedData = {
    users: [TENANT_A_DB, TENANT_B_DB],
    stores: [...seedStores('tenant-a', 2), ...seedStores('tenant-b', 3)],
    products: [...seedProducts('tenant-a', 3), ...seedProducts('tenant-b', 4)],
    customers: [...seedCustomers('tenant-a', 2), ...seedCustomers('tenant-b', 2)],
    invoices: [...seedInvoices('tenant-a', 2), ...seedInvoices('tenant-b', 3)],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setPrismaData({
      users: [...sharedData.users],
      stores: [...sharedData.stores],
      products: [...sharedData.products],
      customers: [...sharedData.customers],
      invoices: [...sharedData.invoices],
    })
  })

  // -----------------------------------------------------------------------
  // Stores
  // -----------------------------------------------------------------------
  describe('Stores API', () => {
    it('tenant A user only sees tenant A stores', async () => {
      setAuthUser(TENANT_A_AUTH)
      const req = createApiRequest({ url: 'http://localhost:3000/api/stores' })
      const res = await getStores(req)
      const { status, body } = await parseResponse(res)

      expect(status).toBe(200)
      const tenantIds = body.data?.map((s: any) => s.tenantId) ?? []
      expect(tenantIds.length).toBeGreaterThan(0)
      expect(tenantIds.every((id: string) => id === 'tenant-a')).toBe(true)
    })

    it('tenant B user only sees tenant B stores', async () => {
      setAuthUser(TENANT_B_AUTH)
      const req = createApiRequest({ url: 'http://localhost:3000/api/stores' })
      const res = await getStores(req)
      const { body } = await parseResponse(res)

      const tenantIds = body.data?.map((s: any) => s.tenantId) ?? []
      expect(tenantIds.length).toBeGreaterThan(0)
      expect(tenantIds.every((id: string) => id === 'tenant-b')).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Products
  // -----------------------------------------------------------------------
  describe('Products API', () => {
    it('tenant A user only sees tenant A products', async () => {
      setAuthUser(TENANT_A_AUTH)
      const req = createApiRequest({ url: 'http://localhost:3000/api/products' })
      const res = await getProducts(req)
      const { body } = await parseResponse(res)

      const tenantIds = body.data?.map((p: any) => p.tenantId) ?? []
      expect(tenantIds.length).toBeGreaterThan(0)
      expect(tenantIds.every((id: string) => id === 'tenant-a')).toBe(true)
    })

    it('tenant B user only sees tenant B products', async () => {
      setAuthUser(TENANT_B_AUTH)
      const req = createApiRequest({ url: 'http://localhost:3000/api/products' })
      const res = await getProducts(req)
      const { body } = await parseResponse(res)

      const tenantIds = body.data?.map((p: any) => p.tenantId) ?? []
      expect(tenantIds.length).toBeGreaterThan(0)
      expect(tenantIds.every((id: string) => id === 'tenant-b')).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Customers
  // -----------------------------------------------------------------------
  describe('Customers API', () => {
    it('tenant A user only sees tenant A customers', async () => {
      setAuthUser(TENANT_A_AUTH)
      const req = createApiRequest({ url: 'http://localhost:3000/api/customers' })
      const res = await getCustomers(req)
      const { body } = await parseResponse(res)

      const tenantIds = body.data?.map((c: any) => c.tenantId) ?? []
      expect(tenantIds.length).toBeGreaterThan(0)
      expect(tenantIds.every((id: string) => id === 'tenant-a')).toBe(true)
    })

    it('tenant B user only sees tenant B customers', async () => {
      setAuthUser(TENANT_B_AUTH)
      const req = createApiRequest({ url: 'http://localhost:3000/api/customers' })
      const res = await getCustomers(req)
      const { body } = await parseResponse(res)

      const tenantIds = body.data?.map((c: any) => c.tenantId) ?? []
      expect(tenantIds.length).toBeGreaterThan(0)
      expect(tenantIds.every((id: string) => id === 'tenant-b')).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Billing
  // -----------------------------------------------------------------------
  describe('Billing API', () => {
    it('tenant A user only sees tenant A invoices', async () => {
      setAuthUser(TENANT_A_AUTH)
      const req = createApiRequest({ url: 'http://localhost:3000/api/billing' })
      const res = await getBilling(req)
      const { body } = await parseResponse(res)

      const tenantIds = body.data?.map((inv: any) => inv.tenantId) ?? []
      expect(tenantIds.length).toBeGreaterThan(0)
      expect(tenantIds.every((id: string) => id === 'tenant-a')).toBe(true)
    })

    it('tenant B user only sees tenant B invoices', async () => {
      setAuthUser(TENANT_B_AUTH)
      const req = createApiRequest({ url: 'http://localhost:3000/api/billing' })
      const res = await getBilling(req)
      const { body } = await parseResponse(res)

      const tenantIds = body.data?.map((inv: any) => inv.tenantId) ?? []
      expect(tenantIds.length).toBeGreaterThan(0)
      expect(tenantIds.every((id: string) => id === 'tenant-b')).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Cross-tenant direct resource access
  // -----------------------------------------------------------------------
  describe('Cross-tenant direct resource access', () => {
    it('tenant A user cannot retrieve tenant B product by ID', async () => {
      setAuthUser(TENANT_A_AUTH)
      const tenantBProductId = 'product-tenant-b-1'
      const req = createApiRequest({ url: `http://localhost:3000/api/products/${tenantBProductId}` })
      const res = await getProduct(req, { params: Promise.resolve({ id: tenantBProductId }) })
      const { status } = await parseResponse(res)

      // findFirst with tenantId filter won't match => 404
      expect(status).toBe(404)
    })

    it('tenant A user cannot update tenant B product', async () => {
      setAuthUser(TENANT_A_AUTH)
      const tenantBProductId = 'product-tenant-b-1'
      const req = createApiRequest({
        url: `http://localhost:3000/api/products/${tenantBProductId}`,
        method: 'PUT',
        body: { name: 'Hacked!' },
      })
      const res = await putProduct(req, { params: Promise.resolve({ id: tenantBProductId }) })
      const { status } = await parseResponse(res)

      expect(status).toBe(404)
    })

    it('tenant A user cannot delete tenant B product', async () => {
      setAuthUser(TENANT_A_AUTH)
      const tenantBProductId = 'product-tenant-b-1'
      const req = createApiRequest({
        url: `http://localhost:3000/api/products/${tenantBProductId}`,
        method: 'DELETE',
      })
      const res = await deleteProduct(req, { params: Promise.resolve({ id: tenantBProductId }) })
      const { status } = await parseResponse(res)

      expect(status).toBe(404)
    })
  })
})