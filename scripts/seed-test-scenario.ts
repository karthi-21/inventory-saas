/**
 * OmniBIZ Test Scenario Seeder
 *
 * Creates a complete test user with Supabase Auth + Prisma data for E2E testing.
 * Bypasses signup flow entirely — creates auth user via Admin API + database records via Prisma.
 *
 * Usage:
 *   SCENARIO=electronics npx tsx scripts/seed-test-scenario.ts
 *   SCENARIO=wholesale npx tsx scripts/seed-test-scenario.ts
 *   SCENARIO=fashion npx tsx scripts/seed-test-scenario.ts
 *   SCENARIO=grocery npx tsx scripts/seed-test-scenario.ts
 *   SCENARIO=restaurant npx tsx scripts/seed-test-scenario.ts
 *
 * Outputs: { email, password, tenantId, storeIds, locationIds }
 */

import { PrismaClient, StoreType, LocationType, TenantPlan, PermissionModule, PermissionAction } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

// Load env vars from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

const SCENARIO = process.env.SCENARIO || 'electronics'
const TEST_PASSWORD = 'Test@123456'

// Supabase admin client for creating auth users
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

interface ScenarioConfig {
  tenantName: string
  subdomain: string
  storeType: StoreType
  storeConfigs: { name: string; code: string; locationConfigs: { name: string; type: LocationType }[] }[]
  categories: string[]
  productConfigs: { name: string; sku: string; mrp: number; costPrice: number; sellingPrice: number; gstRate: number; category: string; inventoryQty: number }[]
  email: string
}

const SCENARIOS: Record<string, ScenarioConfig> = {
  electronics: {
    tenantName: 'Kumar Electronics',
    subdomain: 'kumar-electronics',
    storeType: StoreType.ELECTRONICS,
    email: 'rajesh@kumar-electronics.in',
    storeConfigs: [
      {
        name: 'Chennai Main',
        code: 'CHN-001',
        locationConfigs: [
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
          { name: 'Counter 3', type: LocationType.COUNTER },
          { name: 'Warehouse', type: LocationType.WAREHOUSE },
          { name: 'Showroom Floor', type: LocationType.SHOWROOM },
        ],
      },
      {
        name: 'Anna Nagar Showroom',
        code: 'ANN-001',
        locationConfigs: [
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
          { name: 'Counter 3', type: LocationType.COUNTER },
          { name: 'Warehouse', type: LocationType.WAREHOUSE },
          { name: 'Showroom Floor', type: LocationType.SHOWROOM },
        ],
      },
      {
        name: 'Velachery Outlet',
        code: 'VEL-001',
        locationConfigs: [
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
          { name: 'Counter 3', type: LocationType.COUNTER },
          { name: 'Warehouse', type: LocationType.WAREHOUSE },
          { name: 'Showroom Floor', type: LocationType.SHOWROOM },
        ],
      },
    ],
    categories: ['Mobiles', 'Televisions', 'Audio', 'Accessories'],
    productConfigs: [
      { name: 'Samsung Galaxy S24 Ultra', sku: 'SAM-S24U', mrp: 134999, costPrice: 105000, sellingPrice: 129999, gstRate: 18, category: 'Mobiles', inventoryQty: 25 },
      { name: 'iPhone 15 Pro 128GB', sku: 'APL-15P', mrp: 134900, costPrice: 110000, sellingPrice: 129900, gstRate: 18, category: 'Mobiles', inventoryQty: 15 },
      { name: 'LG 55" OLED C3', sku: 'LG-OLED55', mrp: 149990, costPrice: 110000, sellingPrice: 139990, gstRate: 18, category: 'Televisions', inventoryQty: 8 },
      { name: 'Sony WH-1000XM5', sku: 'SNY-XM5', mrp: 34990, costPrice: 24000, sellingPrice: 29990, gstRate: 18, category: 'Audio', inventoryQty: 30 },
      { name: 'Belkin USB-C Charger 65W', sku: 'BLK-C65W', mrp: 4999, costPrice: 2800, sellingPrice: 3999, gstRate: 18, category: 'Accessories', inventoryQty: 50 },
    ],
  },

  wholesale: {
    tenantName: 'Patel Distributors',
    subdomain: 'patel-distributors',
    storeType: StoreType.WHOLESALE,
    email: 'amit@patel-distributors.in',
    storeConfigs: [
      {
        name: 'Mumbai Showroom',
        code: 'MBI-SHO',
        locationConfigs: [
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
          { name: 'Showroom Floor', type: LocationType.SHOWROOM },
        ],
      },
      {
        name: 'Mumbai Warehouse',
        code: 'MBI-WH',
        locationConfigs: [
          { name: 'Warehouse', type: LocationType.WAREHOUSE },
          { name: 'Loading Dock', type: LocationType.RACK },
        ],
      },
    ],
    categories: ['Mobiles', 'Televisions', 'Audio', 'Accessories'],
    productConfigs: [
      { name: 'Samsung Galaxy S24 Ultra', sku: 'SAM-S24U', mrp: 134999, costPrice: 105000, sellingPrice: 129999, gstRate: 18, category: 'Mobiles', inventoryQty: 100 },
      { name: 'LG 55" OLED C3', sku: 'LG-OLED55', mrp: 149990, costPrice: 110000, sellingPrice: 139990, gstRate: 18, category: 'Televisions', inventoryQty: 50 },
    ],
  },

  fashion: {
    tenantName: "Meera's Couture",
    subdomain: 'meeras-couture',
    storeType: StoreType.CLOTHING,
    email: 'meera@meeras-couture.in',
    storeConfigs: [
      {
        name: 'MG Road Store',
        code: 'MGR-001',
        locationConfigs: [
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
          { name: 'Stock Room', type: LocationType.WAREHOUSE },
          { name: 'Showroom Floor', type: LocationType.SHOWROOM },
        ],
      },
      {
        name: 'Whitefield Store',
        code: 'WHT-001',
        locationConfigs: [
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
          { name: 'Stock Room', type: LocationType.WAREHOUSE },
          { name: 'Showroom Floor', type: LocationType.SHOWROOM },
        ],
      },
    ],
    categories: ['Shirts', 'Dresses', 'Ethnic Wear', 'Accessories'],
    productConfigs: [
      { name: 'Cotton Shirt', sku: 'CTR-SHIRT', mrp: 2499, costPrice: 800, sellingPrice: 1999, gstRate: 5, category: 'Shirts', inventoryQty: 40 },
      { name: 'Silk Kurta', sku: 'SLK-KURTA', mrp: 5999, costPrice: 2200, sellingPrice: 4999, gstRate: 5, category: 'Ethnic Wear', inventoryQty: 25 },
    ],
  },

  grocery: {
    tenantName: "Suresh's SuperMart",
    subdomain: 'suresh-supermart',
    storeType: StoreType.SUPERMARKET,
    email: 'suresh@supermart.in',
    storeConfigs: [
      {
        name: 'Hyderabad Main',
        code: 'HYD-001',
        locationConfigs: [
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
          { name: 'Counter 3', type: LocationType.COUNTER },
          { name: 'Counter 4', type: LocationType.COUNTER },
          { name: 'Cold Storage', type: LocationType.COLD_STORAGE },
          { name: 'Warehouse', type: LocationType.WAREHOUSE },
        ],
      },
    ],
    categories: ['Dairy', 'Snacks', ' Staples', 'Beverages', 'Personal Care'],
    productConfigs: [
      { name: 'Amul Butter 500g', sku: 'AMU-BTR', mrp: 570, costPrice: 490, sellingPrice: 570, gstRate: 5, category: 'Dairy', inventoryQty: 150 },
      { name: 'Tata Salt 1kg', sku: 'TAT-SLT', mrp: 28, costPrice: 20, sellingPrice: 28, gstRate: 0, category: 'Staples', inventoryQty: 200 },
    ],
  },

  restaurant: {
    tenantName: "Priya's Fine Dine",
    subdomain: 'priyas-finedine',
    storeType: StoreType.RESTAURANT,
    email: 'priya@priyas-finedine.in',
    storeConfigs: [
      {
        name: 'Indiranagar',
        code: 'IND-001',
        locationConfigs: [
          { name: 'Kitchen', type: LocationType.KITCHEN },
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
        ],
      },
      {
        name: 'Koramangala',
        code: 'KOR-001',
        locationConfigs: [
          { name: 'Kitchen', type: LocationType.KITCHEN },
          { name: 'Counter 1', type: LocationType.COUNTER },
          { name: 'Counter 2', type: LocationType.COUNTER },
        ],
      },
    ],
    categories: ['Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts'],
    productConfigs: [
      { name: 'Paneer Butter Masala', sku: 'PBM-001', mrp: 350, costPrice: 120, sellingPrice: 350, gstRate: 5, category: 'Main Course', inventoryQty: 100 },
      { name: 'Butter Naan', sku: 'BTN-001', mrp: 80, costPrice: 20, sellingPrice: 80, gstRate: 5, category: 'Breads', inventoryQty: 200 },
    ],
  },
}

// ---------------------------------------------------------------------------
// Main seeder
// ---------------------------------------------------------------------------

async function main() {
  const scenario = SCENARIOS[SCENARIO]
  if (!scenario) {
    console.error(`Unknown scenario: ${SCENARIO}. Available: ${Object.keys(SCENARIOS).join(', ')}`)
    process.exit(1)
  }

  console.log(`\n=== Seeding scenario: ${SCENARIO} ===\n`)

  // 1. Create Supabase Auth user via Admin API
  const supabase = getSupabaseAdmin()
  const email = scenario.email

  // Try to create auth user, ignore if exists
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { store_name: scenario.tenantName },
  })

  if (authError && !authError.message.includes('already registered')) {
    console.error('Failed to create auth user:', authError.message)
    // Continue — user might already exist from a previous run
  }

  // Get the auth user ID
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find((u: { email?: string }) => u.email === email)
  const authUserId = authUser?.id || authData?.user?.id

  if (!authUserId) {
    console.error('Could not find or create auth user')
    process.exit(1)
  }

  console.log(`Auth user: ${email} (${authUserId})`)

  // 2. Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: scenario.subdomain },
    update: {},
    create: {
      name: scenario.tenantName,
      subdomain: scenario.subdomain,
      email: scenario.email,
      phone: '+919876543210',
      address: '123 Main Road',
      state: 'Tamil Nadu',
      pincode: '600001',
      plan: TenantPlan.PRO,
    },
  })

  console.log(`Tenant: ${tenant.name} (${tenant.id})`)

  // 3. Create DB user linked to auth
  const passwordHash = await hash(TEST_PASSWORD, 10)
  const dbUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: scenario.email } },
    update: {},
    create: {
      id: authUserId,
      email: scenario.email,
      passwordHash,
      firstName: scenario.tenantName.split(' ')[0],
      lastName: scenario.tenantName.split(' ').slice(1).join(' ') || 'Owner',
      tenantId: tenant.id,
      isOwner: true,
      emailVerified: true,
    },
  })

  console.log(`DB User: ${dbUser.email} (${dbUser.id})`)

  // 4. Create stores with locations
  const storeIds: string[] = []
  const locationIds: string[] = []

  for (const storeConfig of scenario.storeConfigs) {
    const store = await prisma.store.create({
      data: {
        tenantId: tenant.id,
        name: storeConfig.name,
        code: storeConfig.code,
        storeType: scenario.storeType,
        phone: '+919876543210',
        locations: {
          create: storeConfig.locationConfigs.map((loc) => ({
            name: loc.name,
            type: loc.type,
          })),
        },
      },
      include: { locations: true },
    })

    storeIds.push(store.id)
    store.locations.forEach((loc) => locationIds.push(loc.id))

    // Create UserStoreAccess
    await prisma.userStoreAccess.upsert({
      where: { userId_storeId: { userId: dbUser.id, storeId: store.id } },
      update: {},
      create: {
        userId: dbUser.id,
        storeId: store.id,
        isDefault: storeIds.length === 1, // first store is default
      },
    })

    console.log(`Store: ${store.name} (${store.id}) — ${store.locations.length} locations`)
  }

  // 5. Create categories
  for (const catName of scenario.categories) {
    await prisma.category.upsert({
      where: { id: `${scenario.subdomain}-${catName.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `${scenario.subdomain}-${catName.toLowerCase().replace(/\s+/g, '-')}`,
        tenantId: tenant.id,
        name: catName,
      },
    })
  }

  console.log(`Categories: ${scenario.categories.join(', ')}`)

  // 6. Create products with inventory
  for (const p of scenario.productConfigs) {
    const category = await prisma.category.findFirst({
      where: { tenantId: tenant.id, name: p.category },
    })

    const product = await prisma.product.upsert({
      where: { id: `${scenario.subdomain}-${p.sku.toLowerCase()}` },
      update: {},
      create: {
        id: `${scenario.subdomain}-${p.sku.toLowerCase()}`,
        tenantId: tenant.id,
        name: p.name,
        sku: p.sku,
        mrp: p.mrp,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        gstRate: p.gstRate,
        categoryId: category?.id,
        hasBatchNumber: false,
        hasExpiry: SCENARIO === 'grocery',
        hasSerialNumber: SCENARIO === 'electronics',
      },
    })

    // Create inventory stock in first store, first warehouse/showroom location
    const firstStore = await prisma.store.findFirst({
      where: { id: { in: storeIds } },
      include: { locations: { where: { type: { in: [LocationType.WAREHOUSE, LocationType.SHOWROOM] } }, take: 1 } },
    })

    if (firstStore?.locations[0]) {
      await prisma.inventoryStock.upsert({
        where: {
          productId_variantId_storeId_locationId: {
            productId: product.id,
            variantId: '',
            storeId: firstStore.id,
            locationId: firstStore.locations[0].id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          storeId: firstStore.id,
          locationId: firstStore.locations[0].id,
          quantity: p.inventoryQty,
        },
      })
    }
  }

  console.log(`Products: ${scenario.productConfigs.length}`)

  // 7. Create Owner persona
  const persona = await prisma.persona.upsert({
    where: { id: `${scenario.subdomain}-owner` },
    update: {},
    create: {
      id: `${scenario.subdomain}-owner`,
      tenantId: tenant.id,
      name: 'Owner/Admin',
      isSystem: true,
      permissions: {
        create: [
          'STORE_VIEW', 'STORE_EDIT', 'PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_EDIT', 'PRODUCT_DELETE',
          'BILLING_VIEW', 'BILLING_CREATE', 'BILLING_EDIT', 'BILLING_DELETE', 'BILLING_RETURN',
          'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT', 'CUSTOMER_DELETE',
          'VENDOR_VIEW', 'VENDOR_CREATE', 'VENDOR_EDIT', 'VENDOR_DELETE',
          'INVENTORY_VIEW', 'INVENTORY_EDIT', 'INVENTORY_ADJUST',
          'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT',
          'REPORT_VIEW', 'REPORT_EXPORT', 'SETTINGS_VIEW', 'SETTINGS_EDIT',
        ].map((mod) => ({
          module: mod as PermissionModule,
          action: 'VIEW' as PermissionAction,
        })),
      },
    },
  })

  await prisma.userPersona.upsert({
    where: { id: `${scenario.subdomain}-owner-persona` },
    update: {},
    create: {
      id: `${scenario.subdomain}-owner-persona`,
      userId: dbUser.id,
      personaId: persona.id,
    },
  })

  // 8. Create tenant settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      currency: 'INR',
      invoicePrefix: 'INV',
      fiscalYearStart: 4,
      lowStockAlertDays: 7,
      expiryAlertDays: 30,
      roundOffEnabled: true,
    },
  })

  // 9. Create trial subscription
  await prisma.subscription.upsert({
    where: { id: `${scenario.subdomain}-sub` },
    update: {},
    create: {
      id: `${scenario.subdomain}-sub`,
      tenantId: tenant.id,
      plan: TenantPlan.PRO,
      status: 'TRIALING',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.log(`\n=== Seed Complete ===`)
  console.log(`\nCredentials for Playwright:`)
  console.log(JSON.stringify({
    email,
    password: TEST_PASSWORD,
    tenantId: tenant.id,
    storeIds,
    locationIds,
  }, null, 2))

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Seed failed:', e)
  prisma.$disconnect()
  process.exit(1)
})