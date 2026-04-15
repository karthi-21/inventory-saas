# T039: Verify Purchases & Inventory with Real Data

- **ID**: T039
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: L
- **Depends on**: T004
- **Blocks**: (none)

## Problem

Purchases and Inventory pages are complex with many features that need real-data verification. The inventory page has stock management, product creation, CSV import, and image upload. The purchases page has purchase invoice creation with line items.

## Approach

1. **Inventory** (`/dashboard/inventory`):
   - Verify demo products appear with stock levels
   - Test Add Stock: add stock to an existing product
   - Test Add Product: create a new product with all fields (name, SKU, barcode, MRP, cost/selling price, GST rate, HSN code)
   - Test Stock Adjustment: adjust stock in/out/set
   - Test Low Stock filter: verify products with stock <= threshold appear
   - Test Out of Stock filter
   - Test CSV Import: upload a CSV with 5+ products
   - Test Image Upload: upload a product image

2. **Purchases** (`/dashboard/purchases`):
   - Verify no existing purchase invoices (seed has none)
   - Test Create Purchase Invoice:
     - Select vendor (Samsung India Electronics)
     - Add line items with products
     - Verify auto-fill of price and GST from product selection
     - Set "Receive Now" to update inventory
   - Test Status filter (All, Pending, Partial, Paid)
   - Test search

3. Document any failures as bugs

## Files to Modify

- None — verification only. Failures create new tickets.

## Verification

- [ ] Demo products with stock levels appear in inventory
- [ ] Adding stock updates the stock count
- [ ] Creating a new product works with all fields
- [ ] Stock adjustment (in/out) works correctly
- [ ] Low stock and out-of-stock filters work
- [ ] CSV import creates products from uploaded file
- [ ] Purchase invoice creation works with vendor and line items
- [ ] "Receive Now" updates inventory stock levels
- [ ] Status filter on purchases works