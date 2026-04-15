import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mutable global state
// ---------------------------------------------------------------------------

const AUTH_KEY = '__OMNIBIZ_TEST_AUTH_USER__' as const
const PRISMA_DATA_KEY = '__OMNIBIZ_TEST_PRISMA_DATA__' as const

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
          const user = (globalThis as any)['__OMNIBIZ_TEST_AUTH_USER__'] ?? null
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
  const _getData = () => (globalThis as any)['__OMNIBIZ_TEST_PRISMA_DATA__'] ?? {}

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
    activityLog: { create: vi.fn() },
    $transaction: vi.fn(async (fn: any) => fn(prisma)),
  }

  return { prisma }
})

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import {
  makeDbUser,
  TENANT_A_DB,
  TENANT_A_EMPLOYEE_DB,
  TENANT_A_AUTH,
  TENANT_A_EMPLOYEE_AUTH,
  seedInvoices,
  seedStores,
  createApiRequest,
  parseResponse,
} from './helpers'

import { GET, POST } from '@/app/api/billing/route'

// ---------------------------------------------------------------------------
// GET /api/billing
// ---------------------------------------------------------------------------

describe('GET /api/billing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuthUser(TENANT_A_AUTH)
    setPrismaData({
      users: [TENANT_A_DB, TENANT_A_EMPLOYEE_DB],
      invoices: seedInvoices('tenant-a', 2),
    })
  })

  it('returns a paginated list of invoices', async () => {
    const req = createApiRequest({ url: 'http://localhost:3000/api/billing' })
    const res = await GET(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.pagination).toBeDefined()
    expect(body.pagination.total).toBeGreaterThanOrEqual(1)
  })

  it('returns only invoices for the authenticated tenant', async () => {
    setPrismaData({
      users: [TENANT_A_DB],
      invoices: [...seedInvoices('tenant-a', 2), ...seedInvoices('tenant-b', 3)],
    })
    const req = createApiRequest({ url: 'http://localhost:3000/api/billing' })
    const res = await GET(req)
    const { body } = await parseResponse(res)

    const tenantIds = body.data?.map((inv: any) => inv.tenantId) ?? []
    expect(tenantIds.every((id: string) => id === 'tenant-a')).toBe(true)
  })

  it('supports page and limit pagination params', async () => {
    const req = createApiRequest({ url: 'http://localhost:3000/api/billing?page=1&limit=1' })
    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.pagination.limit).toBe(1)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuthUser(null)
    const req = createApiRequest({ url: 'http://localhost:3000/api/billing' })
    const res = await GET(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })

  it('returns 403 when user lacks BILLING_VIEW permission', async () => {
    setAuthUser(TENANT_A_EMPLOYEE_AUTH)
    setPrismaData({
      users: [
        makeDbUser({
          id: 'user-a2', email: 'carol@tenant-a.com',
          firstName: 'Carol', lastName: 'Clark',
          tenantId: 'tenant-a', isOwner: false,
          userPersonas: [{ persona: { permissions: [] } }],
        }),
      ],
      invoices: seedInvoices('tenant-a', 2),
    })
    const req = createApiRequest({ url: 'http://localhost:3000/api/billing' })
    const res = await GET(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// POST /api/billing
// ---------------------------------------------------------------------------

describe('POST /api/billing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuthUser(TENANT_A_AUTH)
    setPrismaData({
      users: [TENANT_A_DB],
      invoices: [],
      stores: seedStores('tenant-a', 1),
    })
  })

  it('returns 400 when required fields are missing', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/billing',
      method: 'POST',
      body: { storeId: 'store-tenant-a-1' }, // missing items and totalAmount
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(400)
  })

  it('returns 400 when items array is empty', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/billing',
      method: 'POST',
      body: { storeId: 'store-tenant-a-1', items: [], totalAmount: 0 },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuthUser(null)
    const req = createApiRequest({
      url: 'http://localhost:3000/api/billing',
      method: 'POST',
      body: {
        storeId: 'store-tenant-a-1',
        items: [{ productId: 'p1', quantity: 1, unitPrice: 100, totalAmount: 118 }],
        totalAmount: 118,
      },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })

  it('returns 403 when user lacks BILLING_CREATE permission', async () => {
    setAuthUser(TENANT_A_EMPLOYEE_AUTH)
    setPrismaData({
      users: [
        makeDbUser({
          id: 'user-a2', email: 'carol@tenant-a.com',
          firstName: 'Carol', lastName: 'Clark',
          tenantId: 'tenant-a', isOwner: false,
          userPersonas: [{ persona: { permissions: [] } }],
        }),
      ],
      invoices: [],
      stores: seedStores('tenant-a', 1),
    })
    const req = createApiRequest({
      url: 'http://localhost:3000/api/billing',
      method: 'POST',
      body: {
        storeId: 'store-tenant-a-1',
        items: [{ productId: 'p1', quantity: 1, unitPrice: 100, totalAmount: 118 }],
        totalAmount: 118,
      },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(403)
  })
})