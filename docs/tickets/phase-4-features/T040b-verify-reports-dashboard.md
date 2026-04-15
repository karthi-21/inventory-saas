# T040b: Verify Reports & Dashboard with Real Data

- **ID**: T040b
- **Phase**: 4 - Features
- **Priority**: P2
- **Status**: done
- **Complexity**: M
- **Depends on**: T004
- **Blocks**: (none)

## Problem

The reports page and dashboard both fetch data from API endpoints. Need to verify they display correctly with real data, especially after T040a creates some invoices.

## Approach

1. **Dashboard** (`/dashboard`):
   - Verify stats cards show real numbers (total sales, invoices, products, customers)
   - Verify "Recent Sales" shows invoices from T040a
   - Verify "Low Stock Alerts" shows products below threshold
   - Verify "Top Products" shows products ranked by sales
   - Verify the hardcoded "+12.5%" change indicators (known issue — they're static strings)

2. **Reports** (`/dashboard/reports`):
   - **Sales Report**: select date range, verify daily sales data from T040a invoices
   - **GST Summary**: verify CGST/SGST/IGST breakdown
   - **Inventory Report**: verify stock levels after purchase and sales
   - **Outstanding Credit**: verify customer outstanding amounts
   - Test date range presets (Today, 7 days, 30 days, This Month)
   - Test store filter
   - Note: CSV/Excel export is handled by T033

3. Document any failures as bugs

## Files to Modify

- None — verification only. Failures create new tickets.

## Verification

- [ ] Dashboard stats show real numbers (not zeros)
- [ ] Recent sales list shows created invoices
- [ ] Low stock alerts appear for low-stock products
- [ ] Sales report shows data for the selected date range
- [ ] GST summary shows correct tax breakdown
- [ ] Inventory report shows current stock levels
- [ ] Outstanding credit shows amounts due
- [ ] Date range filters work