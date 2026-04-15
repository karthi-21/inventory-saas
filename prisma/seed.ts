import { PrismaClient, StoreType, TenantPlan } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Electronics Store',
      subdomain: 'demo',
      pan: 'ABCDE1234F',
      gstin: '27ABCDE1234F1Z5',
      phone: '+919876543210',
      email: 'demo@omnibiz.in',
      address: '123 MG Road, Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      plan: TenantPlan.PRO,
    },
  })

  console.log('Created tenant:', tenant.id)

  // Create a demo user
  const password = await hash('demo123', 10)
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'demo@omnibiz.in' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'demo@omnibiz.in',
      firstName: 'Demo',
      lastName: 'User',
      phone: '+919876543210',
      passwordHash: password,
      isOwner: true,
      isActive: true,
      emailVerified: true,
    },
  })

  console.log('Created user:', user.id)

  // Create a store
  const store = await prisma.store.upsert({
    where: { id: 'demo-store-001' },
    update: {},
    create: {
      id: 'demo-store-001',
      tenantId: tenant.id,
      name: 'Chennai Main Store',
      code: 'STR-001',
      storeType: StoreType.ELECTRONICS,
      address: '123 MG Road, Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      phone: '+919876543210',
      isActive: true,
    },
  })

  console.log('Created store:', store.id)

  // Create store location
  const location = await prisma.location.upsert({
    where: { id: 'demo-location-001' },
    update: {},
    create: {
      id: 'demo-location-001',
      storeId: store.id,
      name: 'Main Showroom',
      type: 'SHOWROOM',
      isActive: true,
    },
  })

  console.log('Created location:', location.id)

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-mobiles' },
      update: {},
      create: {
        id: 'cat-mobiles',
        tenantId: tenant.id,
        name: 'Mobiles',
        description: 'Smartphones and mobile phones',
        hsnCode: '8517',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-tvs' },
      update: {},
      create: {
        id: 'cat-tvs',
        tenantId: tenant.id,
        name: 'TVs',
        description: 'Televisions and displays',
        hsnCode: '8528',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-accessories' },
      update: {},
      create: {
        id: 'cat-accessories',
        tenantId: tenant.id,
        name: 'Accessories',
        description: 'Phone cases, chargers, cables',
        hsnCode: '8544',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-audio' },
      update: {},
      create: {
        id: 'cat-audio',
        tenantId: tenant.id,
        name: 'Audio',
        description: 'Headphones, speakers, earbuds',
        hsnCode: '8518',
        isActive: true,
      },
    }),
  ])

  console.log('Created categories:', categories.length)

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-iphone15' },
      update: {},
      create: {
        id: 'prod-iphone15',
        tenantId: tenant.id,
        categoryId: 'cat-mobiles',
        name: 'iPhone 15 Pro (256GB)',
        sku: 'IPHONE15-256',
        hsnCode: '8517',
        gstRate: 18,
        mrp: 134900,
        costPrice: 115000,
        sellingPrice: 129900,
        reorderLevel: 5,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-samsung-tv' },
      update: {},
      create: {
        id: 'prod-samsung-tv',
        tenantId: tenant.id,
        categoryId: 'cat-tvs',
        name: 'Samsung 43" Smart TV',
        sku: 'SAMSUNG-43TV',
        hsnCode: '8528',
        gstRate: 18,
        mrp: 45000,
        costPrice: 35000,
        sellingPrice: 42000,
        reorderLevel: 3,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-sony-headphones' },
      update: {},
      create: {
        id: 'prod-sony-headphones',
        tenantId: tenant.id,
        categoryId: 'cat-audio',
        name: 'Sony WH-1000XM5',
        sku: 'SONY-XM5',
        hsnCode: '8518',
        gstRate: 18,
        mrp: 29990,
        costPrice: 22000,
        sellingPrice: 27990,
        reorderLevel: 10,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-charger' },
      update: {},
      create: {
        id: 'prod-charger',
        tenantId: tenant.id,
        categoryId: 'cat-accessories',
        name: 'Anker 20W Fast Charger',
        sku: 'ANKER-20W',
        hsnCode: '8544',
        gstRate: 18,
        mrp: 1499,
        costPrice: 800,
        sellingPrice: 1299,
        reorderLevel: 20,
        isActive: true,
      },
    }),
  ])

  console.log('Created products:', products.length)

  // Create inventory stock for products
  for (const product of products) {
    await prisma.inventoryStock.upsert({
      where: { id: `stock-${product.id}` },
      update: {},
      create: {
        id: `stock-${product.id}`,
        productId: product.id,
        storeId: store.id,
        locationId: location.id,
        quantity: Math.floor(Math.random() * 50) + 10,
        reservedQty: 0,
      },
    })
  }

  // Create tenant settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      defaultLanguage: 'en',
      currency: 'INR',
      fiscalYearStart: 4,
      lowStockAlertDays: 7,
      expiryAlertDays: 30,
      invoicePrefix: 'INV',
      decimalPlaces: 2,
      roundOffEnabled: true,
    },
  })

  // Create persona
  const persona = await prisma.persona.upsert({
    where: { id: 'persona-owner' },
    update: {},
    create: {
      id: 'persona-owner',
      tenantId: tenant.id,
      name: 'Owner/Admin',
      description: 'Full access to all features',
      isSystem: true,
    },
  })

  // Create user persona link
  await prisma.userPersona.upsert({
    where: { id: 'user-persona-demo' },
    update: {},
    create: {
      id: 'user-persona-demo',
      userId: user.id,
      personaId: persona.id,
      storeId: store.id,
    },
  })

  // Create subscription
  await prisma.subscription.upsert({
    where: { id: 'sub-demo' },
    update: {},
    create: {
      id: 'sub-demo',
      tenantId: tenant.id,
      plan: TenantPlan.PRO,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'cust-001' },
      update: {},
      create: {
        id: 'cust-001',
        tenantId: tenant.id,
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+919876543211',
        email: 'priya@example.com',
        customerType: 'RETAIL',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-002' },
      update: {},
      create: {
        id: 'cust-002',
        tenantId: tenant.id,
        firstName: 'Quick',
        lastName: 'Mart',
        phone: '+919876543212',
        email: 'quickmart@example.com',
        customerType: 'WHOLESALE',
        gstin: '27AAAAA0000A1Z5',
      },
    }),
  ])

  console.log('Created customers:', customers.length)

  // Create sample vendor
  const vendor = await prisma.vendor.upsert({
    where: { id: 'vendor-001' },
    update: {},
    create: {
      id: 'vendor-001',
      tenantId: tenant.id,
      name: 'Samsung India Electronics',
      phone: '+918000000000',
      email: 'orders@samsung.in',
      gstin: '27AAACS8337M1Z5',
      address: 'Samsung House, Gurgaon',
      state: 'Haryana',
      pincode: '122001',
    },
  })

  console.log('Created vendor:', vendor.id)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })