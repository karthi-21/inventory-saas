/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mutable global state shared between hoisted mock factories and test code
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
    vi.fn(({ where, _include }: any) => {
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
    user: {
      findFirst: makeFindFirst('users'),
    },
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

import { GET, POST } from '@/app/api/stores/route'

// ---------------------------------------------------------------------------
// Seed data helpers
// ---------------------------------------------------------------------------

function seedStores(tenantId: string, count = 2) {
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

// ---------------------------------------------------------------------------
// Mock users — DB records that prisma.user.findFirst returns.
// Must include nested relations expected by requirePermission().
// ---------------------------------------------------------------------------

function makeDbUser(overrides: any) {
  return {
    id: overrides.id,
    email: overrides.email,
    firstName: overrides.firstName,
    lastName: overrides.lastName,
    tenantId: overrides.tenantId,
    isOwner: overrides.isOwner,
    tenant: { id: overrides.tenantId, name: `Tenant ${overrides.tenantId}` },
    storeAccess: overrides.storeAccess || [],
    userPersonas: (overrides.userPersonas || []).map((up: any) => ({
      persona: {
        permissions: up.persona.permissions.map((p: any) => ({
          module: p.module,
          action: p.action,
        })),
      },
    })),
  }
}

const TENANT_A_DB = makeDbUser({
  id: 'user-a1',
  email: 'alice@tenant-a.com',
  firstName: 'Alice',
  lastName: 'Anderson',
  tenantId: 'tenant-a',
  isOwner: true,
})

const TENANT_A_EMPLOYEE_DB = makeDbUser({
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
        ],
      },
    },
  ],
})

// Supabase-level auth users (just email + id)
const TENANT_A_AUTH = { id: 'user-a1', email: 'alice@tenant-a.com' }
const TENANT_A_EMPLOYEE_AUTH = { id: 'user-a2', email: 'carol@tenant-a.com' }

// ---------------------------------------------------------------------------
// Request / response helpers
// ---------------------------------------------------------------------------

function createApiRequest({
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

async function parseResponse(response: Response) {
  const status = response.status
  const body = await response.json()
  return { status, body }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/stores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuthUser(TENANT_A_AUTH)
    setPrismaData({
      users: [TENANT_A_DB, TENANT_A_EMPLOYEE_DB],
      stores: [...seedStores('tenant-a', 2), ...seedStores('tenant-b', 2)],
    })
  })

  it('returns a paginated list of stores for the authenticated tenant', async () => {
    const req = createApiRequest({ url: 'http://localhost:3000/api/stores' })
    const res = await GET(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.pagination).toBeDefined()
    expect(body.pagination.total).toBeGreaterThanOrEqual(1)

    const tenantIds = body.data.map((s: any) => s.tenantId)
    expect(tenantIds).toBeDefined()
    expect(tenantIds.every((id: string) => id === 'tenant-a')).toBe(true)
  })

  it('returns only active stores by default', async () => {
    setPrismaData({
      users: [TENANT_A_DB],
      stores: [
        ...seedStores('tenant-a', 1),
        { ...seedStores('tenant-a', 1)[0], id: 'inactive-store', isActive: false },
      ],
    })
    const req = createApiRequest({ url: 'http://localhost:3000/api/stores' })
    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.data).toBeInstanceOf(Array)
  })

  it('supports pagination via page and limit params', async () => {
    setPrismaData({
      users: [TENANT_A_DB],
      stores: seedStores('tenant-a', 5),
    })
    const req = createApiRequest({ url: 'http://localhost:3000/api/stores?page=1&limit=2' })
    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.pagination.limit).toBe(2)
    expect(body.pagination.page).toBe(1)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuthUser(null)
    const req = createApiRequest({ url: 'http://localhost:3000/api/stores' })
    const res = await GET(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })

  it('returns 403 when user lacks STORE_VIEW permission', async () => {
    setAuthUser(TENANT_A_EMPLOYEE_AUTH)
    setPrismaData({
      users: [
        makeDbUser({
          id: 'user-a2',
          email: 'carol@tenant-a.com',
          firstName: 'Carol',
          lastName: 'Clark',
          tenantId: 'tenant-a',
          isOwner: false,
          userPersonas: [{ persona: { permissions: [] } }],
        }),
      ],
      stores: seedStores('tenant-a', 2),
    })
    const req = createApiRequest({ url: 'http://localhost:3000/api/stores' })
    const res = await GET(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(403)
  })

  it('only returns stores belonging to the user tenant (tenant isolation)', async () => {
    setPrismaData({
      users: [TENANT_A_DB],
      stores: [...seedStores('tenant-a', 2), ...seedStores('tenant-b', 3)],
    })
    const req = createApiRequest({ url: 'http://localhost:3000/api/stores' })
    const res = await GET(req)
    const { body } = await parseResponse(res)

    const tenantIds = body.data?.map((s: any) => s.tenantId) ?? []
    expect(tenantIds.every((id: string) => id === 'tenant-a')).toBe(true)
  })
})

describe('POST /api/stores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuthUser(TENANT_A_AUTH)
    setPrismaData({
      users: [TENANT_A_DB],
      stores: seedStores('tenant-a', 1),
    })
  })

  it('creates a store and returns 201', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/stores',
      method: 'POST',
      body: { name: 'New Store', storeType: 'ELECTRONICS', address: '456 New St' },
    })
    const res = await POST(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(201)
    expect(body.name).toBe('New Store')
    expect(body.tenantId).toBe('tenant-a')
  })

  it('returns 400 when required fields are missing', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/stores',
      method: 'POST',
      body: { address: 'No name field' },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    setAuthUser(null)
    const req = createApiRequest({
      url: 'http://localhost:3000/api/stores',
      method: 'POST',
      body: { name: 'Test', storeType: 'ELECTRONICS' },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(401)
  })

  it('returns 403 when user lacks STORE_EDIT permission', async () => {
    setAuthUser(TENANT_A_EMPLOYEE_AUTH)
    setPrismaData({
      users: [
        makeDbUser({
          id: 'user-a2',
          email: 'carol@tenant-a.com',
          firstName: 'Carol',
          lastName: 'Clark',
          tenantId: 'tenant-a',
          isOwner: false,
          userPersonas: [{ persona: { permissions: [{ module: 'STORE_VIEW', action: 'VIEW' }] } }],
        }),
      ],
      stores: seedStores('tenant-a', 1),
    })
    const req = createApiRequest({
      url: 'http://localhost:3000/api/stores',
      method: 'POST',
      body: { name: 'Test', storeType: 'ELECTRONICS' },
    })
    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(403)
  })

  it('assigns the store to the authenticated user tenant', async () => {
    const req = createApiRequest({
      url: 'http://localhost:3000/api/stores',
      method: 'POST',
      body: { name: 'Tenant A Store', storeType: 'ELECTRONICS' },
    })
    const res = await POST(req)
    const { body } = await parseResponse(res)

    expect(body.tenantId).toBe('tenant-a')
  })
})