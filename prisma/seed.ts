/* eslint-disable @typescript-eslint/no-unused-vars */
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
      email: 'demo@ezvento.karth-21.com',
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
    where: { tenantId_email: { tenantId: tenant.id, email: 'demo@ezvento.karth-21.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'demo@ezvento.karth-21.com',
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

  // Create persona (find or create to handle existing data)
  let persona = await prisma.persona.findFirst({
    where: { tenantId: tenant.id, name: 'Owner/Admin' }
  })
  if (!persona) {
    persona = await prisma.persona.create({
      data: {
        id: 'persona-owner',
        tenantId: tenant.id,
        name: 'Owner/Admin',
        description: 'Full access to all features',
        isSystem: true,
      },
    })
  }

  // Create user persona link (find or create)
  const existingPersonaLink = await prisma.userPersona.findFirst({
    where: { userId: user.id, personaId: persona.id }
  })
  if (!existingPersonaLink) {
    await prisma.userPersona.create({
      data: {
        id: 'user-persona-demo',
        userId: user.id,
        personaId: persona.id,
        storeId: store.id,
      },
    })
  }

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

  // =============================================
  // ENHANCED SEED DATA
  // =============================================

  // --- More Customers (8 additional, 10 total) ---
  const moreCustomers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'cust-003' },
      update: {},
      create: {
        id: 'cust-003',
        tenantId: tenant.id,
        storeId: store.id,
        firstName: 'Rajesh',
        lastName: 'Kumar',
        phone: '+919940012345',
        email: 'rajesh.kumar@gmail.com',
        customerType: 'RETAIL',
        address: '45 Anna Nagar, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600040',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-004' },
      update: {},
      create: {
        id: 'cust-004',
        tenantId: tenant.id,
        storeId: store.id,
        firstName: 'Meena',
        lastName: 'Iyer',
        phone: '+919876543001',
        email: 'meena.iyer@outlook.com',
        customerType: 'RETAIL',
        address: '12 Besant Nagar, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600090',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-005' },
      update: {},
      create: {
        id: 'cust-005',
        tenantId: tenant.id,
        storeId: store.id,
        firstName: 'Sri',
        lastName: 'Electronics',
        phone: '+918010056789',
        email: 'purchases@srielectronics.in',
        customerType: 'WHOLESALE',
        gstin: '27BBBCC1234D1Z9',
        address: '88 Ritchie Road, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        creditLimit: 500000,
        creditBalance: 125000,
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-006' },
      update: {},
      create: {
        id: 'cust-006',
        tenantId: tenant.id,
        storeId: store.id,
        firstName: 'Arjun',
        lastName: 'Reddy',
        phone: '+919710123456',
        email: 'arjun.reddy@yahoo.com',
        customerType: 'RETAIL',
        address: '23 Jubilee Hills, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-007' },
      update: {},
      create: {
        id: 'cust-007',
        tenantId: tenant.id,
        storeId: store.id,
        firstName: 'Deepa',
        lastName: 'Nair',
        phone: '+919446789012',
        email: 'deepa.nair@gmail.com',
        customerType: 'RETAIL',
        address: '56 Kaloor, Kochi',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682017',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-008' },
      update: {},
      create: {
        id: 'cust-008',
        tenantId: tenant.id,
        storeId: store.id,
        firstName: 'Gupta',
        lastName: 'Traders',
        phone: '+919876504321',
        email: 'orders@guptatraders.in',
        customerType: 'WHOLESALE',
        gstin: '27CCCPP5678Q1Z3',
        address: '14 Sector 18, Noida',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        creditLimit: 1000000,
        creditBalance: 450000,
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-009' },
      update: {},
      create: {
        id: 'cust-009',
        tenantId: tenant.id,
        storeId: store.id,
        firstName: 'Kavitha',
        lastName: 'Subramaniam',
        phone: '+919600011122',
        email: 'kavitha.s@hotmail.com',
        customerType: 'RETAIL',
        address: '7 T Nagar, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'cust-010' },
      update: {},
      create: {
        id: 'cust-010',
        tenantId: tenant.id,
        storeId: store.id,
        firstName: 'Patel',
        lastName: 'Distributors',
        phone: '+917990033445',
        email: 'sales@pateldist.in',
        customerType: 'WHOLESALE',
        gstin: '27DDDPQ9012R1Z7',
        address: '31 CG Road, Ahmedabad',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380006',
        creditLimit: 750000,
        creditBalance: 0,
      },
    }),
  ])

  console.log('Created additional customers:', moreCustomers.length)

  // --- More Vendors (3 additional, 4 total) ---
  const moreVendors = await Promise.all([
    prisma.vendor.upsert({
      where: { id: 'vendor-002' },
      update: {},
      create: {
        id: 'vendor-002',
        tenantId: tenant.id,
        name: 'Apple India Distribution',
        phone: '+918000010001',
        email: 'orders@appleindia.co.in',
        gstin: '27AAACI1234A1Z1',
        address: 'Apple India Pvt Ltd, Cyber City, DLF Phase 2',
        city: 'Gurgaon',
        state: 'Haryana',
        pincode: '122002',
        creditPeriodDays: 30,
      },
    }),
    prisma.vendor.upsert({
      where: { id: 'vendor-003' },
      update: {},
      create: {
        id: 'vendor-003',
        tenantId: tenant.id,
        name: 'Sony India Pvt Ltd',
        phone: '+918000020002',
        email: 'distributors@sony.co.in',
        gstin: '27AAACS5678B1Z5',
        address: 'Sony India, Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        creditPeriodDays: 21,
      },
    }),
    prisma.vendor.upsert({
      where: { id: 'vendor-004' },
      update: {},
      create: {
        id: 'vendor-004',
        tenantId: tenant.id,
        name: 'Anker Innovations India',
        phone: '+918000030003',
        email: 'wholesale@ankerindia.com',
        gstin: '27BBBBA9012C1Z9',
        address: 'Anker India, Outer Ring Road, Marathahalli',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560037',
        creditPeriodDays: 15,
      },
    }),
  ])

  console.log('Created additional vendors:', moreVendors.length)

  // --- More Products (11 additional, 15 total) ---
  const moreProducts = await Promise.all([
    // Mobiles
    prisma.product.upsert({
      where: { id: 'prod-samsung-s24' },
      update: {},
      create: {
        id: 'prod-samsung-s24',
        tenantId: tenant.id,
        categoryId: 'cat-mobiles',
        name: 'Samsung Galaxy S24 Ultra (256GB)',
        sku: 'SAMSUNG-S24U-256',
        brand: 'Samsung',
        hsnCode: '8517',
        gstRate: 18,
        mrp: 134999,
        costPrice: 110000,
        sellingPrice: 129999,
        reorderLevel: 5,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-oneplus-12' },
      update: {},
      create: {
        id: 'prod-oneplus-12',
        tenantId: tenant.id,
        categoryId: 'cat-mobiles',
        name: 'OnePlus 12 (256GB)',
        sku: 'ONEPLUS-12-256',
        brand: 'OnePlus',
        hsnCode: '8517',
        gstRate: 18,
        mrp: 64999,
        costPrice: 52000,
        sellingPrice: 61999,
        reorderLevel: 8,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-pixel8' },
      update: {},
      create: {
        id: 'prod-pixel8',
        tenantId: tenant.id,
        categoryId: 'cat-mobiles',
        name: 'Google Pixel 8 Pro (128GB)',
        sku: 'PIXEL-8PRO-128',
        brand: 'Google',
        hsnCode: '8517',
        gstRate: 18,
        mrp: 106999,
        costPrice: 88000,
        sellingPrice: 99999,
        reorderLevel: 4,
        isActive: true,
      },
    }),
    // TVs
    prisma.product.upsert({
      where: { id: 'prod-lg-tv' },
      update: {},
      create: {
        id: 'prod-lg-tv',
        tenantId: tenant.id,
        categoryId: 'cat-tvs',
        name: 'LG 55" OLED C3 Smart TV',
        sku: 'LG-55OLED-C3',
        brand: 'LG',
        hsnCode: '8528',
        gstRate: 18,
        mrp: 149990,
        costPrice: 115000,
        sellingPrice: 139990,
        reorderLevel: 2,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-tcl-tv' },
      update: {},
      create: {
        id: 'prod-tcl-tv',
        tenantId: tenant.id,
        categoryId: 'cat-tvs',
        name: 'TCL 50" 4K LED Smart TV',
        sku: 'TCL-50-4K',
        brand: 'TCL',
        hsnCode: '8528',
        gstRate: 18,
        mrp: 39990,
        costPrice: 28000,
        sellingPrice: 36990,
        reorderLevel: 4,
        isActive: true,
      },
    }),
    // Audio
    prisma.product.upsert({
      where: { id: 'prod-bose-speaker' },
      update: {},
      create: {
        id: 'prod-bose-speaker',
        tenantId: tenant.id,
        categoryId: 'cat-audio',
        name: 'Bose SoundLink Revolve+ II',
        sku: 'BOSE-REVLVE2',
        brand: 'Bose',
        hsnCode: '8518',
        gstRate: 18,
        mrp: 29900,
        costPrice: 21000,
        sellingPrice: 26900,
        reorderLevel: 6,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-airpods' },
      update: {},
      create: {
        id: 'prod-airpods',
        tenantId: tenant.id,
        categoryId: 'cat-audio',
        name: 'Apple AirPods Pro (2nd Gen)',
        sku: 'AIRPODS-PRO2',
        brand: 'Apple',
        hsnCode: '8518',
        gstRate: 18,
        mrp: 24900,
        costPrice: 18500,
        sellingPrice: 22900,
        reorderLevel: 12,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-jbl-earbuds' },
      update: {},
      create: {
        id: 'prod-jbl-earbuds',
        tenantId: tenant.id,
        categoryId: 'cat-audio',
        name: 'JBL Tune 230NC TWS Earbuds',
        sku: 'JBL-T230NC',
        brand: 'JBL',
        hsnCode: '8518',
        gstRate: 18,
        mrp: 7999,
        costPrice: 4500,
        sellingPrice: 6999,
        reorderLevel: 15,
        isActive: true,
      },
    }),
    // Accessories
    prisma.product.upsert({
      where: { id: 'prod-usbc-cable' },
      update: {},
      create: {
        id: 'prod-usbc-cable',
        tenantId: tenant.id,
        categoryId: 'cat-accessories',
        name: 'Belkin USB-C to Lightning Cable (1.5m)',
        sku: 'BELKIN-USBC-LTG',
        brand: 'Belkin',
        hsnCode: '8544',
        gstRate: 18,
        mrp: 1999,
        costPrice: 1000,
        sellingPrice: 1699,
        reorderLevel: 25,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-powerbank' },
      update: {},
      create: {
        id: 'prod-powerbank',
        tenantId: tenant.id,
        categoryId: 'cat-accessories',
        name: 'Mi 20000mAh Power Bank',
        sku: 'MI-PB-20K',
        brand: 'Xiaomi',
        hsnCode: '8507',
        gstRate: 18,
        mrp: 2499,
        costPrice: 1400,
        sellingPrice: 2199,
        reorderLevel: 20,
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-phone-case' },
      update: {},
      create: {
        id: 'prod-phone-case',
        tenantId: tenant.id,
        categoryId: 'cat-accessories',
        name: 'Apple Silicone Case for iPhone 15 Pro',
        sku: 'APPLE-CASE-15P',
        brand: 'Apple',
        hsnCode: '3926',
        gstRate: 18,
        mrp: 4900,
        costPrice: 2800,
        sellingPrice: 4490,
        reorderLevel: 15,
        isActive: true,
      },
    }),
  ])

  console.log('Created additional products:', moreProducts.length)

  // Create inventory stock for new products
  for (const product of moreProducts) {
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

  // Collect all product IDs for invoice creation
  const allProducts = [...products, ...moreProducts]
  const allCustomers = [...customers, ...moreCustomers]

  // Helper: get product by id suffix
  const getProduct = (id: string) => allProducts.find(p => p.id === id)!
  const getCustomer = (id: string) => allCustomers.find(c => c.id === id)!

  // --- Sample Sales Invoices (6 invoices) ---
  // Delete existing invoices for idempotency (invoices use create, not upsert)
  const existingInvoices = await prisma.salesInvoice.findMany({
    where: { tenantId: tenant.id, storeId: store.id },
    select: { id: true },
  })
  if (existingInvoices.length > 0) {
    const existingInvoiceIds = existingInvoices.map(i => i.id)
    await prisma.payment.deleteMany({ where: { invoiceId: { in: existingInvoiceIds } } })
    await prisma.salesInvoiceItem.deleteMany({ where: { invoiceId: { in: existingInvoiceIds } } })
    await prisma.salesInvoice.deleteMany({ where: { id: { in: existingInvoiceIds } } })
  }

  const existingPurchaseInvoices = await prisma.purchaseInvoice.findMany({
    where: { tenantId: tenant.id, storeId: store.id },
    select: { id: true },
  })
  if (existingPurchaseInvoices.length > 0) {
    const existingPIIds = existingPurchaseInvoices.map(i => i.id)
    await prisma.purchaseInvoiceItem.deleteMany({ where: { purchaseInvoiceId: { in: existingPIIds } } })
    await prisma.purchaseInvoice.deleteMany({ where: { id: { in: existingPIIds } } })
  }

  console.log('Creating sales invoices...')

  // Invoice 1: Cash sale - iPhone 15 Pro + case + charger to retail customer
  const inv1Subtotal = 129900 + 4490 + 1299
  const inv1Gst = Math.round((inv1Subtotal * 18 / 118) * 100) / 100 // extract GST from inclusive
  const inv1Total = inv1Subtotal
  const inv1RoundOff = Math.round(inv1Total) - inv1Total
  const invoice1 = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      invoiceNumber: 'INV20260415-0001',
      invoiceType: 'RETAIL_INVOICE',
      customerId: 'cust-003',
      createdById: user.id,
      invoiceDate: new Date('2026-04-10T10:30:00'),
      subtotal: inv1Subtotal - inv1Gst,
      totalGst: inv1Gst,
      roundOff: inv1RoundOff,
      totalAmount: Math.round(inv1Total),
      amountPaid: Math.round(inv1Total),
      amountDue: 0,
      paymentStatus: 'PAID',
      billingType: 'CASH',
      items: {
        create: [
          {
            productId: 'prod-iphone15',
            hsnCode: '8517',
            quantity: 1,
            unitPrice: 129900,
            gstRate: 18,
            gstAmount: Math.round(129900 * 18 / 118 * 100) / 100,
            totalAmount: 129900,
          },
          {
            productId: 'prod-phone-case',
            hsnCode: '3926',
            quantity: 1,
            unitPrice: 4490,
            gstRate: 18,
            gstAmount: Math.round(4490 * 18 / 118 * 100) / 100,
            totalAmount: 4490,
          },
          {
            productId: 'prod-charger',
            hsnCode: '8544',
            quantity: 1,
            unitPrice: 1299,
            gstRate: 18,
            gstAmount: Math.round(1299 * 18 / 118 * 100) / 100,
            totalAmount: 1299,
          },
        ],
      },
      payments: {
        create: {
          amount: Math.round(inv1Total),
          method: 'CASH',
        },
      },
    },
  })

  // Decrement inventory for invoice 1
  await prisma.inventoryStock.update({ where: { id: 'stock-prod-iphone15' }, data: { quantity: { decrement: 1 } } })
  await prisma.inventoryStock.update({ where: { id: 'stock-prod-phone-case' }, data: { quantity: { decrement: 1 } } })
  await prisma.inventoryStock.update({ where: { id: 'stock-prod-charger' }, data: { quantity: { decrement: 1 } } })

  // Invoice 2: UPI sale - Samsung TV to retail customer
  const inv2Items = [
    { productId: 'prod-samsung-tv', hsnCode: '8528', qty: 1, price: 42000, gstRate: 18 },
  ]
  const inv2Subtotal = 42000
  const inv2Gst = Math.round(inv2Subtotal * 18 / 118 * 100) / 100
  const invoice2 = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      invoiceNumber: 'INV20260415-0002',
      invoiceType: 'RETAIL_INVOICE',
      customerId: 'cust-004',
      createdById: user.id,
      invoiceDate: new Date('2026-04-11T14:15:00'),
      subtotal: inv2Subtotal - inv2Gst,
      totalGst: inv2Gst,
      roundOff: 0,
      totalAmount: inv2Subtotal,
      amountPaid: inv2Subtotal,
      amountDue: 0,
      paymentStatus: 'PAID',
      billingType: 'UPI',
      items: {
        create: inv2Items.map(item => ({
          productId: item.productId,
          hsnCode: item.hsnCode,
          quantity: item.qty,
          unitPrice: item.price,
          gstRate: item.gstRate,
          gstAmount: Math.round(item.price * 18 / 118 * 100) / 100,
          totalAmount: item.price,
        })),
      },
      payments: {
        create: {
          amount: inv2Subtotal,
          method: 'UPI',
          reference: 'UPI-20260411-14A5',
        },
      },
    },
  })

  await prisma.inventoryStock.update({ where: { id: 'stock-prod-samsung-tv' }, data: { quantity: { decrement: 1 } } })

  // Invoice 3: Credit sale (B2B Tax Invoice) - bulk Samsung phones + accessories to wholesale customer
  const inv3Items = [
    { productId: 'prod-samsung-s24', hsnCode: '8517', qty: 5, price: 125000, gstRate: 18 },
    { productId: 'prod-charger', hsnCode: '8544', qty: 10, price: 1100, gstRate: 18 },
    { productId: 'prod-usbc-cable', hsnCode: '8544', qty: 10, price: 1400, gstRate: 18 },
  ]
  const inv3LineTotals = inv3Items.map(i => i.qty * i.price)
  const inv3Subtotal = inv3LineTotals.reduce((a, b) => a + b, 0)
  const inv3Gst = Math.round(inv3Subtotal * 18 / 118 * 100) / 100
  const inv3Total = inv3Subtotal
  const inv3Paid = 300000 // partial payment
  const invoice3 = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      invoiceNumber: 'INV20260412-0003',
      invoiceType: 'TAX_INVOICE',
      customerId: 'cust-005',
      createdById: user.id,
      invoiceDate: new Date('2026-04-12T11:00:00'),
      subtotal: inv3Subtotal - inv3Gst,
      totalGst: inv3Gst,
      roundOff: 0,
      totalAmount: inv3Total,
      amountPaid: inv3Paid,
      amountDue: inv3Total - inv3Paid,
      paymentStatus: 'PARTIAL',
      billingType: 'CREDIT',
      gstin: '27BBBCC1234D1Z9',
      items: {
        create: inv3Items.map((item, idx) => ({
          productId: item.productId,
          hsnCode: item.hsnCode,
          quantity: item.qty,
          unitPrice: item.price,
          gstRate: item.gstRate,
          gstAmount: Math.round(inv3LineTotals[idx] * 18 / 118 * 100) / 100,
          totalAmount: inv3LineTotals[idx],
        })),
      },
      payments: {
        create: [
          { amount: 200000, method: 'BANK_TRANSFER', reference: 'NEFT-AX123456' },
          { amount: 100000, method: 'UPI', reference: 'UPI-20260412-B2B' },
        ],
      },
    },
  })

  await prisma.inventoryStock.update({ where: { id: 'stock-prod-samsung-s24' }, data: { quantity: { decrement: 5 } } })
  await prisma.inventoryStock.update({ where: { id: 'stock-prod-charger' }, data: { quantity: { decrement: 10 } } })
  await prisma.inventoryStock.update({ where: { id: 'stock-prod-usbc-cable' }, data: { quantity: { decrement: 10 } } })

  // Invoice 4: UPI sale - AirPods + JBL earbuds to retail customer
  const inv4Items = [
    { productId: 'prod-airpods', hsnCode: '8518', qty: 1, price: 22900, gstRate: 18 },
    { productId: 'prod-jbl-earbuds', hsnCode: '8518', qty: 2, price: 6999, gstRate: 18 },
  ]
  const inv4LineTotals = inv4Items.map(i => i.qty * i.price)
  const inv4Subtotal = inv4LineTotals.reduce((a, b) => a + b, 0)
  const inv4Gst = Math.round(inv4Subtotal * 18 / 118 * 100) / 100
  const invoice4 = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      invoiceNumber: 'INV20260413-0004',
      invoiceType: 'RETAIL_INVOICE',
      customerId: 'cust-006',
      createdById: user.id,
      invoiceDate: new Date('2026-04-13T16:45:00'),
      subtotal: inv4Subtotal - inv4Gst,
      totalGst: inv4Gst,
      roundOff: 0,
      totalAmount: inv4Subtotal,
      amountPaid: inv4Subtotal,
      amountDue: 0,
      paymentStatus: 'PAID',
      billingType: 'UPI',
      items: {
        create: inv4Items.map((item, idx) => ({
          productId: item.productId,
          hsnCode: item.hsnCode,
          quantity: item.qty,
          unitPrice: item.price,
          gstRate: item.gstRate,
          gstAmount: Math.round(inv4LineTotals[idx] * 18 / 118 * 100) / 100,
          totalAmount: inv4LineTotals[idx],
        })),
      },
      payments: {
        create: {
          amount: inv4Subtotal,
          method: 'UPI',
          reference: 'UPI-20260413-78GH',
        },
      },
    },
  })

  await prisma.inventoryStock.update({ where: { id: 'stock-prod-airpods' }, data: { quantity: { decrement: 1 } } })
  await prisma.inventoryStock.update({ where: { id: 'stock-prod-jbl-earbuds' }, data: { quantity: { decrement: 2 } } })

  // Invoice 5: Credit sale (B2B) - LG OLED TVs to wholesale Gupta Traders
  const inv5Items = [
    { productId: 'prod-lg-tv', hsnCode: '8528', qty: 3, price: 135000, gstRate: 18 },
    { productId: 'prod-tcl-tv', hsnCode: '8528', qty: 5, price: 35000, gstRate: 18 },
  ]
  const inv5LineTotals = inv5Items.map(i => i.qty * i.price)
  const inv5Subtotal = inv5LineTotals.reduce((a, b) => a + b, 0)
  const inv5Gst = Math.round(inv5Subtotal * 18 / 118 * 100) / 100
  const invoice5 = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      invoiceNumber: 'INV20260414-0005',
      invoiceType: 'TAX_INVOICE',
      customerId: 'cust-008',
      createdById: user.id,
      invoiceDate: new Date('2026-04-14T09:20:00'),
      subtotal: inv5Subtotal - inv5Gst,
      totalGst: inv5Gst,
      roundOff: 0,
      totalAmount: inv5Subtotal,
      amountPaid: 0,
      amountDue: inv5Subtotal,
      paymentStatus: 'DUE',
      billingType: 'CREDIT',
      gstin: '27CCCPP5678Q1Z3',
      items: {
        create: inv5Items.map((item, idx) => ({
          productId: item.productId,
          hsnCode: item.hsnCode,
          quantity: item.qty,
          unitPrice: item.price,
          gstRate: item.gstRate,
          gstAmount: Math.round(inv5LineTotals[idx] * 18 / 118 * 100) / 100,
          totalAmount: inv5LineTotals[idx],
        })),
      },
    },
  })

  await prisma.inventoryStock.update({ where: { id: 'stock-prod-lg-tv' }, data: { quantity: { decrement: 3 } } })
  await prisma.inventoryStock.update({ where: { id: 'stock-prod-tcl-tv' }, data: { quantity: { decrement: 5 } } })

  // Invoice 6: Cash sale - Sony headphones + power bank to retail customer
  const inv6Items = [
    { productId: 'prod-sony-headphones', hsnCode: '8518', qty: 1, price: 27990, gstRate: 18 },
    { productId: 'prod-powerbank', hsnCode: '8507', qty: 1, price: 2199, gstRate: 18 },
  ]
  const inv6LineTotals = inv6Items.map(i => i.qty * i.price)
  const inv6Subtotal = inv6LineTotals.reduce((a, b) => a + b, 0)
  const inv6Gst = Math.round(inv6Subtotal * 18 / 118 * 100) / 100
  const invoice6 = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      invoiceNumber: 'INV20260415-0006',
      invoiceType: 'RETAIL_INVOICE',
      customerId: 'cust-001',
      createdById: user.id,
      invoiceDate: new Date('2026-04-15T08:30:00'),
      subtotal: inv6Subtotal - inv6Gst,
      totalGst: inv6Gst,
      roundOff: 0,
      totalAmount: inv6Subtotal,
      amountPaid: inv6Subtotal,
      amountDue: 0,
      paymentStatus: 'PAID',
      billingType: 'CASH',
      items: {
        create: inv6Items.map((item, idx) => ({
          productId: item.productId,
          hsnCode: item.hsnCode,
          quantity: item.qty,
          unitPrice: item.price,
          gstRate: item.gstRate,
          gstAmount: Math.round(inv6LineTotals[idx] * 18 / 118 * 100) / 100,
          totalAmount: inv6LineTotals[idx],
        })),
      },
      payments: {
        create: {
          amount: inv6Subtotal,
          method: 'CASH',
        },
      },
    },
  })

  await prisma.inventoryStock.update({ where: { id: 'stock-prod-sony-headphones' }, data: { quantity: { decrement: 1 } } })
  await prisma.inventoryStock.update({ where: { id: 'stock-prod-powerbank' }, data: { quantity: { decrement: 1 } } })

  console.log('Created sales invoices: 6')

  // --- Sample Purchase Invoices (3) ---
  console.log('Creating purchase invoices...')

  // Purchase Invoice 1: Samsung India - Samsung TVs + Samsung phones
  const pi1Items = [
    { productId: 'prod-samsung-tv', qty: 10, unitPrice: 35000, gstRate: 18, desc: 'Samsung 43" Smart TV' },
    { productId: 'prod-samsung-s24', qty: 15, unitPrice: 110000, gstRate: 18, desc: 'Samsung Galaxy S24 Ultra' },
  ]
  const pi1LineTotals = pi1Items.map(i => i.qty * i.unitPrice)
  const pi1Subtotal = pi1LineTotals.reduce((a, b) => a + b, 0)
  const pi1Gst = Math.round(pi1Subtotal * 18 / 100 * 100) / 100
  const pi1Total = pi1Subtotal + pi1Gst
  const purchaseInvoice1 = await prisma.purchaseInvoice.create({
    data: {
      tenantId: tenant.id,
      vendorId: 'vendor-001',
      storeId: store.id,
      invoiceNumber: 'PUR-2026-001',
      invoiceDate: new Date('2026-04-01'),
      dueDate: new Date('2026-04-30'),
      subtotal: pi1Subtotal,
      totalGst: pi1Gst,
      totalAmount: pi1Total,
      amountPaid: pi1Total,
      status: 'PAID',
      createdById: user.id,
      items: {
        create: pi1Items.map((item, idx) => ({
          productId: item.productId,
          description: item.desc,
          quantity: item.qty,
          receivedQty: item.qty,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          gstAmount: Math.round(pi1LineTotals[idx] * 18 / 100 * 100) / 100,
          totalAmount: pi1LineTotals[idx] + Math.round(pi1LineTotals[idx] * 18 / 100 * 100) / 100,
        })),
      },
    },
  })

  // Purchase Invoice 2: Apple India - iPhones + AirPods
  const pi2Items = [
    { productId: 'prod-iphone15', qty: 20, unitPrice: 115000, gstRate: 18, desc: 'iPhone 15 Pro 256GB' },
    { productId: 'prod-airpods', qty: 30, unitPrice: 18500, gstRate: 18, desc: 'Apple AirPods Pro 2nd Gen' },
  ]
  const pi2LineTotals = pi2Items.map(i => i.qty * i.unitPrice)
  const pi2Subtotal = pi2LineTotals.reduce((a, b) => a + b, 0)
  const pi2Gst = Math.round(pi2Subtotal * 18 / 100 * 100) / 100
  const pi2Total = pi2Subtotal + pi2Gst
  const purchaseInvoice2 = await prisma.purchaseInvoice.create({
    data: {
      tenantId: tenant.id,
      vendorId: 'vendor-002',
      storeId: store.id,
      invoiceNumber: 'PUR-2026-002',
      invoiceDate: new Date('2026-04-05'),
      dueDate: new Date('2026-05-05'),
      subtotal: pi2Subtotal,
      totalGst: pi2Gst,
      totalAmount: pi2Total,
      amountPaid: 1000000,
      status: 'PENDING',
      createdById: user.id,
      items: {
        create: pi2Items.map((item, idx) => ({
          productId: item.productId,
          description: item.desc,
          quantity: item.qty,
          receivedQty: item.qty,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          gstAmount: Math.round(pi2LineTotals[idx] * 18 / 100 * 100) / 100,
          totalAmount: pi2LineTotals[idx] + Math.round(pi2LineTotals[idx] * 18 / 100 * 100) / 100,
        })),
      },
    },
  })

  // Purchase Invoice 3: Sony India + Anker - Audio gear and accessories
  const pi3Items = [
    { productId: 'prod-sony-headphones', qty: 25, unitPrice: 22000, gstRate: 18, desc: 'Sony WH-1000XM5' },
    { productId: 'prod-charger', qty: 100, unitPrice: 800, gstRate: 18, desc: 'Anker 20W Fast Charger' },
    { productId: 'prod-bose-speaker', qty: 10, unitPrice: 21000, gstRate: 18, desc: 'Bose SoundLink Revolve+ II' },
  ]
  const pi3LineTotals = pi3Items.map(i => i.qty * i.unitPrice)
  const pi3Subtotal = pi3LineTotals.reduce((a, b) => a + b, 0)
  const pi3Gst = Math.round(pi3Subtotal * 18 / 100 * 100) / 100
  const pi3Total = pi3Subtotal + pi3Gst
  const purchaseInvoice3 = await prisma.purchaseInvoice.create({
    data: {
      tenantId: tenant.id,
      vendorId: 'vendor-003',
      storeId: store.id,
      invoiceNumber: 'PUR-2026-003',
      invoiceDate: new Date('2026-04-08'),
      dueDate: new Date('2026-04-29'),
      subtotal: pi3Subtotal,
      totalGst: pi3Gst,
      totalAmount: pi3Total,
      amountPaid: 0,
      status: 'PENDING',
      createdById: user.id,
      items: {
        create: pi3Items.map((item, idx) => ({
          productId: item.productId,
          description: item.desc,
          quantity: item.qty,
          receivedQty: item.qty,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          gstAmount: Math.round(pi3LineTotals[idx] * 18 / 100 * 100) / 100,
          totalAmount: pi3LineTotals[idx] + Math.round(pi3LineTotals[idx] * 18 / 100 * 100) / 100,
        })),
      },
    },
  })

  console.log('Created purchase invoices: 3')

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