# Day 5: Products Catalog & Inventory Management

## Goal
A retailer adds their product catalog — via manual entry, bulk CSV import, or barcode scan — and can track stock levels. Products appear in the POS search instantly.

---

## Why This Day Matters
A store with no products cannot bill. The catalog setup must be:
- Fast: Add 100 products in 5 minutes via CSV
- Easy: Search-based entry with barcode scanner
- Smart: Auto-detect GST rate from HSN code

---

## Customer Journey
```
[Dashboard] → [Products] → [Add Product / Import CSV] → [Products appear in POS]
```

---

## ✅ COMPLETED

### 5.1 Products Page (`/dashboard/inventory`)
- [x] Products tab exists alongside Stock tab in inventory page
- [x] Products list view: name, SKU, category, price, stock
- [x] "Add Product" button → opens add dialog
- [x] Search + filter by category
- [x] Export functionality

### 5.2 Add Product Dialog
- [x] Fields: Name, SKU (auto-generated), Barcode, Category, Brand, HSN Code
- [x] Pricing: MRP, Cost Price, Selling Price
- [x] GST Rate dropdown (0%, 5%, 12%, 18%, 28%)
- [x] Reorder Level
- [x] Validation and error handling

### 5.5 Bulk Import (CSV)
- [x] "Import from CSV" button in Products tab
- [x] File upload with drag & drop
- [x] Preview first 5 rows
- [x] Import via `/api/products/import` endpoint
- [x] Success/error messages

### 5.7 Products API
- [x] GET `/api/products`: List with pagination, search, filter
- [x] POST `/api/products`: Create product
- [x] PUT `/api/products/[id]`: Update product
- [x] DELETE `/api/products/[id]`: Soft delete (isActive = false)
- [x] POST `/api/products/import`: Bulk CSV import

### 5.8 Stock Initialisation
- [x] "Add Stock" dialog in inventory page
- [x] Opening stock entry with batch/expiry support
- [x] Stock movements tracked

## 🔄 PARTIALLY COMPLETE

### 5.3 Product Variants
- [x] Prisma schema supports variants (hasVariants, ProductVariant model)
- [ ] Variant builder UI in Add Product dialog (needs implementation)
- [ ] Variant stock tracking per variant

## ❌ NOT IMPLEMENTED (Phase 2)

### 5.4 Category Management
- Categories are created during onboarding
- Categories are selectable in product form
- Missing: Dedicated category management UI (CRUD)
- Workaround: Categories managed via API or onboarding

### 5.6 Barcode Scanning
- Not implemented
- Would require `html5-qrcode` library
- Current: Barcode field accepts manual input

### 5.9 Product Images
- `imageUrls` field exists in schema
- No Supabase Storage integration
- No image upload UI

---

## Deliverable Status
✅ A retailer can add products via manual entry or CSV import
✅ Products appear in POS search immediately
⚠️ Variants require additional implementation
⚠️ Category management requires dedicated UI

---

## Deliverable
A retailer can add 100 products in 5 minutes via CSV import and start billing immediately after.

---

## CSV Import UI Location
CSV import is a **modal dialog** on the Products page:
```
Products page → "Import CSV" button → Modal dialog
  Step 1: Upload CSV (drag & drop)
  Step 2: Preview first 5 rows
  Step 3: Column mapping (if needed)
  Step 4: Validation results
  Step 5: Import progress + completion
```

## Missing Routes to Create
```
src/app/api/products/[id]/route.ts    # GET, PUT, DELETE
src/app/api/products/import/route.ts  # POST: bulk CSV import
```

## Missing Components to Create
```
src/components/products/
  AddProductDialog.tsx    # Add/edit product modal
  ProductVariantsPanel.tsx # Variant builder
  ImportCSVDialog.tsx     # CSV import modal
  CategoryManager.tsx     # Category CRUD
```

See [CLARIFICATIONS.md](./CLARIFICATIONS.md) for the complete list of all missing routes across all days.

## Dependencies
- Day 3 (onboarding creates default categories)
- Day 4 (POS search needs products)
- Supabase Storage configured
- Prisma product APIs
