import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Step 1: Check current RLS status ===')
  const rlsStatus = await prisma.$queryRaw`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('_prisma_migrations')
    ORDER BY tablename
  `
  console.log('Current RLS status:')
  for (const row of rlsStatus as any[]) {
    console.log(`  ${row.tablename}: rowsecurity=${row.rowsecurity}`)
  }

  console.log('\n=== Step 2: Enable RLS on all tables ===')
  const tables = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('_prisma_migrations')
  `

  for (const { tablename } of tables as any[]) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${tablename}" ENABLE ROW LEVEL SECURITY;`)
      console.log(`  ✓ RLS enabled on ${tablename}`)
    } catch (e: any) {
      if (e.message?.includes('already enabled')) {
        console.log(`  - RLS already enabled on ${tablename}`)
      } else {
        console.log(`  ✗ Error on ${tablename}: ${e.message}`)
      }
    }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${tablename}" FORCE ROW LEVEL SECURITY;`)
      console.log(`  ✓ FORCE RLS on ${tablename}`)
    } catch (e: any) {
      console.log(`  ✗ Error forcing RLS on ${tablename}: ${e.message}`)
    }
  }

  console.log('\n=== Step 3: Create set_tenant_context() function ===')
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION set_tenant_context()
    RETURNS void AS $$
    BEGIN
        PERFORM set_config('app.current_tenant',
            current_setting('request.jwt.claims', true)::json->>'tenant_id',
            true);
        PERFORM set_config('app.current_user',
            current_setting('request.jwt.claims', true)::json->>'sub',
            true);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `)
  console.log('  ✓ set_tenant_context() function created')

  console.log('\n=== Step 4: Create auth trigger function ===')
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION auth.set_tenant_on_auth()
    RETURNS trigger AS $$
    BEGIN
        UPDATE auth.users
        SET raw_app_meta_data =
            COALESCE(raw_app_meta_data, '{}'::jsonb) ||
            jsonb_build_object('tenant_id', NEW.tenantId)
        WHERE id = NEW.id;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `)
  console.log('  ✓ auth.set_tenant_on_auth() function created')

  console.log('\n=== Step 5: Create trigger on User table ===')
  // Drop if exists first
  try {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS set_tenant_context ON "User";`)
  } catch {}

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER set_tenant_context
        AFTER INSERT ON "User"
        FOR EACH ROW
        EXECUTE FUNCTION auth.set_tenant_on_auth();
  `)
  console.log('  ✓ Trigger set_tenant_context created on User table')

  console.log('\n=== Step 6: Apply RLS policies ===')

  // Drop existing policies first (they might already exist from partial runs)
  const existingPolicies = await prisma.$queryRaw`
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  `
  console.log(`  Found ${(existingPolicies as any[]).length} existing policies`)

  for (const { policyname, tablename } of existingPolicies as any[]) {
    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policyname}" ON "${tablename}";`)
    } catch (e: any) {
      console.log(`  ✗ Error dropping policy ${policyname}: ${e.message}`)
    }
  }
  console.log('  ✓ Dropped existing policies')

  // Now create the policies
  const policies = [
    // Tenant
    `CREATE POLICY tenant_access_policy ON "Tenant" FOR ALL TO authenticated USING (id = current_setting('app.current_tenant', true)::text) WITH CHECK (id = current_setting('app.current_tenant', true)::text)`,
    `CREATE POLICY tenant_subdomain_check ON "Tenant" FOR SELECT TO anon USING (true)`,

    // User
    `CREATE POLICY user_tenant_isolation ON "User" FOR ALL TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text) WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text)`,
    `CREATE POLICY user_self_access ON "User" FOR SELECT TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text OR id = current_setting('app.current_user', true)::text)`,

    // Store
    `CREATE POLICY store_tenant_isolation ON "Store" FOR ALL TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text) WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text)`,

    // Category
    `CREATE POLICY category_tenant_isolation ON "Category" FOR ALL TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text) WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text)`,

    // Product
    `CREATE POLICY product_tenant_isolation ON "Product" FOR ALL TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text) WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text)`,

    // ProductVariant
    `CREATE POLICY product_variant_tenant_isolation ON "ProductVariant" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Product" p WHERE p.id = "ProductVariant".productId AND p.tenantId = current_setting('app.current_tenant', true)::text))`,

    // InventoryStock
    `CREATE POLICY inventory_stock_tenant_isolation ON "InventoryStock" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "InventoryStock".storeId AND s.tenantId = current_setting('app.current_tenant', true)::text))`,

    // StockMovement
    `CREATE POLICY stock_movement_tenant_isolation ON "StockMovement" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "StockMovement".storeId AND s.tenantId = current_setting('app.current_tenant', true)::text))`,

    // Customer
    `CREATE POLICY customer_tenant_isolation ON "Customer" FOR ALL TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text) WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text)`,

    // Vendor
    `CREATE POLICY vendor_tenant_isolation ON "Vendor" FOR ALL TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text) WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text)`,

    // SalesInvoice
    `CREATE POLICY sales_invoice_tenant_isolation ON "SalesInvoice" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "SalesInvoice".storeId AND s.tenantId = current_setting('app.current_tenant', true)::text))`,

    // SalesInvoiceItem
    `CREATE POLICY sales_invoice_item_tenant_isolation ON "SalesInvoiceItem" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "SalesInvoice" si JOIN "Store" s ON s.id = si.storeId WHERE si.id = "SalesInvoiceItem".invoiceId AND s.tenantId = current_setting('app.current_tenant', true)::text))`,

    // Payment
    `CREATE POLICY payment_tenant_isolation ON "Payment" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "SalesInvoice" si JOIN "Store" s ON s.id = si.storeId WHERE si.id = "Payment".invoiceId AND s.tenantId = current_setting('app.current_tenant', true)::text))`,

    // PurchaseInvoice
    `CREATE POLICY purchase_invoice_tenant_isolation ON "PurchaseInvoice" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "PurchaseInvoice".storeId AND s.tenantId = current_setting('app.current_tenant', true)::text))`,

    // RestaurantTable
    `CREATE POLICY restaurant_table_tenant_isolation ON "RestaurantTable" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "RestaurantTable".storeId AND s.tenantId = current_setting('app.current_tenant', true)::text))`,

    // MenuItem
    `CREATE POLICY menu_item_tenant_isolation ON "MenuItem" FOR ALL TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text) WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text)`,

    // ActivityLog
    `CREATE POLICY activity_log_tenant_isolation ON "ActivityLog" FOR ALL TO authenticated USING (tenantId = current_setting('app.current_tenant', true)::text) WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text)`,
  ]

  for (const policy of policies) {
    const nameMatch = policy.match(/CREATE POLICY (\w+)/)
    const name = nameMatch ? nameMatch[1] : 'unknown'
    try {
      await prisma.$executeRawUnsafe(policy)
      console.log(`  ✓ Policy ${name} created`)
    } catch (e: any) {
      console.log(`  ✗ Error creating policy ${name}: ${e.message}`)
    }
  }

  console.log('\n=== Step 7: Verify RLS is enabled ===')
  const finalStatus = await prisma.$queryRaw`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('_prisma_migrations')
    ORDER BY tablename
  `
  let allEnabled = true
  for (const row of finalStatus as any[]) {
    if (!row.rowsecurity) {
      console.log(`  ✗ ${row.tablename}: RLS NOT enabled`)
      allEnabled = false
    } else {
      console.log(`  ✓ ${row.tablename}: RLS enabled`)
    }
  }

  console.log('\n=== Step 8: Verify policies exist ===')
  const policiesCheck = await prisma.$queryRaw`
    SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname
  `
  for (const row of policiesCheck as any[]) {
    console.log(`  ✓ ${row.tablename}: ${row.policyname}`)
  }

  console.log('\n=== Step 9: Verify Prisma queries still work (superuser bypasses RLS) ===')
  const tenantCount = await prisma.tenant.count()
  const userCount = await prisma.user.count()
  const storeCount = await prisma.store.count()
  const productCount = await prisma.product.count()
  console.log(`  ✓ Tenants: ${tenantCount}`)
  console.log(`  ✓ Users: ${userCount}`)
  console.log(`  ✓ Stores: ${storeCount}`)
  console.log(`  ✓ Products: ${productCount}`)

  console.log('\n=== RLS Setup Complete ===')
  if (allEnabled) {
    console.log('All tables have RLS enabled. Prisma queries work (superuser bypasses RLS).')
  } else {
    console.log('WARNING: Some tables do not have RLS enabled!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())