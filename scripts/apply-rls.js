const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// All column names in camelCase MUST be double-quoted in PostgreSQL
const policies = [
  // Tenant
  ['tenant_access_policy', '"Tenant"', `FOR ALL TO authenticated USING (id = current_setting('app.current_tenant', true)) WITH CHECK (id = current_setting('app.current_tenant', true))`],
  ['tenant_subdomain_check', '"Tenant"', `FOR SELECT TO anon USING (true)`],

  // User
  ['user_tenant_isolation', '"User"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],
  ['user_self_access', '"User"', `FOR SELECT TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true) OR id = current_setting('app.current_user', true))`],

  // Store
  ['store_tenant_isolation', '"Store"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // Category
  ['category_tenant_isolation', '"Category"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // Product
  ['product_tenant_isolation', '"Product"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // ProductVariant
  ['product_variant_tenant_isolation', '"ProductVariant"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Product" p WHERE p.id = "ProductVariant"."productId" AND p."tenantId" = current_setting('app.current_tenant', true)))`],

  // InventoryStock
  ['inventory_stock_tenant_isolation', '"InventoryStock"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "InventoryStock"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // StockMovement
  ['stock_movement_tenant_isolation', '"StockMovement"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "StockMovement"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // Customer
  ['customer_tenant_isolation', '"Customer"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // Vendor
  ['vendor_tenant_isolation', '"Vendor"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // SalesInvoice
  ['sales_invoice_tenant_isolation', '"SalesInvoice"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "SalesInvoice"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // SalesInvoiceItem
  ['sales_invoice_item_tenant_isolation', '"SalesInvoiceItem"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "SalesInvoice" si JOIN "Store" s ON s.id = si."storeId" WHERE si.id = "SalesInvoiceItem"."invoiceId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // Payment
  ['payment_tenant_isolation', '"Payment"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "SalesInvoice" si JOIN "Store" s ON s.id = si."storeId" WHERE si.id = "Payment"."invoiceId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // PurchaseInvoice
  ['purchase_invoice_tenant_isolation', '"PurchaseInvoice"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "PurchaseInvoice"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // PurchaseInvoiceItem
  ['purchase_invoice_item_tenant_isolation', '"PurchaseInvoiceItem"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "PurchaseInvoice" pi JOIN "Store" s ON s.id = pi."storeId" WHERE pi.id = "PurchaseInvoiceItem"."purchaseInvoiceId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // RestaurantTable
  ['restaurant_table_tenant_isolation', '"RestaurantTable"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "RestaurantTable"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // MenuItem
  ['menu_item_tenant_isolation', '"MenuItem"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // ActivityLog
  ['activity_log_tenant_isolation', '"ActivityLog"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // Subscription
  ['subscription_tenant_isolation', '"Subscription"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // TenantSettings
  ['tenant_settings_tenant_isolation', '"TenantSettings"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // UserStoreAccess
  ['user_store_access_tenant_isolation', '"UserStoreAccess"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "User" u WHERE u.id = "UserStoreAccess"."userId" AND u."tenantId" = current_setting('app.current_tenant', true)))`],

  // UserPersona
  ['user_persona_tenant_isolation', '"UserPersona"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "User" u WHERE u.id = "UserPersona"."userId" AND u."tenantId" = current_setting('app.current_tenant', true)))`],

  // Persona
  ['persona_tenant_isolation', '"Persona"', `FOR ALL TO authenticated USING ("tenantId" = current_setting('app.current_tenant', true)) WITH CHECK ("tenantId" = current_setting('app.current_tenant', true))`],

  // PersonaPermission
  ['persona_permission_tenant_isolation', '"PersonaPermission"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Persona" p WHERE p.id = "PersonaPermission"."personaId" AND p."tenantId" = current_setting('app.current_tenant', true)))`],

  // Location
  ['location_tenant_isolation', '"Location"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "Location"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // LoyaltyPointsLog
  ['loyalty_points_log_tenant_isolation', '"LoyaltyPointsLog"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Customer" c WHERE c.id = "LoyaltyPointsLog"."customerId" AND c."tenantId" = current_setting('app.current_tenant', true)))`],

  // StockAdjustment
  ['stock_adjustment_tenant_isolation', '"StockAdjustment"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "StockAdjustment"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // SalesReturn
  ['sales_return_tenant_isolation', '"SalesReturn"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "SalesInvoice" si JOIN "Store" s ON s.id = si."storeId" WHERE si.id = "SalesReturn"."invoiceId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // SalesReturnItem
  ['sales_return_item_tenant_isolation', '"SalesReturnItem"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "SalesReturn" sr JOIN "SalesInvoice" si ON si.id = sr."invoiceId" JOIN "Store" s ON s.id = si."storeId" WHERE sr.id = "SalesReturnItem"."returnId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // PrinterConfig
  ['printer_config_tenant_isolation', '"PrinterConfig"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "PrinterConfig"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // Shift
  ['shift_tenant_isolation', '"Shift"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "Shift"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // KOT
  ['kot_tenant_isolation', '"KOT"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "KOT"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // KOTItem
  ['kot_item_tenant_isolation', '"KOTItem"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "KOT" k JOIN "Store" s ON s.id = k."storeId" WHERE k.id = "KOTItem"."kotId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // BOMItem
  ['bom_item_tenant_isolation', '"BOMItem"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Product" p WHERE p.id = "BOMItem"."productId" AND p."tenantId" = current_setting('app.current_tenant', true)))`],

  // PurchaseOrder
  ['purchase_order_tenant_isolation', '"PurchaseOrder"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "Store" s WHERE s.id = "PurchaseOrder"."storeId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],

  // PurchaseOrderItem
  ['purchase_order_item_tenant_isolation', '"PurchaseOrderItem"', `FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "PurchaseOrder" po JOIN "Store" s ON s.id = po."storeId" WHERE po.id = "PurchaseOrderItem"."purchaseOrderId" AND s."tenantId" = current_setting('app.current_tenant', true)))`],
];

async function main() {
  console.log('=== Applying RLS policies ===');
  let created = 0, failed = 0;

  for (const [name, table, definition] of policies) {
    try {
      await prisma.$executeRawUnsafe(`CREATE POLICY ${name} ON ${table} ${definition};`);
      console.log(`  OK ${name}`);
      created++;
    } catch (e) {
      console.log(`  FAIL ${name}: ${e.message.substring(0, 150)}`);
      failed++;
    }
  }

  console.log(`\n=== Summary: Created ${created}, Failed ${failed} ===`);

  // Verify
  const allPolicies = await prisma.$queryRaw`SELECT count(*)::int as count FROM pg_policies WHERE schemaname = 'public'`;
  console.log(`Total policies in database: ${allPolicies[0].count}`);

  // Test Prisma still works
  const tc = await prisma.tenant.count();
  const uc = await prisma.user.count();
  const sc = await prisma.store.count();
  const pc = await prisma.product.count();
  console.log(`Prisma queries work (superuser bypasses RLS): Tenants=${tc} Users=${uc} Stores=${sc} Products=${pc}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());