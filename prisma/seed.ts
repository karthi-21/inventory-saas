/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient, StoreType, TenantPlan } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Ezvento POS seed...')

  const tenantId = 'demo-tenant-1'
  const store1Id = 'demo-store-1'
  const store2Id = 'demo-store-2'

  // ============================================
  // CLEANUP: Delete existing demo data (idempotent)
  // ============================================
  console.log('🧹 Cleaning up existing demo data...')

  await prisma.salesReturnItem.deleteMany({ where: { return: { invoice: { tenantId } } } })
  await prisma.salesReturn.deleteMany({ where: { invoice: { tenantId } } })
  await prisma.payment.deleteMany({ where: { invoice: { tenantId } } })
  await prisma.salesInvoiceItem.deleteMany({ where: { invoice: { tenantId } } })
  await prisma.salesInvoice.deleteMany({ where: { tenantId } })
  await prisma.purchaseInvoice.deleteMany({ where: { tenantId } })
  await prisma.purchaseOrder.deleteMany({ where: { tenantId } })
  await prisma.stockAdjustment.deleteMany({ where: { storeId: { in: [store1Id, store2Id] } } })
  await prisma.stockMovement.deleteMany({ where: { storeId: { in: [store1Id, store2Id] } } })
  await prisma.inventoryStock.deleteMany({ where: { storeId: { in: [store1Id, store2Id] } } })
  await prisma.loyaltyPointsLog.deleteMany({ where: { customer: { tenantId } } })
  await prisma.followUp.deleteMany({ where: { customer: { tenantId } } })
  await prisma.customer.deleteMany({ where: { tenantId } })
  await prisma.productVariant.deleteMany({ where: { product: { tenantId } } })
  await prisma.product.deleteMany({ where: { tenantId } })
  await prisma.category.deleteMany({ where: { tenantId } })
  await prisma.vendor.deleteMany({ where: { tenantId } })
  await prisma.userPersona.deleteMany({ where: { user: { tenantId } } })
  await prisma.personaPermission.deleteMany({ where: { persona: { tenantId } } })
  await prisma.persona.deleteMany({ where: { tenantId } })
  await prisma.userStoreAccess.deleteMany({ where: { user: { tenantId } } })
  await prisma.shift.deleteMany({ where: { storeId: { in: [store1Id, store2Id] } } })
  await prisma.user.deleteMany({ where: { tenantId } })
  await prisma.printerConfig.deleteMany({ where: { tenantId } })
  await prisma.storePaymentConfig.deleteMany({ where: { storeId: { in: [store1Id, store2Id] } } })
  await prisma.location.deleteMany({ where: { storeId: { in: [store1Id, store2Id] } } })
  await prisma.store.deleteMany({ where: { tenantId } })
  await prisma.tenantSettings.deleteMany({ where: { tenantId } })
  await prisma.subscription.deleteMany({ where: { tenantId } })
  await prisma.emailLog.deleteMany({ where: { tenantId } })
  await prisma.activityLog.deleteMany({ where: { tenantId } })
  await prisma.tenant.deleteMany({ where: { id: tenantId } })

  console.log('✅ Cleanup complete')

  // ============================================
  // 1. TENANT
  // ============================================
  console.log('🏢 Creating tenant...')

  const tenant = await prisma.tenant.create({
    data: {
      id: tenantId,
      name: 'Demo Store',
      subdomain: 'demo-store',
      plan: TenantPlan.PRO,
      gstin: '27AABCU9603R1ZM',
      address: '42 Anna Salai, Chennai',
      state: 'Tamil Nadu',
      pincode: '600002',
      phone: '+919876543210',
      email: 'demo@ezvento.karth-21.com',
    },
  })

  console.log(`  ✅ Tenant: ${tenant.name} (${tenant.id})`)

  // ============================================
  // 2. SUBSCRIPTION
  // ============================================
  console.log('💳 Creating subscription...')

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  await prisma.subscription.create({
    data: {
      id: 'demo-sub-1',
      tenantId: tenant.id,
      plan: TenantPlan.PRO,
      status: 'ACTIVE',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  })

  console.log('  ✅ Subscription: PRO (ACTIVE)')

  // ============================================
  // 3. STORES & LOCATIONS
  // ============================================
  console.log('🏬 Creating stores and locations...')

  const showroomStore = await prisma.store.create({
    data: {
      id: store1Id,
      tenantId: tenant.id,
      name: 'Chennai Showroom',
      code: 'STR-ELEC',
      storeType: StoreType.ELECTRONICS,
      address: '42 Anna Salai, Chennai',
      state: 'Tamil Nadu',
      pincode: '600002',
      phone: '+919876543211',
      isActive: true,
    },
  })

  const groceryStore = await prisma.store.create({
    data: {
      id: store2Id,
      tenantId: tenant.id,
      name: 'Chennai Grocery',
      code: 'STR-GROC',
      storeType: StoreType.GROCERY,
      address: '15 T Nagar, Chennai',
      state: 'Tamil Nadu',
      pincode: '600017',
      phone: '+919876543212',
      isActive: true,
    },
  })

  console.log(`  ✅ ${showroomStore.name} (${showroomStore.id})`)
  console.log(`  ✅ ${groceryStore.name} (${groceryStore.id})`)

  // Locations
  const showroomLoc1 = await prisma.location.create({
    data: { id: 'demo-loc-showroom', storeId: showroomStore.id, name: 'Main Showroom', type: 'SHOWROOM', isActive: true },
  })
  const showroomLoc2 = await prisma.location.create({
    data: { id: 'demo-loc-warehouse', storeId: showroomStore.id, name: 'Back Warehouse', type: 'WAREHOUSE', isActive: true },
  })
  const groceryLoc1 = await prisma.location.create({
    data: { id: 'demo-loc-shelves', storeId: groceryStore.id, name: 'Main Shelves', type: 'RACK', isActive: true },
  })
  const groceryLoc2 = await prisma.location.create({
    data: { id: 'demo-loc-cold', storeId: groceryStore.id, name: 'Cold Storage', type: 'COLD_STORAGE', isActive: true },
  })

  console.log('  ✅ Locations: 2 per store')

  // ============================================
  // 4. USERS
  // ============================================
  console.log('👤 Creating users...')

  const password = await hash('demo123', 10)

  const owner = await prisma.user.create({
    data: {
      id: 'demo-user-owner',
      tenantId: tenant.id,
      email: 'demo@ezvento.karth-21.com',
      firstName: 'Aravind',
      lastName: 'Kumar',
      phone: '+919876543210',
      passwordHash: password,
      isOwner: true,
      isActive: true,
      emailVerified: true,
    },
  })

  const manager = await prisma.user.create({
    data: {
      id: 'demo-user-manager',
      tenantId: tenant.id,
      email: 'manager@ezvento.karth-21.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+919876543220',
      passwordHash: password,
      isOwner: false,
      isActive: true,
      emailVerified: true,
    },
  })

  const cashier = await prisma.user.create({
    data: {
      id: 'demo-user-cashier',
      tenantId: tenant.id,
      email: 'cashier@ezvento.karth-21.com',
      firstName: 'Ramesh',
      lastName: 'V',
      phone: '+919876543230',
      passwordHash: password,
      isOwner: false,
      isActive: true,
      emailVerified: true,
    },
  })

  console.log(`  ✅ ${owner.firstName} (Owner)`)
  console.log(`  ✅ ${manager.firstName} (Manager)`)
  console.log(`  ✅ ${cashier.firstName} (Cashier)`)

  // ============================================
  // 5. USER STORE ACCESS
  // ============================================
  console.log('🔑 Assigning store access...')

  const accesses = [
    { userId: owner.id, storeId: showroomStore.id, isDefault: true },
    { userId: owner.id, storeId: groceryStore.id, isDefault: false },
    { userId: manager.id, storeId: showroomStore.id, isDefault: true },
    { userId: manager.id, storeId: groceryStore.id, isDefault: false },
    { userId: cashier.id, storeId: showroomStore.id, isDefault: true },
    { userId: cashier.id, storeId: groceryStore.id, isDefault: false },
  ]

  for (const a of accesses) {
    await prisma.userStoreAccess.create({ data: a })
  }

  console.log(`  ✅ ${accesses.length} access records`)

  // ============================================
  // 6. CATEGORIES (8)
  // ============================================
  console.log('📦 Creating categories...')

  const catData = [
    { id: 'demo-cat-mobiles', name: 'Mobiles & Tablets', desc: 'Smartphones, tablets, and accessories', hsn: '8517' },
    { id: 'demo-cat-tvs', name: 'TVs & Displays', desc: 'Televisions, monitors, and projectors', hsn: '8528' },
    { id: 'demo-cat-audio', name: 'Audio & Accessories', desc: 'Headphones, speakers, chargers, cables', hsn: '8518' },
    { id: 'demo-cat-laptops', name: 'Laptops & Computers', desc: 'Laptops, desktops, and peripherals', hsn: '8471' },
    { id: 'demo-cat-staples', name: 'Food Grains & Staples', desc: 'Rice, wheat, flour, pulses, and oils', hsn: '1006' },
    { id: 'demo-cat-dairy', name: 'Dairy & Beverages', desc: 'Milk, butter, tea, coffee, and juices', hsn: '0405' },
    { id: 'demo-cat-snacks', name: 'Snacks & Confectionery', desc: 'Chips, chocolates, biscuits, and sweets', hsn: '1905' },
    { id: 'demo-cat-household', name: 'Household & Cleaning', desc: 'Detergents, cleaners, and home essentials', hsn: '3402' },
  ]

  for (const c of catData) {
    await prisma.category.create({
      data: { id: c.id, tenantId: tenant.id, name: c.name, description: c.desc, hsnCode: c.hsn, isActive: true },
    })
  }

  console.log(`  ✅ ${catData.length} categories`)

  // ============================================
  // 7. PRODUCTS (14)
  // ============================================
  console.log('🛒 Creating products...')

  interface SeedProduct {
    id: string; cat: string; name: string; sku: string; barcode: string; brand: string;
    hsn: string; gst: number; mrp: number; cost: number; sell: number; reorder: number;
    weight?: number; wunit?: string;
  }

  const prodData: SeedProduct[] = [
    // Electronics (7)
    { id: 'demo-prod-iphone15', cat: 'demo-cat-mobiles', name: 'iPhone 15 Pro 256GB', sku: 'IPH15-256', barcode: '8901234567001', brand: 'Apple', hsn: '8517', gst: 18, mrp: 134900, cost: 115000, sell: 129900, reorder: 5 },
    { id: 'demo-prod-samsung-s24', cat: 'demo-cat-mobiles', name: 'Samsung Galaxy S24 Ultra', sku: 'S24U-512', barcode: '8901234567002', brand: 'Samsung', hsn: '8517', gst: 18, mrp: 134999, cost: 110000, sell: 124999, reorder: 5 },
    { id: 'demo-prod-samsung-tv', cat: 'demo-cat-tvs', name: 'Samsung 43" Crystal 4K TV', sku: 'SAM-43TV-4K', barcode: '8901234567003', brand: 'Samsung', hsn: '8528', gst: 18, mrp: 45000, cost: 35000, sell: 41990, reorder: 3 },
    { id: 'demo-prod-sony-headphones', cat: 'demo-cat-audio', name: 'Sony WH-1000XM5', sku: 'SONY-XM5', barcode: '8901234567004', brand: 'Sony', hsn: '8518', gst: 18, mrp: 29990, cost: 22000, sell: 27990, reorder: 8 },
    { id: 'demo-prod-charger', cat: 'demo-cat-audio', name: 'Anker 20W Fast Charger', sku: 'ANK-20W', barcode: '8901234567005', brand: 'Anker', hsn: '8544', gst: 18, mrp: 1499, cost: 800, sell: 1299, reorder: 20 },
    { id: 'demo-prod-macbook', cat: 'demo-cat-laptops', name: 'MacBook Air M2 13"', sku: 'MBA-M2-256', barcode: '8901234567006', brand: 'Apple', hsn: '8471', gst: 18, mrp: 114900, cost: 95000, sell: 109900, reorder: 3 },
    { id: 'demo-prod-bose-speaker', cat: 'demo-cat-audio', name: 'Bose SoundLink Revolve+ II', sku: 'BOSE-REV2', barcode: '8901234567007', brand: 'Bose', hsn: '8518', gst: 18, mrp: 26900, cost: 21000, sell: 24990, reorder: 5 },
    // Grocery (7)
    { id: 'demo-prod-basmati', cat: 'demo-cat-staples', name: 'India Gate Basmati Rice 5kg', sku: 'RICE-BAS-5KG', barcode: '8901234567101', brand: 'India Gate', hsn: '1006', gst: 5, mrp: 650, cost: 480, sell: 599, reorder: 15, weight: 5, wunit: 'kg' },
    { id: 'demo-prod-atta', cat: 'demo-cat-staples', name: 'Aashirvaad Atta 10kg', sku: 'ATTA-10KG', barcode: '8901234567102', brand: 'Aashirvaad', hsn: '1101', gst: 5, mrp: 520, cost: 400, sell: 489, reorder: 10, weight: 10, wunit: 'kg' },
    { id: 'demo-prod-amul-butter', cat: 'demo-cat-dairy', name: 'Amul Butter 500g', sku: 'AMUL-BTR-500', barcode: '8901234567103', brand: 'Amul', hsn: '0405', gst: 5, mrp: 260, cost: 220, sell: 250, reorder: 20, weight: 0.5, wunit: 'kg' },
    { id: 'demo-prod-nescafe', cat: 'demo-cat-dairy', name: 'Nescafe Classic 200g', sku: 'NESCF-200G', barcode: '8901234567104', brand: 'Nescafe', hsn: '2101', gst: 18, mrp: 550, cost: 420, sell: 519, reorder: 12, weight: 0.2, wunit: 'kg' },
    { id: 'demo-prod-dairy-milk', cat: 'demo-cat-snacks', name: 'Cadbury Dairy Milk 150g', sku: 'CDM-150G', barcode: '8901234567105', brand: 'Cadbury', hsn: '1806', gst: 18, mrp: 180, cost: 130, sell: 170, reorder: 25, weight: 0.15, wunit: 'kg' },
    { id: 'demo-prod-lays', cat: 'demo-cat-snacks', name: 'Lays Classic Salted 52g', sku: 'LAYS-52G', barcode: '8901234567106', brand: 'Lays', hsn: '2005', gst: 12, mrp: 20, cost: 14, sell: 20, reorder: 50, weight: 0.052, wunit: 'kg' },
    { id: 'demo-prod-surf-excel', cat: 'demo-cat-household', name: 'Surf Excel Easy Wash 1kg', sku: 'SURF-1KG', barcode: '8901234567107', brand: 'Surf Excel', hsn: '3402', gst: 18, mrp: 210, cost: 155, sell: 199, reorder: 15, weight: 1, wunit: 'kg' },
  ]

  for (const p of prodData) {
    await prisma.product.create({
      data: {
        id: p.id,
        tenantId: tenant.id,
        categoryId: p.cat,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        brand: p.brand,
        hsnCode: p.hsn,
        gstRate: p.gst,
        mrp: p.mrp,
        costPrice: p.cost,
        sellingPrice: p.sell,
        reorderLevel: p.reorder,
        isActive: true,
        ...(p.weight !== undefined && { weight: p.weight, weightUnit: p.wunit }),
      },
    })
  }

  console.log(`  ✅ ${prodData.length} products`)

  // ============================================
  // 8. INVENTORY STOCK
  // ============================================
  console.log('📊 Creating inventory stock...')

  const elecIds = prodData.filter(p => !p.weight).map(p => p.id)
  const grocIds = prodData.filter(p => p.weight).map(p => p.id)

  // Showroom: Main Showroom
  for (let i = 0; i < elecIds.length; i++) {
    await prisma.inventoryStock.create({
      data: { id: `demo-stock-el-sh-${i + 1}`, productId: elecIds[i], storeId: showroomStore.id, locationId: showroomLoc1.id, quantity: [25, 18, 12, 20, 45, 8, 14][i] },
    })
  }
  // Showroom: Warehouse
  for (let i = 0; i < elecIds.length; i++) {
    await prisma.inventoryStock.create({
      data: { id: `demo-stock-el-wh-${i + 1}`, productId: elecIds[i], storeId: showroomStore.id, locationId: showroomLoc2.id, quantity: [10, 8, 6, 15, 30, 4, 8][i] },
    })
  }
  // Grocery: Main Shelves
  const grocQtys = [40, 30, 50, 25, 60, 120, 35]
  for (let i = 0; i < grocIds.length; i++) {
    await prisma.inventoryStock.create({
      data: { id: `demo-stock-gr-sh-${i + 1}`, productId: grocIds[i], storeId: groceryStore.id, locationId: groceryLoc1.id, quantity: grocQtys[i] },
    })
  }
  // Grocery: Cold Storage (Amul Butter only)
  await prisma.inventoryStock.create({
    data: { id: 'demo-stock-gr-cold-1', productId: 'demo-prod-amul-butter', storeId: groceryStore.id, locationId: groceryLoc2.id, quantity: 30 },
  })

  const totalStock = elecIds.length * 2 + grocIds.length + 1
  console.log(`  ✅ ${totalStock} stock records`)

  // ============================================
  // 9. VENDORS (2)
  // ============================================
  console.log('🚚 Creating vendors...')

  await prisma.vendor.create({
    data: { id: 'demo-vendor-1', tenantId: tenant.id, name: 'Samsung India Electronics', phone: '+914449876543', email: 'billing@samsung-india.com', gstin: '33AAACS1234B1Z9', address: 'SP Road, Bengaluru', state: 'Karnataka', creditPeriodDays: 30, isActive: true },
  })
  await prisma.vendor.create({
    data: { id: 'demo-vendor-2', tenantId: tenant.id, name: 'Metro Cash & Carry Chennai', phone: '+914428765432', email: 'chennai@metro.co.in', gstin: '33AAACM5678C1Z2', address: 'Pallikaranai, Chennai', state: 'Tamil Nadu', creditPeriodDays: 15, isActive: true },
  })

  console.log('  ✅ 2 vendors')

  // ============================================
  // 10. CUSTOMERS (5)
  // ============================================
  console.log('👥 Creating customers...')

  const custData = [
    { id: 'demo-cust-1', store: showroomStore.id, type: 'RETAIL', first: 'Rajesh', last: 'Menon', phone: '+919841234567', email: 'rajesh@email.com', city: 'Chennai', climit: 50000, cbal: 15000, lp: 350 },
    { id: 'demo-cust-2', store: showroomStore.id, type: 'RETAIL', first: 'Anita', last: 'Iyer', phone: '+919841234568', email: 'anita@email.com', city: 'Chennai', climit: 25000, cbal: 0, lp: 120 },
    { id: 'demo-cust-3', store: groceryStore.id, type: 'RETAIL', first: 'Murugan', last: 'T', phone: '+919841234569', email: null, city: 'Chennai', climit: 5000, cbal: 3200, lp: 80 },
    { id: 'demo-cust-4', store: groceryStore.id, type: 'WHOLESALE', first: 'Hotel', last: 'Saravana Bhavan', phone: '+919841234570', email: 'orders@saravanabhavan.com', gstin: '33AABCS1234D1Z6', city: 'Chennai', climit: 100000, cbal: 45000, lp: 0 },
    { id: 'demo-cust-5', store: showroomStore.id, type: 'RETAIL', first: 'Deepika', last: 'S', phone: '+919841234571', email: 'deepika@email.com', city: 'Chennai', climit: 15000, cbal: 8000, lp: 210 },
  ]

  for (const c of custData) {
    await prisma.customer.create({
      data: {
        id: c.id,
        tenantId: tenant.id,
        storeId: c.store,
        customerType: c.type as 'RETAIL' | 'WHOLESALE',
        firstName: c.first,
        lastName: c.last,
        phone: c.phone,
        email: c.email,
        gstin: c.gstin ?? null,
        city: c.city,
        state: 'Tamil Nadu',
        creditLimit: c.climit,
        creditBalance: c.cbal,
        loyaltyPoints: c.lp,
        isActive: true,
      },
    })
  }

  console.log(`  ✅ ${custData.length} customers`)

  // ============================================
  // 11. SALES INVOICES (6)
  // ============================================
  console.log('🧾 Creating sales invoices...')

  const today = new Date()

  async function makeInvoice(args: {
    num: string; store: string; loc: string; cust: string | null; by: string;
    itype: string; btype: string;
    items: { pid: string; hsn: string; qty: number; price: number; gst: number }[];
    pmethod: string; daysAgo: number;
  }) {
    const d = new Date(today)
    d.setDate(d.getDate() - args.daysAgo)

    const lineTotals = args.items.map(i => i.qty * i.price)
    const subtotal = lineTotals.reduce((a, b) => a + b, 0)
    const gstAmounts = args.items.map((item, idx) => Math.round(lineTotals[idx] * item.gst / 100 * 100) / 100)
    const totalGst = gstAmounts.reduce((a, b) => a + b, 0)
    const totalAmount = subtotal + totalGst

    return prisma.salesInvoice.create({
      data: {
        tenantId: tenant.id,
        storeId: args.store,
        locationId: args.loc,
        invoiceNumber: args.num,
        invoiceType: args.itype as import('@prisma/client').InvoiceType,
        customerId: args.cust,
        createdById: args.by,
        invoiceDate: d,
        subtotal,
        totalGst,
        roundOff: 0,
        totalAmount,
        amountPaid: totalAmount,
        amountDue: 0,
        paymentStatus: 'PAID',
        billingType: args.btype as import('@prisma/client').BillingType,
        items: {
          create: args.items.map((item, idx) => ({
            productId: item.pid,
            hsnCode: item.hsn,
            quantity: item.qty,
            unitPrice: item.price,
            gstRate: item.gst,
            gstAmount: gstAmounts[idx],
            totalAmount: lineTotals[idx] + gstAmounts[idx],
          })),
        },
        payments: {
          create: {
            amount: totalAmount,
            method: args.pmethod as import('@prisma/client').PaymentMethod,
          },
        },
      },
    })
  }

  // INV-001: iPhone + 2x charger (Rajesh, UPI, 1 day ago)
  await makeInvoice({
    num: 'INV-2026-00101', store: showroomStore.id, loc: showroomLoc1.id, cust: 'demo-cust-1', by: cashier.id,
    itype: 'RETAIL_INVOICE', btype: 'UPI',
    items: [
      { pid: 'demo-prod-iphone15', hsn: '8517', qty: 1, price: 129900, gst: 18 },
      { pid: 'demo-prod-charger', hsn: '8544', qty: 2, price: 1299, gst: 18 },
    ],
    pmethod: 'UPI', daysAgo: 1,
  })

  // INV-002: TV + headphones (Anita, CARD, 1 day ago)
  await makeInvoice({
    num: 'INV-2026-00102', store: showroomStore.id, loc: showroomLoc1.id, cust: 'demo-cust-2', by: cashier.id,
    itype: 'RETAIL_INVOICE', btype: 'CARD',
    items: [
      { pid: 'demo-prod-samsung-tv', hsn: '8528', qty: 1, price: 41990, gst: 18 },
      { pid: 'demo-prod-sony-headphones', hsn: '8518', qty: 1, price: 27990, gst: 18 },
    ],
    pmethod: 'CARD', daysAgo: 1,
  })

  // INV-003: Grocery — rice, atta, detergent (Murugan, CASH, 2 days ago)
  await makeInvoice({
    num: 'INV-2026-00103', store: groceryStore.id, loc: groceryLoc1.id, cust: 'demo-cust-3', by: cashier.id,
    itype: 'CASH_MEMO', btype: 'CASH',
    items: [
      { pid: 'demo-prod-basmati', hsn: '1006', qty: 2, price: 599, gst: 5 },
      { pid: 'demo-prod-atta', hsn: '1101', qty: 1, price: 489, gst: 5 },
      { pid: 'demo-prod-surf-excel', hsn: '3402', qty: 1, price: 199, gst: 18 },
    ],
    pmethod: 'CASH', daysAgo: 2,
  })

  // INV-004: B2B wholesale — bulk rice + butter (Hotel Saravana, CREDIT, 3 days ago)
  await makeInvoice({
    num: 'INV-2026-00104', store: groceryStore.id, loc: groceryLoc1.id, cust: 'demo-cust-4', by: manager.id,
    itype: 'TAX_INVOICE', btype: 'CREDIT',
    items: [
      { pid: 'demo-prod-basmati', hsn: '1006', qty: 20, price: 580, gst: 5 },
      { pid: 'demo-prod-amul-butter', hsn: '0405', qty: 50, price: 245, gst: 5 },
    ],
    pmethod: 'CREDIT', daysAgo: 3,
  })

  // INV-005: MacBook + Bose speaker (Deepika, MIXED, 3 days ago)
  await makeInvoice({
    num: 'INV-2026-00105', store: showroomStore.id, loc: showroomLoc1.id, cust: 'demo-cust-5', by: cashier.id,
    itype: 'RETAIL_INVOICE', btype: 'MIXED',
    items: [
      { pid: 'demo-prod-macbook', hsn: '8471', qty: 1, price: 109900, gst: 18 },
      { pid: 'demo-prod-bose-speaker', hsn: '8518', qty: 1, price: 24990, gst: 18 },
    ],
    pmethod: 'MIXED', daysAgo: 3,
  })

  // INV-006: Walk-in grocery — chocolate, chips, coffee (no customer, CASH, today)
  await makeInvoice({
    num: 'INV-2026-00106', store: groceryStore.id, loc: groceryLoc1.id, cust: null, by: cashier.id,
    itype: 'CASH_MEMO', btype: 'CASH',
    items: [
      { pid: 'demo-prod-dairy-milk', hsn: '1806', qty: 3, price: 170, gst: 18 },
      { pid: 'demo-prod-lays', hsn: '2005', qty: 5, price: 20, gst: 12 },
      { pid: 'demo-prod-nescafe', hsn: '2101', qty: 1, price: 519, gst: 18 },
    ],
    pmethod: 'CASH', daysAgo: 0,
  })

  console.log('  ✅ 6 sales invoices with items & payments')

  // ============================================
  // 12. TENANT SETTINGS
  // ============================================
  console.log('⚙️ Creating tenant settings...')

  await prisma.tenantSettings.create({
    data: {
      id: 'demo-settings-1',
      tenantId: tenant.id,
      currency: 'INR',
      fiscalYearStart: 4,
      lowStockAlertDays: 7,
      expiryAlertDays: 7,
      invoicePrefix: 'INV',
      decimalPlaces: 2,
      roundOffEnabled: true,
      creditLimitMode: 'SOFT',
      loyaltyEnabled: true,
      pointsPerRupee: 1,
      rupeePerPoint: 0.25,
      minimumRedemption: 100,
      pointsExpiryDays: 365,
      emailNotificationsEnabled: true,
      invoiceAutoSend: true,
      lowStockEmailAlerts: true,
      paymentReminderFrequency: 'WEEKLY',
    },
  })

  console.log('  ✅ Settings configured')

  // ============================================
  // 13. STORE PAYMENT CONFIGS
  // ============================================
  console.log('💳 Creating store payment configs...')

  await prisma.storePaymentConfig.create({
    data: {
      id: 'demo-paycfg-1',
      storeId: showroomStore.id,
      merchantVPA: 'ezvento-showroom@upi',
      merchantName: 'Ezvento Chennai Showroom',
      phonepeEnabled: true,
      cashEnabled: true,
      cardEnabled: true,
      upiQrEnabled: true,
      autoSendReceipt: true,
    },
  })

  await prisma.storePaymentConfig.create({
    data: {
      id: 'demo-paycfg-2',
      storeId: groceryStore.id,
      merchantVPA: 'ezvento-grocery@upi',
      merchantName: 'Ezvento Chennai Grocery',
      phonepeEnabled: true,
      cashEnabled: true,
      cardEnabled: false,
      upiQrEnabled: true,
      autoSendReceipt: true,
    },
  })

  console.log('  ✅ 2 payment configs')

  // ============================================
  // 14. SHIFTS (1 closed, 1 open)
  // ============================================
  console.log('🕐 Creating shifts...')

  await prisma.shift.create({
    data: {
      id: 'demo-shift-1',
      storeId: showroomStore.id,
      locationId: showroomLoc1.id,
      cashierId: cashier.id,
      openingCash: 5000,
      closingCash: 52350,
      expectedCash: 52350,
      variance: 0,
      openedAt: new Date(today.getTime() - 86400000),
      closedAt: new Date(today.getTime() - 86400000 + 28800000),
      status: 'CLOSED',
    },
  })

  await prisma.shift.create({
    data: {
      id: 'demo-shift-2',
      storeId: showroomStore.id,
      locationId: showroomLoc1.id,
      cashierId: cashier.id,
      openingCash: 5000,
      openedAt: today,
      status: 'OPEN',
    },
  })

  console.log('  ✅ 2 shifts (1 closed, 1 open)')

  // ============================================
  // 15. ACTIVITY LOGS
  // ============================================
  console.log('📝 Creating activity logs...')

  await prisma.activityLog.create({
    data: {
      id: 'demo-log-1',
      tenantId: tenant.id,
      userId: cashier.id,
      action: 'LOGIN',
      module: 'AUTH',
      entityType: 'User',
      entityId: cashier.id,
      createdAt: new Date(today.getTime() - 7200000),
    },
  })

  await prisma.activityLog.create({
    data: {
      id: 'demo-log-2',
      tenantId: tenant.id,
      userId: cashier.id,
      action: 'CREATE',
      module: 'BILLING',
      entityType: 'SalesInvoice',
      metadata: { invoiceNumber: 'INV-2026-00106', amount: 1250 },
      createdAt: new Date(today.getTime() - 3600000),
    },
  })

  console.log('  ✅ 2 activity logs')

  // ============================================
  // DONE
  // ============================================
  console.log('\n🎉 Seed completed successfully!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Tenant:      demo-store')
  console.log('  Owner:       demo@ezvento.karth-21.com')
  console.log('  Password:    demo123')
  console.log('  Store 1:     Chennai Showroom (Electronics)')
  console.log('  Store 2:     Chennai Grocery (Grocery)')
  console.log('  Products:    14 (7 electronics + 7 grocery)')
  console.log('  Customers:   5')
  console.log('  Invoices:    6')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
