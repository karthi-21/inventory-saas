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

## Tasks

### 5.1 Products Page (`/dashboard/inventory`)
- [ ] The inventory page already exists with React Query. Audit and enhance:
  - [ ] Add "Products" tab alongside "Stock" tab
  - [ ] Products list view: image, name, SKU, price, stock, category
  - [ ] "Add Product" button → opens add dialog
  - [ ] Bulk actions: Delete, activate/deactivate, change category
  - [ ] Search + filter by category, stock status

### 5.2 Add Product Dialog
- [ ] Fields:
  - Name (required)
  - SKU (auto-generate if empty)
  - Barcode (scan or type)
  - Category (dropdown)
  - Brand
  - HSN Code (auto-suggest GST rate)
  - MRP (₹)
  - Cost Price (₹)
  - Selling Price (₹) — auto-calculated from margin if provided
  - Margin % (auto-fills selling price)
  - GST Rate (auto from HSN, default 18%)
  - Track inventory toggle
  - Has variants toggle
  - Has serial numbers toggle (if electronics)
  - Has batch/expiry toggle (if grocery/restaurant)
  - Reorder level (stock alert threshold)
  - Image upload
- [ ] Auto-save draft every 30 seconds
- [ ] Validation: MRP must be > selling price (warn if not)
- [ ] "Save & Add Another" button

### 5.3 Product Variants
- [ ] If "Has Variants" enabled:
  - Add variant builder: Size × Color matrix
  - Each variant: SKU, barcode, price (override or inherit), stock
  - Example: Shirt → Size (S,M,L,XL) × Color (Red,Blue) = 8 variants
- [ ] Variants appear as separate search results in POS

### 5.4 Category Management
- [ ] Default categories created during onboarding (already in API)
- [ ] Add "Manage Categories" link in Products page
- [ ] CRUD categories: Name, parent category (for hierarchy), HSN code prefix
- [ ] Drag/drop to reorder

### 5.5 Bulk Import (CSV)
- [ ] "Import from CSV" button
- [ ] Download CSV template with all columns
- [ ] Upload CSV → preview first 5 rows
- [ ] Column mapping UI if headers don't match
- [ ] Validation: Show errors row by row (e.g., "Row 3: Invalid GST rate")
- [ ] Import button: processes in background, shows progress
- [ ] Success: "Imported 95 products. 5 failed (see errors)."

### 5.6 Barcode Scanning
- [ ] Use device camera as barcode scanner (html5-qrcode library)
- [ ] Or USB barcode scanner (acts as keyboard input)
- [ ] In POS: scan barcode → product found → auto-add to cart
- [ ] In Products: scan barcode → if product exists, open edit; if not, prompt to create

### 5.7 Products API Enhancement
- [ ] GET `/api/products`: List with pagination, search, filter
- [ ] POST `/api/products`: Create with all fields
- [ ] PUT `/api/products/[id]`: Update
- [ ] DELETE `/api/products/[id]`: Soft delete (isActive = false)
- [ ] POST `/api/products/import`: Bulk import from CSV

### 5.8 Stock Initialisation
- [ ] When product created → create InventoryStock record at store level
- [ ] "Opening Stock" entry: add initial quantity
- [ ] Track: quantity, location, batch/expiry/serial if applicable

### 5.9 Product Images
- [ ] Upload to Supabase Storage
- [ ] Auto-generate thumbnail
- [ ] Display in POS search results
- [ ] Display in invoice/receipt

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
