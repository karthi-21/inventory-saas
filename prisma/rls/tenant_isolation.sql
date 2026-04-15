-- ============================================
-- RLS POLICIES FOR MULTI-TENANT ISOLATION
-- ============================================

-- Enable RLS on all tables
do $$
declare
    tbl text;
begin
    for tbl in 
        select tablename 
        from pg_tables 
        where schemaname = 'public' 
        and tablename not in ('_prisma_migrations', 'prisma_migrations')
    loop
        execute format('ALTER TABLE "%I" ENABLE ROW LEVEL SECURITY;', tbl);
        execute format('ALTER TABLE "%I" FORCE ROW LEVEL SECURITY;', tbl);
    end loop;
end $$;

-- ============================================
-- TENANT TABLE (Foundation of isolation)
-- ============================================
CREATE POLICY tenant_access_policy ON "Tenant"
    FOR ALL
    TO authenticated
    USING (id = current_setting('app.current_tenant', true)::text)
    WITH CHECK (id = current_setting('app.current_tenant', true)::text);

-- Allow anon to read during signup (for subdomain check)
CREATE POLICY tenant_subdomain_check ON "Tenant"
    FOR SELECT
    TO anon
    USING (true);

-- ============================================
-- USER TABLE
-- ============================================
CREATE POLICY user_tenant_isolation ON "User"
    FOR ALL
    TO authenticated
    USING (tenantId = current_setting('app.current_tenant', true)::text)
    WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text);

-- Users can view their own profile (for auth)
CREATE POLICY user_self_access ON "User"
    FOR SELECT
    TO authenticated
    USING (
        tenantId = current_setting('app.current_tenant', true)::text
        OR id = current_setting('app.current_user', true)::text
    );

-- ============================================
-- STORE TABLE
-- ============================================
CREATE POLICY store_tenant_isolation ON "Store"
    FOR ALL
    TO authenticated
    USING (tenantId = current_setting('app.current_tenant', true)::text)
    WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text);

-- ============================================
-- PRODUCT CATALOG
-- ============================================
CREATE POLICY category_tenant_isolation ON "Category"
    FOR ALL
    TO authenticated
    USING (tenantId = current_setting('app.current_tenant', true)::text)
    WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text);

CREATE POLICY product_tenant_isolation ON "Product"
    FOR ALL
    TO authenticated
    USING (tenantId = current_setting('app.current_tenant', true)::text)
    WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text);

CREATE POLICY product_variant_tenant_isolation ON "ProductVariant"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "Product" p 
            WHERE p.id = "ProductVariant".productId 
            AND p.tenantId = current_setting('app.current_tenant', true)::text
        )
    );

-- ============================================
-- INVENTORY
-- ============================================
CREATE POLICY inventory_stock_tenant_isolation ON "InventoryStock"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "Store" s 
            WHERE s.id = "InventoryStock".storeId 
            AND s.tenantId = current_setting('app.current_tenant', true)::text
        )
    );

CREATE POLICY stock_movement_tenant_isolation ON "StockMovement"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "Store" s 
            WHERE s.id = "StockMovement".storeId 
            AND s.tenantId = current_setting('app.current_tenant', true)::text
        )
    );

-- ============================================
-- CUSTOMERS & VENDORS
-- ============================================
CREATE POLICY customer_tenant_isolation ON "Customer"
    FOR ALL
    TO authenticated
    USING (tenantId = current_setting('app.current_tenant', true)::text)
    WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text);

CREATE POLICY vendor_tenant_isolation ON "Vendor"
    FOR ALL
    TO authenticated
    USING (tenantId = current_setting('app.current_tenant', true)::text)
    WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text);

-- ============================================
-- BILLING / SALES
-- ============================================
CREATE POLICY sales_invoice_tenant_isolation ON "SalesInvoice"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "Store" s 
            WHERE s.id = "SalesInvoice".storeId 
            AND s.tenantId = current_setting('app.current_tenant', true)::text
        )
    );

CREATE POLICY sales_invoice_item_tenant_isolation ON "SalesInvoiceItem"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "SalesInvoice" si
            JOIN "Store" s ON s.id = si.storeId
            WHERE si.id = "SalesInvoiceItem".invoiceId
            AND s.tenantId = current_setting('app.current_tenant', true)::text
        )
    );

CREATE POLICY payment_tenant_isolation ON "Payment"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "SalesInvoice" si
            JOIN "Store" s ON s.id = si.storeId
            WHERE si.id = "Payment".invoiceId
            AND s.tenantId = current_setting('app.current_tenant', true)::text
        )
    );

-- ============================================
-- PURCHASES
-- ============================================
CREATE POLICY purchase_invoice_tenant_isolation ON "PurchaseInvoice"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "Store" s 
            WHERE s.id = "PurchaseInvoice".storeId 
            AND s.tenantId = current_setting('app.current_tenant', true)::text
        )
    );

-- ============================================
-- RESTAURANT FEATURES
-- ============================================
CREATE POLICY restaurant_table_tenant_isolation ON "RestaurantTable"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "Store" s 
            WHERE s.id = "RestaurantTable".storeId 
            AND s.tenantId = current_setting('app.current_tenant', true)::text
        )
    );

CREATE POLICY menu_item_tenant_isolation ON "MenuItem"
    FOR ALL
    TO authenticated
    USING (tenantId = current_setting('app.current_tenant', true)::text)
    WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text);

-- ============================================
-- UTILITY TABLES
-- ============================================
CREATE POLICY activity_log_tenant_isolation ON "ActivityLog"
    FOR ALL
    TO authenticated
    USING (tenantId = current_setting('app.current_tenant', true)::text)
    WITH CHECK (tenantId = current_setting('app.current_tenant', true)::text);

-- ============================================
-- FUNCTIONS FOR SETTING TENANT CONTEXT
-- ============================================

-- Function to set tenant context from JWT claim
CREATE OR REPLACE FUNCTION set_tenant_context()
RETURNS void AS $$
BEGIN
    -- Get tenant_id from JWT claim
    PERFORM set_config('app.current_tenant', 
        current_setting('request.jwt.claims', true)::json->>'tenant_id', 
        true);
    PERFORM set_config('app.current_user', 
        current_setting('request.jwt.claims', true)::json->>'sub', 
        true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER TO SET CONTEXT ON AUTH
-- ============================================
CREATE OR REPLACE FUNCTION auth.set_tenant_on_auth()
RETURNS trigger AS $$
BEGIN
    -- Store tenant_id in user's JWT claim
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        jsonb_build_object('tenant_id', NEW.tenantId)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger would be created on User table after user creation
-- CREATE TRIGGER set_tenant_context
--     AFTER INSERT ON "User"
--     FOR EACH ROW
--     EXECUTE FUNCTION auth.set_tenant_on_auth();
