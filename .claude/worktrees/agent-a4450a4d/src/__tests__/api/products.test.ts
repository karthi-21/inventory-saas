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
  setAuthUser as _setAuthUser,
  setPrismaData as _setPrismaData,
  makeDbUser,
  TENANT_A_DB,
  TENANT_A_EMPLOYEE_DB,
  TENANT_A_AUTH,
  TENANT_A_EMPLOYEE_AUTH,
  seedProducts,
  createApiRequest,
  parseResponse,
} from './helpers'

// Re-export with local names for clarity
const setAuth = _setAuthUser
const setData = _setPrismaData

import { GET, POST } from '@/app/api/products/route'
import { GET as GetProduct, PUT, DELETE } from '@/app/api/products/[id]/route'

function makeParams(id: string) {
  return Promise.resolve({ id })
}

// ---------------------------------------------------------------------------
// GET /api/products
// ---------------------------------------------------------------------------

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth(TENANT_A_AUTH)
    setData({
      users: [TENANT_A_DB, TENANT_A_EMPLOYEE_DB],
      products: seedProducts('tenant-a', 3),
    })
  })

  it('returns paginated products for the authenticated tenant', async () => {
    const req = createApiRequest({ url: 'http://localhost:3000/api/products' })
    const res = await GET(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.pagination).toBeDefined()
    expect(body.pagination.total).toBeGreaterThanOrEqual(1)
  })

  it('supports page and limit params', async () => {
    const req = createApiRequest({ url: 'http://localhost:3000/api/products?page=1&limit=2' })
    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.pagination.limit).toBe(2)
    expect(body.pagination.page).toBe(1)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuth(null)
    const req = createApiRequest({ url: 'http://localhost:3000/api/products' })
    const res = await GET(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })

  it('returns 403 when user lacks PRODUCT_VIEW permission', async () => {
    setAuth(TENANT_A_EMPLOYEE_AUTH)
    setData({
      users: [
        makeDbUser({
          id: 'user-a2', email: 'carol@tenant-a.com',
          firstName: 'Carol', lastName: 'Clark',
          tenantId: 'tenant-a', isOwner: false,
          userPersonas: [{ persona: { permissions: [] } }],
        }),
      ],
      products: seedProducts('tenant-a', 2),
    })
    const req = createApiRequest({ url: 'http://localhost:3000/api/products' })
    const res = await GET(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(403)
  })

  it('only returns products belonging to the user tenant', async () => {
    setData({
      users: [TENANT_A_DB],
      products: [...seedProducts('tenant-a', 2), ...seedProducts('tenant-b', 3)],
    })
    const req = createApiRequest({ url: 'http://localhost:3000/api/products' })
    const res = await GET(req)
    const { body } = await parseResponse(res)

    const tenantIds = body.data?.map((p: any) => p.tenantId) ?? []
    expect(tenantIds.every((id: string) => id === 'tenant-a')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// POST /api/products
// ---------------------------------------------------------------------------

describe('POST /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth(TENANT_A_AUTH)
    setData({ users: [TENANT_A_DB], products: [] })
  })

  it('creates a product and returns 201', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products',
      method: 'POST',
      body: { name: 'Widget Pro', mrp: 1000, costPrice: 600, sellingPrice: 800, gstRate: 18 },
    })
    const res = await POST(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(201)
    expect(body.name).toBe('Widget Pro')
    expect(body.tenantId).toBe('tenant-a')
  })

  it('returns 400 when required fields are missing', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products',
      method: 'POST',
      body: { name: 'Missing prices' },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuth(null)
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products',
      method: 'POST',
      body: { name: 'X', mrp: 100, costPrice: 50, sellingPrice: 80 },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })

  it('returns 403 when user lacks PRODUCT_CREATE permission', async () => {
    setAuth(TENANT_A_EMPLOYEE_AUTH)
    setData({
      users: [
        makeDbUser({
          id: 'user-a2', email: 'carol@tenant-a.com',
          firstName: 'Carol', lastName: 'Clark',
          tenantId: 'tenant-a', isOwner: false,
          userPersonas: [{ persona: { permissions: [{ module: 'PRODUCT_VIEW', action: 'VIEW' }] } }],
        }),
      ],
      products: [],
    })
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products',
      method: 'POST',
      body: { name: 'X', mrp: 100, costPrice: 50, sellingPrice: 80 },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// GET /api/products/[id]
// ---------------------------------------------------------------------------

describe('GET /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth(TENANT_A_AUTH)
    setData({ users: [TENANT_A_DB], products: seedProducts('tenant-a', 2) })
  })

  it('returns a single product', async () => {
    const req = createApiRequest({ url: 'http://localhost:3000/api/products/product-tenant-a-1' })
    const res = await GetProduct(req, { params: makeParams('product-tenant-a-1') })
    const { status, body } = await parseResponse(res)

    expect(status).toBe(200)
    expect(body.id).toBe('product-tenant-a-1')
  })

  it('returns 404 for a non-existent product', async () => {
    const req = createApiRequest({ url: 'http://localhost:3000/api/products/non-existent-id' })
    const res = await GetProduct(req, { params: makeParams('non-existent-id') })
    const { status } = await parseResponse(res)

    expect(status).toBe(404)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuth(null)
    const req = createApiRequest({ url: 'http://localhost:3000/api/products/product-tenant-a-1' })
    const res = await GetProduct(req, { params: makeParams('product-tenant-a-1') })
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// PUT /api/products/[id]
// ---------------------------------------------------------------------------

describe('PUT /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth(TENANT_A_AUTH)
    setData({ users: [TENANT_A_DB], products: seedProducts('tenant-a', 2) })
  })

  it('updates a product and returns 200', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products/product-tenant-a-1',
      method: 'PUT',
      body: { name: 'Updated Product' },
    })
    const res = await PUT(req, { params: makeParams('product-tenant-a-1') })
    const { status, body } = await parseResponse(res)

    expect(status).toBe(200)
    expect(body.name).toBe('Updated Product')
  })

  it('returns 404 when updating a non-existent product', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products/non-existent',
      method: 'PUT',
      body: { name: 'Ghost' },
    })
    const res = await PUT(req, { params: makeParams('non-existent') })
    const { status } = await parseResponse(res)

    expect(status).toBe(404)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuth(null)
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products/product-tenant-a-1',
      method: 'PUT',
      body: { name: 'Hacked' },
    })
    const res = await PUT(req, { params: makeParams('product-tenant-a-1') })
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })

  it('returns 403 when user lacks PRODUCT_EDIT permission', async () => {
    setAuth(TENANT_A_EMPLOYEE_AUTH)
    setData({
      users: [
        makeDbUser({
          id: 'user-a2', email: 'carol@tenant-a.com',
          firstName: 'Carol', lastName: 'Clark',
          tenantId: 'tenant-a', isOwner: false,
          userPersonas: [{ persona: { permissions: [{ module: 'PRODUCT_VIEW', action: 'VIEW' }] } }],
        }),
      ],
      products: seedProducts('tenant-a', 2),
    })
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products/product-tenant-a-1',
      method: 'PUT',
      body: { name: 'Nope' },
    })
    const res = await PUT(req, { params: makeParams('product-tenant-a-1') })
    const { status } = await parseResponse(res)

    expect(status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/products/[id]
// ---------------------------------------------------------------------------

describe('DELETE /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth(TENANT_A_AUTH)
    setData({ users: [TENANT_A_DB], products: seedProducts('tenant-a', 2) })
  })

  it('soft-deletes a product (sets isActive=false) and returns 200', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products/product-tenant-a-1',
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: makeParams('product-tenant-a-1') })
    const { status, body } = await parseResponse(res)

    expect(status).toBe(200)
    expect(body.deleted).toBe(true)
  })

  it('returns 404 when deleting a non-existent product', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products/non-existent',
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: makeParams('non-existent') })
    const { status } = await parseResponse(res)

    expect(status).toBe(404)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuth(null)
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products/product-tenant-a-1',
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: makeParams('product-tenant-a-1') })
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })

  it('returns 403 when user lacks PRODUCT_DELETE permission', async () => {
    setAuth(TENANT_A_EMPLOYEE_AUTH)
    setData({
      users: [
        makeDbUser({
          id: 'user-a2', email: 'carol@tenant-a.com',
          firstName: 'Carol', lastName: 'Clark',
          tenantId: 'tenant-a', isOwner: false,
          userPersonas: [{ persona: { permissions: [{ module: 'PRODUCT_VIEW', action: 'VIEW' }] } }],
        }),
      ],
      products: seedProducts('tenant-a', 2),
    })
    const req = createApiRequest({
      url: 'http://localhost:3000/api/products/product-tenant-a-1',
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: makeParams('product-tenant-a-1') })
    const { status } = await parseResponse(res)

    expect(status).toBe(403)
  })
})